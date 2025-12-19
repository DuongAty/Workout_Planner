import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Version,
} from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { Exercise } from './exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { PaginationDto } from 'src/untils/pagination.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { GetExerciseFilter } from './dto/musclegroup-filter.dto';

@Controller('exercise')
export class ExerciseController {
  constructor(private readonly exerciesServide: ExerciseService) {}
  @Version('1')
  @Post(':workoutId/exercises')
  createExercise(
    @Param('workoutId') workoutId: string,
    @Body() createExerciseDto: CreateExerciseDto,
  ): Promise<Exercise> {
    return this.exerciesServide.createExercise(workoutId, createExerciseDto);
  }

  @Version('1')
  @Get()
  getWorkout(
    @Query() getExerciseFilter: GetExerciseFilter,
    @Query() paginationDto: PaginationDto,
  ): Promise<{ data: Exercise[]; totalPages: number }> {
    return this.exerciesServide.getAllExercies(
      getExerciseFilter,
      paginationDto,
    );
  }

  @Version('1')
  @Get('/:id')
  getWorkoutbyId(@Param('id') id: string): Promise<Exercise | null> {
    return this.exerciesServide.findOne(id);
  }

  @Version('1')
  @Delete('delete/:id')
  deleteWorkoutByid(@Param('id') id: string): Promise<void> {
    return this.exerciesServide.deleteExerciseById(id);
  }

  @Version('1')
  @Patch('update/:id')
  updateNameWorkout(
    @Param('id') id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
  ): Promise<Exercise> {
    return this.exerciesServide.updateExercise(id, updateExerciseDto);
  }
}
