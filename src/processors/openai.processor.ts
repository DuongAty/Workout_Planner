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
  ) {}

  @Process('openai-workout-generate')
  async handleOpenAI(job: Job) {
    const { prompt, userId } = job.data;
    this.logger.log(`Processing OpenAI job Workout create for User: ${userId}`);
    try {
      const result: any = await this.workoutService.generateAndSave(
        userId,
        prompt,
      );
      this.logger.log(`OpenAI job completed and saved for ID: ${result.id}`);
      const user = await this.userRepo.findOne({
        where: { id: userId },
        relations: ['token'],
      });

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
      return result;
    } catch (error) {
      this.logger.error(`OpenAI job failed: ${error.message}`);
      throw error;
    }
  }

  @Process('openai-workout-statistics-generate')
  async statisticsCreated(job: Job) {
    const { prompt, userId } = job.data;
    try {
      const result: any =
        await this.workoutService.generateWorkoutStatistics(userId);
      this.logger.log(`OpenAI job completed for ID: ${userId}`);
      await this.mailQueue.add('send-workout-analysis', {
        to: result.user.email,
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
    const { prompt, userId } = job.data;
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
}
