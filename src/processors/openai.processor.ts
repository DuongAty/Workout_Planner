import { Processor, Process, InjectQueue } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { WorkoutplanService } from 'src/modules/workoutplan/workoutplan.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/user/user.entity';
import { ConfigService } from '@nestjs/config';
import { NutritionService } from 'src/modules/nutrition/nutrition.service';
import { JobService } from 'src/jobs/job.service';
import { AnalyticsService } from 'src/common/service/analytics.service';
import { OpenAIService } from 'src/modules/openai/openai.service';
import { getMonthlyAnalysis } from 'src/modules/workoutplan/prompt/workout-ai.prompt';

@Processor('openai')
export class OpenAIProcessor {
  private readonly logger = new Logger(OpenAIProcessor.name);
  constructor(
    private readonly workoutService: WorkoutplanService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
    private readonly nutritionService: NutritionService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectQueue('email')
    private mailQueue: Queue,
    private jobService: JobService,
    private analyticsService: AnalyticsService,
    private openAIService: OpenAIService,
  ) {}

  @Process('openai-workout-generate')
  async handleOpenAI(job: Job) {
    const { prompt, userId, lang } = job.data;
    this.logger.log(`Processing OpenAI job Workout create for User: ${userId}`);
    try {
      const result = await this.workoutService.generateAndSave(prompt, userId);
      this.logger.log(`OpenAI job completed and saved for ID: ${result.id}`);
      const user = await this.userRepo.findOne({
        where: { id: userId },
        relations: ['token'],
      });
      if (!user) {
        throw new Error('User not found');
      }
      if (user?.token && user.token.length > 0) {
        for (const tokenEntity of user.token) {
          await this.notificationService.sendPushNotification(
            tokenEntity.fcmToken,
            'Lịch tập đã sẵn sàng! 💪',
            `AI đã khởi tạo xong lịch tập ${result.name} cho bạn.` +
              `Xem chi tiết: ${this.configService.get('FRONTEND_URL')}/workout/${result.id}`,
            { workoutId: result.id.toString() },
          );
        }
      }
      await this.jobService.addWorkoutCreatedEmailJob({
        email: user.email,
        fullname: user.fullname,
        name: result.name,
        startDate: result.startDate,
        endDate: result.endDate,
        numExercises: result.numExercises,
        estimatedCalories: result.estimatedCalories,
        link: `${this.configService.get('FRONTEND_URL')}/workout/${result.id}`,
        lang,
      });
      return result;
    } catch (error) {
      this.logger.error(`OpenAI job failed: ${error.message}`);
      throw error;
    }
  }

  @Process('openai-workout-statistics-generate')
  async statisticsCreated(job: Job) {
    const { prompt, userId, email, workoutId } = job.data;
    try {
      const result = await this.workoutService.generateWorkoutStatistics(
        userId,
        workoutId,
        prompt,
      );
      this.logger.log(`OpenAI job completed for ID: ${userId}`);
      if (!email) {
        throw new Error('Email người dùng không tồn tại trong job');
      }
      await this.mailQueue.add('send-workout-analysis', {
        to: email,
        subject: `📊 Phân tích tập luyện chuyên sâu: ${result.workout.name}`,
        template: 'workout-analysis',
        context: result,
      });
      return result;
    } catch (error) {
      this.logger.error(`OpenAI job failed: ${error.message}`);
      throw error;
    }
  }

  @Process('openai-calo-generate')
  async caloriesCreated(job: Job) {
    const { prompt, userId, lang } = job.data;
    this.logger.log(`Processing OpenAI job Meal Analyze for User: ${userId}`);
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        relations: ['token'],
      });
      if (!user) {
        throw new Error('User not found');
      }
      const result: any = await this.nutritionService.logMealAndAnalyze(
        user,
        prompt,
        lang,
      );
      this.logger.log(`OpenAI job completed and saved for ID: ${result.id}`);
      if (user?.token && user.token.length > 0) {
        for (const tokenEntity of user.token) {
          await this.notificationService.sendPushNotification(
            tokenEntity.fcmToken,
            'Đã phân tích xong bữa ăn của bạn.',
            `Xem chi tiết: ${this.configService.get('FRONTEND_URL')}/calories`,
          );
        }
      }
      return result;
    } catch (error) {
      this.logger.error(`OpenAI job failed: ${error.message}`);
      throw error;
    }
  }

  @Process('openai-workout-statistics-monthly')
  async handleAnalysis(job: Job) {
    const { rawMonthlyData, userId, email, fullname, lang } = job.data;
    try {
      const dataString = JSON.stringify(rawMonthlyData);
      const prompt = getMonthlyAnalysis(dataString, lang);
      const data = rawMonthlyData.stats;
      const aiAnalysis =
        await this.openAIService.analyzeMonthlyProgress(prompt);
      await this.mailQueue.add('send-workout-monthly', {
        to: email,
        subject: `🌙 Báo cáo tập luyện tháng & Lời khuyên từ AI`,
        template: 'monthly-report',
        context: {
          fullname,
          data,
          aiAnalysis,
        },
      });
      return {
        data,
        aiAnalysis,
      };
    } catch (error) {
      this.logger.error(`Lỗi phân tích AI: ${error.message}`);
      throw error;
    }
  }
}
