import { AuthGuard } from '@nestjs/passport';
import { BodyMeasurementService } from './body-measurement.service';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/user/get-user.decorator';
import {
  CreateMeasurementDto,
  GetMeasurementsQueryDto,
} from './dto/measurement.dto';
import { MuscleGroup } from 'src/exercise/exercise-musclegroup';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('body-measurements')
@UseGuards(AuthGuard())
@ApiBearerAuth('accessToken')
export class BodyMeasurementController {
  constructor(private service: BodyMeasurementService) {}

  @Post()
  create(@GetUser() user, @Body() dto: CreateMeasurementDto) {
    return this.service.create(user, dto);
  }

  @Get('chart')
  @SkipThrottle()
  getChartData(@GetUser() user, @Query() query: GetMeasurementsQueryDto) {
    return this.service.findAllForChart(user, query.key);
  }

  @Get('progress')
  @SkipThrottle()
  getProgress(@GetUser() user, @Query('key') key: MuscleGroup) {
    return this.service.getProgress(user, key);
  }
}
