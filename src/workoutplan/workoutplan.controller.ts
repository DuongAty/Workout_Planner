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
import { AppLogger } from 'src/common/helper/logger.helper';

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
    AppLogger.verbose(
      `User "${user.username}" creating an workout`,
      createWorkoutDto,
      'WorkoutController',
    );
    return this.workoutService.createWorkout(createWorkoutDto, user);
  }

  @Get()
  getWorkout(
    @Query() getWorkoutFilter: GetWorkoutFilter,
    @Query() paginationDto: PaginationDto,
    @GetUser() user: User,
  ): Promise<{ data: Workout[]; totalPages: number }> {
    AppLogger.verbose(
      `User "${user.username}" get all workout `,
      getWorkoutFilter,
      'WorkoutController',
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
    AppLogger.verbose(
      `User "${user.username}" get a workout with id `,
      id,
      'WorkoutController',
    );
    return this.workoutService.findOneWorkout(id, user);
  }

  @Delete('/:id')
  deleteWorkoutByid(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    AppLogger.warn(
      `User "${user.username}" delete a workout `,
      id,
      'WorkoutController',
    );
    return this.workoutService.deleteWorkoutById(id, user);
  }

  @Patch('update/:id')
  updateNameWorkout(
    @Param('id') id: string,
    @Body() updateNameWorkoutDto: UpdateNameWorkoutDto,
    @GetUser() user: User,
  ): Promise<Workout> {
    AppLogger.verbose(
      `User "${user.username}" update name workout `,
      updateNameWorkoutDto,
      'WorkoutController',
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
    AppLogger.verbose(
      `User "${user.username}" clone a workout `,
      id,
      'WorkoutController',
    );
    return this.workoutService.cloneWorkout(id, user);
  }
  @Get('/:id/exercises')
  getExercisesByWorkoutId(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<Workout | null> {
    AppLogger.verbose(
      `User "${user.username}" get a workout with exercise `,
      id,
      'WorkoutController',
    );
    return this.workoutService.getExercisesByWorkoutId(id, user);
  }
}
