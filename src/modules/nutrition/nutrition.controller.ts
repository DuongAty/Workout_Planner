import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { GetUser } from '../user/get-user.decorator';
import { LogMealDto } from './dto/log-meal.dto';
import { User } from '../user/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JobService } from 'src/jobs/job.service';

@Controller('nutrition')
@UseGuards(AuthGuard())
@ApiBearerAuth('accessToken')
export class NutritionController {
  constructor(
    private readonly nutritionService: NutritionService,
    private readonly jobService: JobService,
  ) {}

  @Post('log')
  async logMeal(@Body() dto: LogMealDto, @GetUser() user: User) {
    await this.jobService.addOpenAIJobCalo({
      userId: user.id,
      prompt: dto.meal,
    });
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
