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
import { AnalyticsService } from '../service/analytics.service';

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
    private readonly analyticsService: AnalyticsService,
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
    this.logger.log('--- Bắt đầu tiến trình phân tích AI tự động ---');
    const users = await this.userRepo.find({
      select: ['id', 'email'],
    });
    if (users.length === 0) {
      this.logger.warn('Không tìm thấy người dùng nào để phân tích.');
      return;
    }
    let totalJobsAdded = 0;
    for (const user of users) {
      try {
        const workoutAnalyses =
          await this.analyticsService.getPastWorkoutsAnalysis(user.id);
        if (!workoutAnalyses || workoutAnalyses.length === 0) {
          continue;
        }
        if (typeof workoutAnalyses === 'string') {
          this.logger.warn(workoutAnalyses);
          continue;
        }
        for (const analysis of workoutAnalyses) {
          await this.openaiQueue.add('openai-workout-statistics-generate', {
            userId: user.id,
            email: user.email,
            prompt: analysis.prompt,
            workoutId: analysis.workoutId,
          });
          totalJobsAdded++;
        }
        this.logger.debug(
          `Đã đẩy ${workoutAnalyses.length} job phân tích cho User: ${user.email}`,
        );
      } catch (err) {
        this.logger.error(
          `Lỗi khi xử lý phân tích cho user ${user.id}: ${err.message}`,
        );
      }
    }
    this.logger.log(
      `--- Đã xếp hàng thành công ${totalJobsAdded} job phân tích cho hệ thống ---`,
    );
  }
}
