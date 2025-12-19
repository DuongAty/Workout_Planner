import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from './workoutplan.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { PaginationDto } from 'src/untils/pagination.dto';
import { GetWorkoutFilter } from './dto/filter-workout.dto';
import { Exercise } from 'src/exercise/exercise.entity';

@Injectable()
export class WorkoutplanService {
  private logger = new Logger();
  constructor(
    @InjectRepository(Workout)
    private workoutPlanService: Repository<Workout>,
    @InjectRepository(Exercise)
    private exerciseService: Repository<Exercise>,
  ) {}

  async createWorkout(createWorkoutDto: CreateWorkoutDto): Promise<Workout> {
    const { name } = createWorkoutDto;
    const workout = this.workoutPlanService.create({
      name,
    });
    return await this.workoutPlanService.save(workout);
  }

  async getAllWorkout(
    getWorkoutFilter: GetWorkoutFilter,
    paginationDto: PaginationDto,
  ): Promise<{ data: Workout[]; total: number; totalPages: number }> {
    const { page, limit } = paginationDto;
    const { search } = getWorkoutFilter;
    const skip = (page - 1) * limit;
    const query = this.workoutPlanService.createQueryBuilder('workout');
    if (search) {
      query.andWhere('(LOWER(workout.name) LIKE LOWER(:search))', {
        search: `%${search}%`,
      });
    }
    query.skip(skip).take(limit);
    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return { data, total, totalPages };
  }

  async findOne(id: string): Promise<Workout> {
    const workout = await this.workoutPlanService.findOne({
      where: { id },
    });
    if (!workout) {
      throw new NotFoundException(`Workout with ID "${id}" not found`);
    }
    return workout;
  }

  async deleteWorkoutById(id: string): Promise<void> {
    const result = await this.workoutPlanService.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException(`Workout with id: ${id} not found`);
    }
  }

  async updateNameWorkout(id: string, name: string): Promise<Workout> {
    const workout = await this.workoutPlanService.findOne({ where: { id } });
    if (!workout) {
      throw new NotFoundException(`Workout with id: ${id} not found`);
    }
    workout.name = name;
    await this.workoutPlanService.save(workout);
    return workout;
  }

  async cloneWorkout(id: string): Promise<Workout> {
    const original = await this.workoutPlanService.findOne({
      where: { id },
      relations: ['exercises'],
    });
    if (!original) {
      throw new NotFoundException(`Workout ID: ${id} không tồn tại`);
    }
    const newWorkout = this.workoutPlanService.create({
      name: original.name + ' (Clone)',
    });
    await this.workoutPlanService.save(newWorkout);
    const newExercises = original.exercises.map((ex) =>
      this.exerciseService.create({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: ex.sets,
        reps: ex.reps,
        restTime: ex.restTime,
        note: ex.note,
        workoutId: newWorkout.id,
      }),
    );
    await this.exerciseService.save(newExercises);
    newWorkout.exercises = newExercises;
    return newWorkout;
  }
}
