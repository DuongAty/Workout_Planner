import { Injectable, NotFoundException } from '@nestjs/common';
import { Exercise } from './exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from 'src/workoutplan/workoutplan.entity';
import { PaginationDto } from 'src/untils/pagination.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { GetExerciseFilter } from './dto/musclegroup-filter.dto';
import { User } from 'src/user/user.entity';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(Workout)
    private readonly workoutRepository: Repository<Workout>,
    @InjectRepository(Exercise)
    private readonly exerciseService: Repository<Exercise>,
  ) {}

  async createExercise(
    workoutId: string,
    createExerciseDto: CreateExerciseDto,
    user: User,
  ): Promise<Exercise> {
    const workout = await this.workoutRepository.findOneBy({
      id: workoutId,
      user,
    });
    if (!workout) {
      throw new NotFoundException(`Workout with ID ${workoutId} not found.`);
    }
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
      query.andWhere('(LOWER(exercies.name) LIKE LOWER(:search))', {
        search: `%${search}%`,
      });
    }
    query.skip(skip).take(limit);
    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return { data, total, totalPages };
  }

  async findOne(id: string, user: User): Promise<Exercise> {
    const exercies = await this.exerciseService.findOne({
      where: { id, user },
    });
    if (!exercies) {
      throw new NotFoundException(`Exercise with ID "${id}" not found`);
    }
    return exercies;
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
    const exercise = await this.exerciseService.findOne({
      where: { id, user },
    });
    if (!exercise) {
      throw new NotFoundException(`Exercise với ID ${id} không tồn tại`);
    }
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
