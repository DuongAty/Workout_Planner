import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Exercise } from './exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { GetExerciseFilter } from './dto/musclegroup-filter.dto';
import { User } from '../user/user.entity';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { WorkoutplanService } from '../workoutplan/workoutplan.service';
import { UploadService } from '../../upload/upload.service';
import { applyExerciseFilters } from '../../filters/exercese-filter';
import { TransactionService } from '../../transaction/transaction';
import { AppLogger } from 'src/loggers/app-logger.service';
@Injectable()
export class ExerciseService {
  constructor(
    private workoutService: WorkoutplanService,
    @InjectRepository(Exercise)
    private readonly exerciseService: Repository<Exercise>,
    private uploadService: UploadService,
    private transactionService: TransactionService,
    private logger: AppLogger,
  ) {
    this.logger.setContext(ExerciseService.name);
  }

  async uploadMedia(
    id: string,
    user: User,
    filePath: string,
    type: 'thumbnail' | 'videoUrl',
  ): Promise<Exercise> {
    const exercise = await this.findOneExercise(id, user);
    if (type === 'thumbnail' && exercise.thumbnail) {
      this.uploadService.cleanupFile(exercise.thumbnail);
      exercise.thumbnail = filePath;
    } else if (type === 'videoUrl' && exercise.videoUrl) {
      this.uploadService.cleanupFile(exercise.videoUrl);
      exercise.videoUrl = filePath;
    } else {
      exercise[type] = filePath;
    }
    return await this.exerciseService.save(exercise);
  }

  async createExercise(workoutId: string, dto: CreateExerciseDto, user: User) {
    return this.transactionService.run(async (manager) => {
      const workout = await this.workoutService.findOneWorkout(workoutId, user);
      try {
        const exercise = manager.create(Exercise, {
          ...dto,
          user,
          workoutPlan: workout,
          workoutId,
        });
        const savedExercise = await manager.save(exercise);
        await this.workoutService.syncNumExercises(workoutId, manager);
        this.logger.logData(
          'Created exercise',
          savedExercise,
          ExerciseService.name,
        );
        return savedExercise;
      } catch (err) {
        this.logger.error(
          'Failed to create exercise',
          err,
          ExerciseService.name,
        );
        throw new BadRequestException('Lỗi DB: ' + err.message);
      }
    });
  }

  async getAllExercies(
    getExerciseFilter: GetExerciseFilter,
    paginationDto: PaginationDto,
    user: User,
  ): Promise<{ data: Exercise[]; total: number; totalPages: number }> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;
    const query = this.exerciseService.createQueryBuilder('exercises');
    query
      .innerJoin('exercises.workoutPlan', 'workout')
      .where('workout.userId = :userId', { userId: user.id });
    applyExerciseFilters(query, getExerciseFilter, 'exercises');
    query.skip(skip).take(limit);
    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    this.logger.logData(
      'Get all exercises',
      { data, total, totalPages },
      ExerciseService.name,
    );
    return { data, total, totalPages };
  }

  async findOneExercise(id: string, user: User): Promise<Exercise> {
    try {
      this.logger.logData(
        `User ${user.username} findOneExercise with Id: `,
        id,
        ExerciseService.name,
      );
      return await this.exerciseService.findOneOrFail({
        where: { id, workoutPlan: { user: { id: user.id } } },
      });
    } catch (error) {
      this.logger.error(
        `User ${user.username} findOneExercise error: `,
        error,
        ExerciseService.name,
      );
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
  }

  async deleteExerciseById(id: string, user: User): Promise<void> {
    return this.transactionService.run(async (manager) => {
      const exercise = await this.findOneExercise(id, user);
      this.logger.logData(
        `User ${user.username} delete exercise with Id: `,
        id,
        ExerciseService.name,
      );
      await manager.softRemove(exercise);
      await this.workoutService.syncNumExercises(exercise.workoutId, manager);
      if (exercise.thumbnail)
        this.uploadService.cleanupFile(exercise.thumbnail);
      if (exercise.videoUrl) this.uploadService.cleanupFile(exercise.videoUrl);
    });
  }

  async updateExercise(id: string, dto: UpdateExerciseDto, user: User) {
    return this.transactionService.run(async (manager) => {
      const exercise = await this.findOneExercise(id, user);
      Object.assign(exercise, dto);
      this.logger.logData(
        `User ${user.username} update exercise with Id: `,
        id,
        ExerciseService.name,
      );
      return await manager.save(exercise);
    });
  }
}
