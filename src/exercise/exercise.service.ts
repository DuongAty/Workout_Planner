import { Injectable, NotFoundException } from '@nestjs/common';
import { Exercise } from './exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { GetExerciseFilter } from './dto/musclegroup-filter.dto';
import { User } from '../user/user.entity';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { WorkoutplanService } from '../workoutplan/workoutplan.service';
import { UploadService } from '../common/upload/upload.service';
import { applyExerciseFilters } from 'src/common/filter/exercese-filter';
import { TransactionService } from 'src/common/transaction/transaction';
@Injectable()
export class ExerciseService {
  constructor(
    private workoutService: WorkoutplanService,
    @InjectRepository(Exercise)
    private readonly exerciseService: Repository<Exercise>,
    private uploadService: UploadService,
    private transactionService: TransactionService,
  ) {}

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
      const exercise = manager.create(Exercise, {
        ...dto,
        user,
        workoutPlan: workout,
        workoutId,
      });
      const savedExercise = await manager.save(exercise);
      await this.workoutService.syncNumExercises(workoutId, manager);
      return savedExercise;
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
    query.where({ user });
    applyExerciseFilters(query, getExerciseFilter, 'exercises');
    query.skip(skip).take(limit);
    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return { data, total, totalPages };
  }

  async findOneExercise(id: string, user: User): Promise<Exercise> {
    try {
      return await this.exerciseService.findOneOrFail({
        where: { id, user: { id: user.id } },
      });
    } catch (error) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
  }

  async deleteExerciseById(id: string, user: User): Promise<void> {
    return this.transactionService.run(async (manager) => {
      const exercise = await this.findOneExercise(id, user);
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
      return await manager.save(exercise);
    });
  }
}
