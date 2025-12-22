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
import { ExerciseService } from './exercise.service';
import { Exercise } from './exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { PaginationDto } from '../untils/pagination.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { GetExerciseFilter } from './dto/musclegroup-filter.dto';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AppLogger } from '../common/helper/app-logger.service';

@Controller({ path: 'exercises', version: '1' })
@UseGuards(AuthGuard())
@ApiBearerAuth('accessToken')
export class ExerciseController {
  constructor(
    private readonly exerciseService: ExerciseService,
    private logger: AppLogger,
  ) {}

  @Post(':workoutId/')
  @UseInterceptors(ClassSerializerInterceptor)
  createExercise(
    @Param('workoutId') workoutId: string,
    @Body() createExerciseDto: CreateExerciseDto,
    @GetUser() user: User,
  ): Promise<Exercise> {
    this.logger.verbose(
      `User "${user.username}" creating an exercise`,
      createExerciseDto,
      ExerciseController.name,
    );
    return this.exerciseService.createExercise(
      workoutId,
      createExerciseDto,
      user,
    );
  }

  @Get()
  getExersices(
    @Query() getExerciseFilter: GetExerciseFilter,
    @Query() paginationDto: PaginationDto,
    @GetUser() user: User,
  ): Promise<{ data: Exercise[]; totalPages: number }> {
    this.logger.verbose(
      `User "${user.username}" get all exercise`,
      getExerciseFilter,
      ExerciseController.name,
    );
    return this.exerciseService.getAllExercies(
      getExerciseFilter,
      paginationDto,
      user,
    );
  }

  @Get('/:id')
  getExercisebyId(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<Exercise | null> {
    this.logger.verbose(
      `User "${user.username}" get an exercise with id`,
      id,
      ExerciseController.name,
    );
    return this.exerciseService.findOneExercise(id, user);
  }

  @Delete('/:id')
  deleteExerciseByid(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    this.logger.verbose(
      `User "${user.username}" delete an exercise`,
      id,
      ExerciseController.name,
    );
    return this.exerciseService.deleteExerciseById(id, user);
  }

  @Patch('/:id')
  updateExercise(
    @Param('id') id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
    @GetUser() user: User,
  ): Promise<Exercise> {
    this.logger.verbose(
      `User "${user.username}" update an exercise with data`,
      updateExerciseDto,
      ExerciseController.name,
    );
    return this.exerciseService.updateExercise(id, updateExerciseDto, user);
  }
}
