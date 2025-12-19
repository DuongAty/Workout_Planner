import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Version,
} from '@nestjs/common';
import { WorkoutplanService } from './workoutplan.service';
import { Workout } from './workoutplan.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { PaginationDto } from 'src/untils/pagination.dto';
import { UpdateNameWorkoutDto } from './dto/update-name-dto';
import { GetWorkoutFilter } from './dto/filter-workout.dto';

@Controller('workoutplan')
export class WorkoutplanController {
  private logger = new Logger('WorkoutController');
  constructor(private workoutService: WorkoutplanService) {}
  @Version('1')
  @Post('create')
  createWorkout(@Body() createWorkoutDto: CreateWorkoutDto): Promise<Workout> {
    return this.workoutService.createWorkout(createWorkoutDto);
  }

  @Version('1')
  @Get()
  getWorkout(
    @Query() getWorkoutFilter: GetWorkoutFilter,
    @Query() paginationDto: PaginationDto,
  ): Promise<{ data: Workout[]; totalPages: number }> {
    return this.workoutService.getAllWorkout(getWorkoutFilter, paginationDto);
  }

  @Version('1')
  @Get('/:id')
  getWorkoutbyId(@Param('id') id: string): Promise<Workout | null> {
    return this.workoutService.findOne(id);
  }

  @Version('1')
  @Delete('delete/:id')
  deleteWorkoutByid(@Param('id') id: string): Promise<void> {
    return this.workoutService.deleteWorkoutById(id);
  }

  @Version('1')
  @Patch('update/:id')
  updateNameWorkout(
    @Param('id') id: string,
    @Body() updateNameWorkout: UpdateNameWorkoutDto,
  ): Promise<Workout> {
    const { name } = updateNameWorkout;
    return this.workoutService.updateNameWorkout(id, name);
  }
  @Version('1')
  @Post(':id/clone')
  cloneWorkout(@Param('id') id: string) {
    return this.workoutService.cloneWorkout(id);
  }
}
