import { AuthGuard } from '@nestjs/passport';
import { BodyMeasurementService } from './body-measurement.service';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GetUser } from '../user/get-user.decorator';
import {
  CreateMeasurementDto,
  GetMeasurementsQueryDto,
} from './dto/measurement.dto';
import { MuscleGroup } from '../exercise/exercise-musclegroup';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AppLogger } from 'src/loggers/app-logger.service';
import { User } from '../user/user.entity';

@Controller('body-measurements')
@UseGuards(AuthGuard())
@ApiBearerAuth('accessToken')
export class BodyMeasurementController {
  constructor(
    private service: BodyMeasurementService,
    private logger: AppLogger,
  ) {
    this.logger.setContext(BodyMeasurementController.name);
  }

  @Post()
  create(@GetUser() user: User, @Body() dto: CreateMeasurementDto) {
    this.logger.logData(
      `User ${user.username} create body measurement`,
      dto,
      BodyMeasurementController.name,
    );
    return this.service.create(user, dto);
  }

  @Get('chart')
  getChartData(@GetUser() user, @Query() query: GetMeasurementsQueryDto) {
    return this.service.findAllForChart(user, query);
  }

  @Get('progress')
  getProgress(@GetUser() user, @Query('key') key: MuscleGroup) {
    return this.service.getProgress(user, key);
  }
}
