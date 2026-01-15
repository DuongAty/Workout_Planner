import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { CreateSetDto } from './dto/create-set.dto';
import { ExerciseTrackingService } from './exersciseTracking.service';
import { ExerciseSet } from './exerciseSet.entity';
import { GetProgressQueryDto } from './dto/get-progress-query.dto';

@Controller('tracking')
export class ExerciseTrackingController {
  constructor(private readonly trackingService: ExerciseTrackingService) {}

  @Post(':exerciseId/set')
  async logSet(
    @Body() createSetDto: CreateSetDto,
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
  ): Promise<ExerciseSet> {
    return this.trackingService.logSet(exerciseId, createSetDto);
  }

  @Get(':exerciseId/progress')
  async getProgress(@Param('exerciseId') exerciseId: string) {
    return this.trackingService.getExerciseProgress(exerciseId);
  }

  @Get('stats/:exerciseId')
  async getStats(@Param('exerciseId') exerciseId: string) {
    return this.trackingService.getStats(exerciseId);
  }

  @Get(':exerciseId/timeline')
  async getTimeline(
    @Param('exerciseId') exerciseId: string,
    @Query() query: GetProgressQueryDto,
  ) {
    return this.trackingService.getTimelineProgress(exerciseId, query);
  }
}
