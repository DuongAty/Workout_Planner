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
  getChartData(@GetUser() user, @Query() query: GetMeasurementsQueryDto) {
    return this.service.findAllForChart(user, query.key);
  }

  @Get('progress')
  getProgress(@GetUser() user, @Query('key') key: MuscleGroup) {
    return this.service.getProgress(user, key);
  }
}
