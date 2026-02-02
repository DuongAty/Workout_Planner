import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from 'src/workoutplan/workoutplan.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WorkoutStatus } from 'src/workoutplan/workout-status';

@Injectable()
export class WorkoutReminderService {
  private readonly logger = new Logger(WorkoutReminderService.name);

  constructor(
    @InjectRepository(Workout)
    private readonly workoutRepo: Repository<Workout>,
    @InjectQueue('mail-queue') private readonly mailQueue: Queue,
  ) {}

  async processDailyReminders() {
    const todayString = new Date().toISOString().split('T')[0];
    const todayDisplayString = todayString.split('-').reverse().join('/');
    const workouts = await this.workoutRepo
      .createQueryBuilder('workout')
      .innerJoinAndSelect('workout.user', 'user')
      .innerJoinAndSelect(
        'workout.scheduleItems',
        'item',
        'item.date = :today AND item.status = :status',
        { today: todayString, status: WorkoutStatus.Planned },
      )
      .getMany();
    if (workouts.length === 0) {
      this.logger.log('🔔 Không có lịch tập nào cần nhắc nhở hôm nay.');
      return;
    }
    const jobs = workouts
      .filter((w) => w.user?.email)
      .map((workout) => ({
        name: 'send-reminder-email',
        data: {
          email: workout.user.email,
          fullname: workout.user.fullname,
          workoutName: workout.name,
          numExercises: workout.numExercises,
          date: todayDisplayString,
        },
        opts: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      }));

    await this.mailQueue.addBulk(jobs);
    this.logger.log(`📥 Đã thêm ${jobs.length} yêu cầu gửi mail vào hàng đợi.`);
  }
}
