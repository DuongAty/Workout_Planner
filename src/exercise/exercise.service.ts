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
@Injectable()
export class ExerciseService {
  constructor(
    private workoutService: WorkoutplanService,
    @InjectRepository(Exercise)
    private readonly exerciseService: Repository<Exercise>,
    private uploadService: UploadService,
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

  async createExercise(
    workoutId: string,
    createExerciseDto: CreateExerciseDto,
    user: User,
  ) {
    const workout = await this.workoutService.findOneWorkout(workoutId, user);
    const newExercise = this.exerciseService.create({
      ...createExerciseDto,
      workoutId: workoutId,
      workoutPlan: workout,
      user,
    });
    const savedExercise = await this.exerciseService.save(newExercise);
    await this.workoutService.syncNumExercises(workoutId);
    return savedExercise;
  }

  async getAllExercies(
    getExerciseFilter: GetExerciseFilter,
    paginationDto: PaginationDto,
    user: User,
  ): Promise<{ data: Exercise[]; total: number; totalPages: number }> {
    const { search, muscleGroup, duration } = getExerciseFilter;
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;
    const query = this.exerciseService.createQueryBuilder('exercises');
    query.where({ user });
    if (muscleGroup) {
      query.andWhere('exercsies.muscleGroup = :muscleGroup', { muscleGroup });
    }
    if (duration) {
      query.andWhere('exercises.duration = :duration', { duration });
    }
    if (search) {
      query.andWhere('exercises.name ILIKE :search', {
        search: `%${search}%`,
      });
    }
    query.skip(skip).take(limit);
    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return { data, total, totalPages };
  }

  async findOneExercise(id: string, user: User): Promise<Exercise> {
    try {
      return await this.exerciseService.findOneOrFail({ where: { id, user } });
    } catch (error) {
      throw new NotFoundException(`Exercise with ID "${id}" not found`);
    }
  }

  async deleteExerciseById(id: string, user: User): Promise<void> {
    const exercise = await this.findOneExercise(id, user);
    const workoutId = exercise.workoutId;
    if (exercise.thumbnail) {
      this.uploadService.cleanupFile(exercise.thumbnail);
    }
    if (exercise.videoUrl) {
      this.uploadService.cleanupFile(exercise.videoUrl);
    }
    await this.exerciseService.remove(exercise);
    await this.workoutService.syncNumExercises(workoutId);
  }

  async updateExercise(id: string, dto: UpdateExerciseDto, user: User) {
    const exercise = await this.findOneExercise(id, user);
    const { ...updateData } = dto;
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        exercise[key] = updateData[key];
      }
    });
    return await this.exerciseService.save(exercise);
  }
}
