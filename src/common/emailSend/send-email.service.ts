import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from '../../modules/workoutplan/workoutplan.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WorkoutReminderService {
  private readonly logger = new Logger(WorkoutReminderService.name);

  constructor(
    @InjectRepository(Workout)
    private readonly workoutRepo: Repository<Workout>,
    private readonly mailerService: MailerService,
    private configService: ConfigService,
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
      this.logger.log('🔔 Không có lịch tập nào cần nhắc nhở hôm nay.');
      return;
    }
    for (const workout of workouts) {
      if (!workout.user?.email) continue;
      await this.sendEmail(workout, todayDisplayString);
    }
  }

  private async sendEmail(workout: Workout, date: string) {
    try {
      await this.mailerService.sendMail({
        to: workout.user.email,
        subject: `🚀 SẴN SÀNG CHƯA? Lịch tập ${workout.name.toUpperCase()} hôm nay!`,
        template: 'workout-reminder',
        context: {
          fullname: workout.user.fullname || 'Gymer',
          date,
          workoutName: workout.name,
          numExercises: workout.numExercises,
          url: this.configService.get('FRONTEND_URL') + '/dashboard',
        },
      });
      this.logger.log(`✅ Đã gửi mail cho: ${workout.user.email}`);
    } catch (error) {
      this.logger.error(
        `❌ Lỗi gửi mail cho ${workout.user.email}: ${error.message}`,
      );
    }
  }
}
