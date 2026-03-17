import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WorkoutReminderService } from '../common/emailSend/send-email.service';
import { CRON_EVERY_MONTH } from 'src/constants/constants';

@Injectable()
export class WorkoutReminderTask {
  constructor(private readonly reminderService: WorkoutReminderService) {}
  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async handleCron() {
    await this.reminderService.processDailyReminders();
  }

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async handleDailyAIAnalysis() {
    await this.reminderService.handleDailyAIAnalysis();
  }

  @Cron(CRON_EVERY_MONTH)
  async handleMonthlyAIAnalysis() {
    await this.reminderService.sendMonthlyReport();
  }
}
