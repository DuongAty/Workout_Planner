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

@Controller({ path: 'exercises', version: '1' })
@UseGuards(AuthGuard())
@ApiBearerAuth('accessToken')
export class ExerciseController {
  private logger = new Logger('ExerciseController');
  constructor(private readonly exerciseService: ExerciseService) {}

  @Post(':workoutId/')
  @UseInterceptors(ClassSerializerInterceptor)
  createExercise(
    @Param('workoutId') workoutId: string,
    @Body() createExerciseDto: CreateExerciseDto,
    @GetUser() user: User,
  ): Promise<Exercise> {
    this.logger.verbose(
      `User "${user.username}" create a exercise with Data: ${JSON.stringify(createExerciseDto)}`,
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
      `User "${user.username}" get all exercise with Data: ${JSON.stringify(getExerciseFilter)}`,
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
      `User "${user.username}" get a exercise with id: ${JSON.stringify(id)}`,
    );
    return this.exerciseService.findOneExercise(id, user);
  }

  @Delete('/:id')
  deleteExerciseByid(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    this.logger.verbose(
      `User "${user.username}" delete a exercise with id: ${JSON.stringify(id)}`,
    );
    return this.exerciseService.deleteExerciseById(id, user);
  }

  @Patch('update/:id')
  updateExercise(
    @Param('id') id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
    @GetUser() user: User,
  ): Promise<Exercise> {
    this.logger.verbose(
      `User "${user.username}" update a exercise with Data: ${JSON.stringify(updateExerciseDto)}`,
    );
    return this.exerciseService.updateExercise(id, updateExerciseDto, user);
  }
}
