import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WorkoutReminderService } from 'src/common/emailSend/send-email.service';

@Injectable()
export class WorkoutReminderTask {
  constructor(private readonly reminderService: WorkoutReminderService) {}

  @Cron('46 10 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleCron() {
    await this.reminderService.processDailyReminders();
  }
}
