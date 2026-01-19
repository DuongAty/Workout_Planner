import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from 'src/workoutplan/workoutplan.entity';
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

  @Cron('0 5 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async sendDailyReminders() {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const todayDisplayString = todayString.split('-').reverse().join('/');
    const workouts = await this.workoutRepo.find({ relations: ['user'] });
    for (const workout of workouts) {
      const hasWorkoutToday = workout.scheduleItems?.find(
        (item) =>
          item.date === todayString && item.status.toLowerCase() === 'planned',
      );
      if (hasWorkoutToday && workout.user?.email) {
        try {
          await this.mailerService.sendMail({
            to: workout.user.email,
            subject: `🚀 SẴN SÀNG CHƯA? Lịch tập ${workout.name.toUpperCase()} hôm nay!`,
            template: 'workout-reminder',
            context: {
              fullname: workout.user.fullname || 'Gymer',
              date: todayDisplayString,
              workoutName: workout.name,
              numExercises: workout.numExercises,
              url: this.configService.get('FRONTEND_URL') + '/dashboard',
            },
          });
          this.logger.log(`✅ Đã gửi mail cho: ${workout.user.email}`);
        } catch (error) {
          this.logger.error(`❌ Lỗi gửi mail: ${error.message}`);
        }
      }
    }
  }
}
