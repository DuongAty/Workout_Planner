import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { GetUser } from 'src/user/get-user.decorator';
import { LogMealDto } from './dto/log-meal.dto';
import { User } from 'src/user/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('nutrition')
@UseGuards(AuthGuard())
@ApiBearerAuth('accessToken')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Post('log')
  async logMeal(@Body() dto: LogMealDto, @GetUser() user: User) {
    return this.nutritionService.logMealAndAnalyze(user, dto.meal);
  }

  @Get('daily-summary')
  async getSummary(@GetUser() user: User, @Query('date') date?: string) {
    return this.nutritionService.calculateDailyBalance(user, date);
  }
}
