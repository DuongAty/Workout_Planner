import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WorkoutReminderService } from '../common/emailSend/send-email.service';

@Injectable()
export class WorkoutReminderTask {
  constructor(private readonly reminderService: WorkoutReminderService) {}

  @Cron('0 5 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleCron() {
    await this.reminderService.processDailyReminders();
  }

  @Cron('0 23 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleDailyAIAnalysis() {
    await this.reminderService.handleDailyAIAnalysis();
  }
}
