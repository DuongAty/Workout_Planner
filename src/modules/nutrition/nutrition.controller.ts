import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { GetUser } from '../user/get-user.decorator';
import { LogMealDto } from './dto/log-meal.dto';
import { User } from '../user/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JobService } from 'src/jobs/job.service';
import { I18nContext } from 'nestjs-i18n';
import { AppLogger } from 'src/loggers/app-logger.service';

@Controller('nutrition')
@UseGuards(AuthGuard())
@ApiBearerAuth('accessToken')
export class NutritionController {
  constructor(
    private readonly nutritionService: NutritionService,
    private readonly jobService: JobService,
    private readonly logger: AppLogger,
  ) { this.logger.setContext(NutritionController.name); }

  @Post('log')
  async logMeal(@Body() dto: LogMealDto, @GetUser() user: User) {
    const lang = I18nContext.current()?.lang || 'vi';
    await this.jobService.addOpenAIJobCalo({
      userId: user.id,
      prompt: dto.meal,
      lang,
    });
    this.logger.logData(`User ${user.username} requested AI meal log`);
    return {
      message:
        'Your request is being processed in the background. Please wait!',
    };
  }

  @Get('daily-summary')
  async getSummary(@GetUser() user: User, @Query('date') date?: string) {
    return this.nutritionService.calculateDailyBalance(user, date);
  }
}
