import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
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
import { UpdateNameWorkoutDto } from './dto/update-name-dto';
import { GetWorkoutFilter } from './dto/filter-workout.dto';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AppLogger } from '../common/logger/app-logger.service';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { WEThrottle } from 'src/common/decorators/throttle.decorator';

@Controller({ path: 'workoutplans', version: '1' })
@UseGuards(AuthGuard())
@ApiBearerAuth('accessToken')
export class WorkoutplanController {
  constructor(
    private workoutService: WorkoutplanService,
    private logger: AppLogger,
  ) {}

  @Post()
  @WEThrottle()
  @UseInterceptors(ClassSerializerInterceptor)
  create(
    @Body() createWorkoutDto: CreateWorkoutDto,
    @GetUser() user: User,
  ): Promise<Workout> {
    this.logger.verbose(
      `User "${user.username}" creating a workout`,
      createWorkoutDto,
      WorkoutplanController.name,
    );
    return this.workoutService.createWorkout(createWorkoutDto, user);
  }

  @Get()
  @WEThrottle()
  getAll(
    @Query() getWorkoutFilter: GetWorkoutFilter,
    @Query() paginationDto: PaginationDto,
    @GetUser() user: User,
  ): Promise<{ data: Workout[]; totalPages: number }> {
    this.logger.verbose(
      `User "${user.username}" get all workout `,
      getWorkoutFilter,
      WorkoutplanController.name,
    );
    return this.workoutService.getAllWorkout(
      getWorkoutFilter,
      paginationDto,
      user,
    );
  }

  @Get('/:id')
  @WEThrottle()
  getOne(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<Workout | null> {
    this.logger.verbose(
      `User "${user.username}" get a workout with id `,
      id,
      WorkoutplanController.name,
    );
    return this.workoutService.findOneWorkout(id, user);
  }

  @Delete('/:id')
  @WEThrottle()
  delete(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    this.logger.warn(
      `User "${user.username}" delete a workout `,
      id,
      WorkoutplanController.name,
    );
    return this.workoutService.deleteWorkoutById(id, user);
  }

  @Patch('/:id')
  @WEThrottle()
  update(
    @Param('id') id: string,
    @Body() updateNameWorkoutDto: UpdateNameWorkoutDto,
    @GetUser() user: User,
  ): Promise<Workout> {
    this.logger.verbose(
      `User "${user.username}" update name workout `,
      updateNameWorkoutDto,
      WorkoutplanController.name,
    );
    return this.workoutService.updateNameWorkout(
      id,
      updateNameWorkoutDto.name,
      user,
    );
  }

  @Post(':id/clone')
  @WEThrottle()
  @UseInterceptors(ClassSerializerInterceptor)
  clone(@Param('id') id: string, @GetUser() user: User) {
    this.logger.verbose(
      `User "${user.username}" clone a workout `,
      id,
      WorkoutplanController.name,
    );
    return this.workoutService.cloneWorkout(id, user);
  }

  @Get('/:id/exercises')
  @WEThrottle()
  getExercisesById(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<Workout | null> {
    this.logger.verbose(
      `User "${user.username}" get a workout with exercise `,
      id,
      WorkoutplanController.name,
    );
    return this.workoutService.getExercisesByWorkoutId(id, user);
  }
}
