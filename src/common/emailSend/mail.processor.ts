import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'send-reminder-email') {
      const { email, fullname, workoutName, numExercises, date } = job.data;
      try {
        await this.mailerService.sendMail({
          to: email,
          subject: `🚀 SẴN SÀNG CHƯA? Lịch tập ${workoutName.toUpperCase()} hôm nay!`,
          template: 'workout-reminder',
          context: {
            fullname: fullname || 'Gymer',
            date,
            workoutName,
            numExercises,
            url: this.configService.get('FRONTEND_URL') + '/dashboard',
          },
        });
        this.logger.log(`✅ Job ${job.id}: Đã gửi mail cho ${email}`);
      } catch (error) {
        this.logger.error(`❌ Job ${job.id} lỗi: ${error.message}`);
        throw error;
      }
    }
  }
}