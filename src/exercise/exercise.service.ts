import { Injectable, NotFoundException } from '@nestjs/common';
import { Exercise } from './exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { GetExerciseFilter } from './dto/musclegroup-filter.dto';
import { User } from '../user/user.entity';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { WorkoutplanService } from '../workoutplan/workoutplan.service';
import * as fs from 'fs';
@Injectable()
export class ExerciseService {
  constructor(
    private workoutService: WorkoutplanService,
    @InjectRepository(Exercise)
    private readonly exerciseService: Repository<Exercise>,
    private workoutplanService: WorkoutplanService,
  ) {}

  async createExercise(
    workoutId: string,
    createExerciseDto: CreateExerciseDto,
    user: User,
    filePath?: string,
  ): Promise<Exercise> {
    const workout = await this.workoutService.findOneWorkout(workoutId, user);
    const { thumbnail, ...dataExerciseDto } = createExerciseDto;
    const newExercise = this.exerciseService.create({
      ...dataExerciseDto,
      thumbnail: filePath,
      workoutId: workoutId,
      workoutPlan: workout,
      user,
    });
    const savedExercise = await this.exerciseService.save(newExercise);
    await this.workoutplanService.syncNumExercises(workoutId);
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
    const result = await this.exerciseService.delete({ id, user });
    if (result.affected === 0) {
      throw new NotFoundException(`Exercise with id: ${id} not found`);
    }
  }

  async updateExercise(
    id: string,
    updateExerciseDto: UpdateExerciseDto,
    user: User,
    filePath?: string,
  ): Promise<Exercise> {
    const exercise = await this.findOneExercise(id, user);
    if (filePath && exercise.thumbnail) {
      const oldPath = `./${exercise.thumbnail}`;
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    const updateData: Partial<Exercise> = {};
    Object.keys(updateExerciseDto).forEach((key) => {
      if (key !== 'thumbnail') {
        const value = updateExerciseDto[key];
        if (value !== undefined) updateData[key] = value;
      }
    });
    if (filePath) {
      updateData.thumbnail = filePath;
    }
    Object.assign(exercise, updateData);
    await this.exerciseService.save(exercise);
    return exercise;
  }
}
