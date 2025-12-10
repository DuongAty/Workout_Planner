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

@Controller('workoutplan')
export class WorkoutplanController {
  private logger = new Logger('TaskController');
  constructor(private workoutService: WorkoutplanService) {}
  @Version('1')
  @Post('create')
  createWorkout(@Body() createWorkoutDto: CreateWorkoutDto): Promise<Workout> {
    // this.logger.verbose(
    //   `${user.username} creating new task. Data ${JSON.stringify(createTaskDto)}`,
    // );
    return this.workoutService.createTask(createWorkoutDto);
  }

  @Version('1')
  @Get()
  getTasks(
    @Query() paginationDto: PaginationDto,
  ): Promise<{ data: Workout[]; totalPages: number }> {
    // this.logger.verbose(
    //   `User "${user.username}" retrieving all task. Filter ${JSON.stringify(filterDto)}`,
    // );
    return this.workoutService.getAllWorkout(paginationDto);
  }

  @Version('1')
  @Get('/:id')
  getTaskbyId(@Param('id') id: string): Promise<Workout | null> {
    return this.workoutService.findOne(id);
  }

  @Version('1')
  @Delete('delete/:id')
  deleteTaskByid(@Param('id') id: string): Promise<void> {
    // this.logger.verbose(`${user.username} delete a task with ID: ${id}`);
    return this.workoutService.deleteWorkoutById(id);
  }

  @Version('1')
  @Patch('update/:id/status')
  updateNameWorkout(
    @Param('id') id: string,
    @Body() updateNameWorkout: UpdateNameWorkoutDto,
  ): Promise<Workout> {
    const { name } = updateNameWorkout;
    // this.logger.verbose(
    //   `${user.username} update status task with new Data ${JSON.stringify(updateTaskStatusDto)}`,
    // );
    return this.workoutService.updateNameWorkout(id, name);
  }
}
