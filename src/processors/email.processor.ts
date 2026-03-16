import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailerService: MailerService) {}

  @Process('send-email')
  async handleSendEmail(job: Job) {
    const { email, fullname, workoutName, date, numExercises, url } = job.data;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `🚀 SẴN SÀNG CHƯA? Lịch tập ${workoutName.toUpperCase()} hôm nay!`,
        template: 'workout-reminder',
        context: {
          fullname,
          date,
          workoutName,
          numExercises,
          url,
        },
      });

      this.logger.log(`✅ Sent email to ${email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${email}`);
      throw error;
    }
  }
}
