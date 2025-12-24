import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from './workoutplan.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { GetWorkoutFilter } from './dto/filter-workout.dto';
import { Exercise } from '../exercise/exercise.entity';
import { User } from '../user/user.entity';
import { PaginationDto } from '../common/pagination/pagination.dto';

@Injectable()
export class WorkoutplanService {
  constructor(
    @InjectRepository(Workout)
    private workoutPlanService: Repository<Workout>,
    @InjectRepository(Exercise)
    private exerciseService: Repository<Exercise>,
  ) {}

  async syncNumExercises(workoutId: string): Promise<void> {
    const count = await this.exerciseService
      .createQueryBuilder('exercise')
      .where('exercise.workoutId = :workoutId', { workoutId })
      .getCount();
    await this.workoutPlanService.update(workoutId, {
      numExercises: count,
    });
  }

  async createWorkout(
    createWorkoutDto: CreateWorkoutDto,
    user: User,
  ): Promise<Workout> {
    const { name } = createWorkoutDto;
    const workout = this.workoutPlanService.create({
      name,
      user,
    });
    return await this.workoutPlanService.save(workout);
  }

  async getAllWorkout(
    getWorkoutFilter: GetWorkoutFilter,
    paginationDto: PaginationDto,
    user: User,
  ): Promise<{ data: Workout[]; total: number; totalPages: number }> {
    const { page, limit } = paginationDto;
    const { search, numExercises } = getWorkoutFilter;
    const skip = (page - 1) * limit;
    const query = this.workoutPlanService.createQueryBuilder('workout');
    query.where({ user });
    if (search) {
      query.andWhere('workout.name ILIKE :search', {
        search: `%${search}%`,
      });
    }
    if (numExercises !== undefined && numExercises !== null) {
      query.andWhere('workout.numExercises = :numExercises', { numExercises });
    }
    query.skip(skip).take(limit);
    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return { data, total, totalPages };
  }

  async findOneWorkout(
    id: string,
    user: User,
    relations: string[] = [],
  ): Promise<Workout> {
    try {
      return await this.workoutPlanService.findOneOrFail({
        where: { id, user },
        relations,
      });
    } catch (error) {
      throw new NotFoundException(`Workout with ID "${id}" not found`);
    }
  }

  async deleteWorkoutById(id: string, user: User): Promise<void> {
    const result = await this.workoutPlanService.delete({ id, user });
    if (result.affected === 0) {
      throw new NotFoundException(`Workout with id: ${id} not found`);
    }
  }

  async updateNameWorkout(
    id: string,
    name: string,
    user: User,
  ): Promise<Workout> {
    const workout = await this.findOneWorkout(id, user);
    workout.name = name;
    await this.workoutPlanService.save(workout);
    return workout;
  }

  async cloneWorkout(id: string, user: User): Promise<Workout> {
    const original = await this.findOneWorkout(id, user, ['exercises']);
    const newWorkout = this.workoutPlanService.create({
      name: original.name + ' (Clone)',
      user,
      numExercises: original.exercises.length,
    });
    await this.workoutPlanService.save(newWorkout);
    const newExercises = original.exercises.map((ex) =>
      this.exerciseService.create({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        numberOfSets: ex.numberOfSets,
        repetitions: ex.repetitions,
        restTime: ex.restTime,
        note: ex.note,
        workoutId: newWorkout.id,
        user,
      }),
    );
    await this.exerciseService.save(newExercises);
    newWorkout.numExercises = newExercises.length;
    await this.workoutPlanService.save(newWorkout);
    newWorkout.exercises = newExercises;
    return newWorkout;
  }

  async getExercisesByWorkoutId(id: string, user: User): Promise<Workout> {
    return await this.findOneWorkout(id, user, ['exercises']);
  }
}
