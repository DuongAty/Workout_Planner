import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { OpenAIService } from '../modules/openai/openai.service';
import { WorkoutplanService } from 'src/modules/workoutplan/workoutplan.service';
import { UsersRepository } from 'src/modules/user/user.repository';
import { NotificationService } from 'src/modules/notification/notification.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/user/user.entity';
import { ConfigService } from '@nestjs/config';

@Processor('openai')
export class OpenAIProcessor {
  private readonly logger = new Logger(OpenAIProcessor.name);
  constructor(
    private readonly workoutService: WorkoutplanService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @Process('openai-generate')
  async handleOpenAI(job: Job) {
    const { prompt, userId } = job.data;
    this.logger.log(`Processing OpenAI job for User: ${userId}`);

    try {
      const result: any = await this.workoutService.generateAndSave(
        prompt,
        userId,
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
              `Xem chi tiết: $${this.configService.get('FRONTEND_URL')}/workout/${result.id}`,
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
}
