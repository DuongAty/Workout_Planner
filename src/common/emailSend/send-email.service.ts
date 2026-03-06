import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from '../../modules/workoutplan/workoutplan.entity';
import { JobService } from '../../jobs/job.service';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { User } from 'src/modules/user/user.entity';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class WorkoutReminderService {
  private readonly logger = new Logger(WorkoutReminderService.name);

  constructor(
    @InjectRepository(Workout)
    private readonly workoutRepo: Repository<Workout>,
    private readonly jobService: JobService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectQueue('openai')
    private readonly openaiQueue: Queue,
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
    const currentLang = I18nContext.current()?.lang || 'vi';
    for (const workout of workouts) {
      if (!workout.user?.email) continue;
      await this.jobService.addEmailJob({
        email: workout.user.email,
        fullname: workout.user.fullname || 'Gymer',
        workoutName: workout.name,
        date: todayDisplayString,
        numExercises: workout.numExercises,
        url: this.configService.get('FRONTEND_URL') + '/dashboard',
        lang: currentLang,
      });
    }

    this.logger.log(`Đã thêm ${workouts.length} email jobs`);
  }

  async handleDailyAIAnalysis() {
    this.logger.log(
      '--- Bắt đầu tiến trình phân tích AI tự động (5h sáng) ---',
    );
    const users = await this.userRepo.find({
      select: ['id', 'email'],
    });
    if (users.length === 0) return;
    for (const user of users) {
      try {
        await this.openaiQueue.add(
          'openai-workout-statistics-generate',
          {
            userId: user.id,
            prompt: 'Phân tích dữ liệu tập luyện của tôi',
          },
          {
            attempts: 3,
            backoff: 5000,
            removeOnComplete: true,
          },
        );

        this.logger.debug(
          `Đã đẩy job phân tích vào hàng đợi cho User: ${user.email}`,
        );
      } catch (err) {
        this.logger.error(
          `Lỗi khi đẩy job cho user ${user.id}: ${err.message}`,
        );
      }
    }
    this.logger.log(
      `--- Đã xếp hàng phân tích cho ${users.length} người dùng ---`,
    );
  }
}
