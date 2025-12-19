import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WorkoutplanService } from './workoutplan.service';
import { Workout } from './workoutplan.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { PaginationDto } from '../untils/pagination.dto';
import { UpdateNameWorkoutDto } from './dto/update-name-dto';
import { GetWorkoutFilter } from './dto/filter-workout.dto';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller({ path: 'workoutplans', version: '1' })
@UseGuards(AuthGuard())
@ApiBearerAuth('accessToken')
export class WorkoutplanController {
  private logger = new Logger('WorkoutController');
  constructor(private workoutService: WorkoutplanService) {}
  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  createWorkout(
    @Body() createWorkoutDto: CreateWorkoutDto,
    @GetUser() user: User,
  ): Promise<Workout> {
    this.logger.verbose(
      `User "${user.username}" create a workout with Data: ${JSON.stringify(createWorkoutDto)}`,
    );
    return this.workoutService.createWorkout(createWorkoutDto, user);
  }

  @Get()
  getWorkout(
    @Query() getWorkoutFilter: GetWorkoutFilter,
    @Query() paginationDto: PaginationDto,
    @GetUser() user: User,
  ): Promise<{ data: Workout[]; totalPages: number }> {
    this.logger.verbose(
      `User "${user.username}" get all workout with Data: ${JSON.stringify(getWorkoutFilter)}`,
    );
    return this.workoutService.getAllWorkout(
      getWorkoutFilter,
      paginationDto,
      user,
    );
  }

  @Get('/:id')
  getWorkoutbyId(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<Workout | null> {
    this.logger.verbose(
      `User "${user.username}" get a workout with Id: ${JSON.stringify(id)}`,
    );
    return this.workoutService.findOneWorkout(id, user);
  }

  @Delete('/:id')
  deleteWorkoutByid(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    this.logger.verbose(
      `User "${user.username}" delete a workout with id: ${JSON.stringify(id)}`,
    );
    return this.workoutService.deleteWorkoutById(id, user);
  }

  @Patch('update/:id')
  updateNameWorkout(
    @Param('id') id: string,
    @Body() updateNameWorkoutDto: UpdateNameWorkoutDto,
    @GetUser() user: User,
  ): Promise<Workout> {
    this.logger.verbose(
      `User "${user.username}" update a workout with Data: ${JSON.stringify(updateNameWorkoutDto)}`,
    );
    return this.workoutService.updateNameWorkout(
      id,
      updateNameWorkoutDto.name,
      user,
    );
  }
  @Post(':id/clone')
  @UseInterceptors(ClassSerializerInterceptor)
  cloneWorkout(@Param('id') id: string, @GetUser() user: User) {
    this.logger.verbose(
      `User "${user.username}" clone a workout with Data: ${JSON.stringify(id)}`,
    );
    return this.workoutService.cloneWorkout(id, user);
  }
  @Get('/:id/exercises')
  getExercisesByWorkoutId(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<Workout | null> {
    this.logger.verbose(
      `User "${user.username}" get a workout with exercise. Id: ${JSON.stringify(id)}`,
    );
    return this.workoutService.getExercisesByWorkoutId(id, user);
  }
}
