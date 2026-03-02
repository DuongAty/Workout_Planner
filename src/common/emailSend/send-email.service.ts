import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from '../../modules/workoutplan/workoutplan.entity';
import { JobService } from '../../jobs/job.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WorkoutReminderService {
  private readonly logger = new Logger(WorkoutReminderService.name);

  constructor(
    @InjectRepository(Workout)
    private readonly workoutRepo: Repository<Workout>,
    private readonly jobService: JobService,
    private readonly configService: ConfigService,
  ) {}

  async processDailyReminders() {
    const todayString = new Date().toISOString().split('T')[0];
    const todayDisplayString = todayString.split('-').reverse().join('/');

    const workouts = await this.workoutRepo.find({
      where: {
        scheduleItems: {
          date: todayString,
          status: 'planned',
        },
      },
      relations: {
        user: true,
        scheduleItems: true,
      },
    });

    if (workouts.length === 0) {
      this.logger.log('Không có lịch tập hôm nay');
      return;
    }

    for (const workout of workouts) {
      if (!workout.user?.email) continue;

      await this.jobService.addEmailJob({
        email: workout.user.email,
        fullname: workout.user.fullname || 'Gymer',
        workoutName: workout.name,
        date: todayDisplayString,
        numExercises: workout.numExercises,
        url: this.configService.get('FRONTEND_URL') + '/dashboard',
      });
    }

    this.logger.log(`Đã thêm ${workouts.length} email jobs`);
  }
}