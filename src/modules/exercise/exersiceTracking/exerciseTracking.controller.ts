import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateSetDto } from './dto/create-set.dto';
import { ExerciseTrackingService } from './exersciseTracking.service';
import { ExerciseSet } from './exerciseSet.entity';
import { GetProgressQueryDto } from './dto/get-progress-query.dto';
import { GetUser } from 'src/modules/user/get-user.decorator';
import { User } from 'src/modules/user/user.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AppLogger } from 'src/loggers/app-logger.service';

@Controller('tracking')
@UseGuards(AuthGuard())
@ApiBearerAuth('accessToken')
export class ExerciseTrackingController {
  constructor(
    private readonly trackingService: ExerciseTrackingService,
    private logger: AppLogger,
  ) {
    this.logger.setContext(ExerciseTrackingController.name);
  }

  @Post(':exerciseId/set')
  async logSet(
    @GetUser() user: User,
    @Body() createSetDto: CreateSetDto,
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
  ): Promise<ExerciseSet> {
    this.logger.logData(
      `User ${user.username} log set for exercise with Id: `,
      exerciseId,
      ExerciseTrackingController.name,
    );
    return this.trackingService.logSet(user, exerciseId, createSetDto);
  }

  @Get(':exerciseId/progress')
  async getProgress(
    @GetUser() user: User,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.trackingService.getExerciseProgress(user, exerciseId);
  }

  @Get('stats/:exerciseId')
  async getStats(
    @GetUser() user: User,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.trackingService.getStats(user, exerciseId);
  }

  @Get(':exerciseId/timeline')
  async getTimeline(
    @GetUser() user: User,
    @Param('exerciseId') exerciseId: string,
    @Query() query: GetProgressQueryDto,
  ) {
    return this.trackingService.getTimelineProgress(user, exerciseId, query);
  }
}
