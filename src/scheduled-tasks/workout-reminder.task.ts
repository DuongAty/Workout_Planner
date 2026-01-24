// src/scheduled-tasks/workout-reminder.task.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WorkoutReminderService } from 'src/common/emailSend/send-email.service';

@Injectable()
export class WorkoutReminderTask {
  constructor(private readonly reminderService: WorkoutReminderService) {}

  @Cron('0 5 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleCron() {
    await this.reminderService.processDailyReminders();
  }
}
