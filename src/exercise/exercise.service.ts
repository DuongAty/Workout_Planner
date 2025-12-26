import { Injectable, NotFoundException } from '@nestjs/common';
import { Exercise } from './exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from '../workoutplan/workoutplan.entity';
import { PaginationDto } from '../common/untils/pagination.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { GetExerciseFilter } from './dto/musclegroup-filter.dto';
import { User } from '../user/user.entity';
import { WorkoutplanService } from 'src/workoutplan/workoutplan.service';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
@Injectable()
export class ExerciseService {
  constructor(
    private readonly workoutService: WorkoutplanService,
    @InjectRepository(Exercise)
    private readonly exerciseService: Repository<Exercise>,
  ) {}

  async createExercise(
    workoutId: string,
    createExerciseDto: CreateExerciseDto,
    user: User,
  ): Promise<Exercise> {
    const workout = await this.workoutService.findOneWorkout(workoutId, user);
    const newExercise = this.exerciseService.create({
      ...createExerciseDto,
      workoutId: workoutId,
      workoutPlan: workout,
      user,
    });
    return this.exerciseService.save(newExercise);
  }

  async getAllExercies(
    getExerciseFilter: GetExerciseFilter,
    paginationDto: PaginationDto,
    user: User,
  ): Promise<{ data: Exercise[]; total: number; totalPages: number }> {
    const { search, muscleGroup } = getExerciseFilter;
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;
    const query = this.exerciseService.createQueryBuilder('exercies');
    query.where({ user });
    if (muscleGroup) {
      query.andWhere('exercies.muscleGroup = :muscleGroup', { muscleGroup });
    }
    if (search) {
      query.andWhere('exercies.name ILIKE :search', {
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
      return await this.exerciseService.findOrFail({ id, user });
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
  ): Promise<Exercise> {
    const exercise = await this.findOneExercise(id, user);
    const updateData: Partial<Exercise> = {};
    Object.keys(updateExerciseDto).forEach((key) => {
      const value = updateExerciseDto[key];
      if (value !== undefined) updateData[key] = value;
    });
    Object.assign(exercise, updateData);
    await this.exerciseService.save(exercise);
    return exercise;
  }
}
