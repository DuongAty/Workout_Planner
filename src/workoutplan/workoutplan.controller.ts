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
import { UpdateWorkoutDto, UpdateScheduleDto } from './dto/update-name-dto';
import { GetWorkoutFilter } from './dto/filter-workout.dto';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AppLogger } from '../common/logger/app-logger.service';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { GetExerciseFilter } from 'src/exercise/dto/musclegroup-filter.dto';
import { WorkoutStatus } from './workout-status';
@Controller({ path: 'workoutplans', version: '1' })
@UseGuards(AuthGuard())
@ApiBearerAuth('accessToken')
export class WorkoutplanController {
  constructor(
    private workoutService: WorkoutplanService,
    private logger: AppLogger,
  ) {}

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  create(@Body() dto: CreateWorkoutDto, @GetUser() user: User) {
    return this.workoutService.createRecurringWorkout(dto, user);
  }

  @Patch('check-missed-all')
  async checkAllMissedWorkouts(@GetUser() user: User) {
    return await this.workoutService.checkMissedWorkouts(user);
  }

  @Patch(':id/item-status')
  async updateItemStatus(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() body: { date: string; status: WorkoutStatus },
  ) {
    return await this.workoutService.updateItemStatus(id, user, body.status);
  }

  @Patch(':id/reschedule-item')
  async rescheduleItem(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.workoutService.updateSchedule(id, user, {
      oldDate: dto.oldDate,
      newDate: dto.newDate,
    });
  }

  @Get()
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
  delete(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    this.logger.warn(
      `User "${user.username}" delete a workout `,
      id,
      WorkoutplanController.name,
    );
    return this.workoutService.deleteWorkoutById(id, user);
  }

  @Patch('/:id')
  update(
    @Param('id') id: string,
    @Body() updateWorkoutDto: UpdateWorkoutDto,
    @GetUser() user: User,
  ) {
    this.logger.verbose(
      `User "${user.username}" update workout `,
      updateWorkoutDto,
      WorkoutplanController.name,
    );
    return this.workoutService.updateWorkout(id, user, updateWorkoutDto);
  }

  @Post(':id/clone')
  @UseInterceptors(ClassSerializerInterceptor)
  clone(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body()
    cloneScheduleData: {
      name?: string;
      startDate: string;
      endDate: string;
      daysOfWeek: number[];
    },
  ) {
    this.logger.verbose(
      `User "${user.username}" clone a workout `,
      id,
      WorkoutplanController.name,
    );
    return this.workoutService.cloneWorkout(id, user, cloneScheduleData);
  }

  @Get(':id/exercises')
  async getExercises(
    @Param('id') id: string,
    @Query() getExerciseFilter: GetExerciseFilter,
    @GetUser() user: User,
  ) {
    return this.workoutService.getExercisesByWorkoutId(id, user, {
      muscleGroup: getExerciseFilter.muscleGroup,
      search: getExerciseFilter.search,
      duration: getExerciseFilter.duration,
    });
  }
}
