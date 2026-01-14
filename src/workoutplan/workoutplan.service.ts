import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Workout } from './workoutplan.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { GetWorkoutFilter } from './dto/filter-workout.dto';
import { Exercise } from '../exercise/exercise.entity';
import { User } from '../user/user.entity';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { UploadService } from '../common/upload/upload.service';

@Injectable()
export class WorkoutplanService {
  constructor(
    @InjectRepository(Workout)
    private workoutPlanService: Repository<Workout>,
    @InjectRepository(Exercise)
    private exerciseService: Repository<Exercise>,
    private uploadService: UploadService,
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

  async createWorkout(dto: CreateWorkoutDto, user: User): Promise<Workout> {
    const workout = this.workoutPlanService.create({
      ...dto,
      user,
      status: 'planned',
    });
    return await this.workoutPlanService.save(workout);
  }

  async updateDaysOfWeek(
    id: string,
    user: User,
    daysOfWeek: number[],
  ): Promise<Workout> {
    const workout = await this.findOneWorkout(id, user);
    workout.daysOfWeek = daysOfWeek;
    return await this.workoutPlanService.save(workout);
  }

  async updateStatus(id: string, user: User, status: string): Promise<Workout> {
    const workout = await this.findOneWorkout(id, user);
    workout.status = status;
    return await this.workoutPlanService.save(workout);
  }

  async updateSchedule(
    id: string,
    user: User,
    updateDto: { startDate?: string; endDate?: string },
  ): Promise<Workout> {
    const workout = await this.findOneWorkout(id, user);
    if (updateDto.startDate) workout.startDate = updateDto.startDate;
    if (updateDto.endDate) workout.endDate = updateDto.endDate;
    workout.status = 'planned';
    return await this.workoutPlanService.save(workout);
  }

  async getWorkoutWithAutoCheck(id: string, user: User): Promise<Workout> {
    const workout = await this.findOneWorkout(id, user);
    const today = new Date();
    const end = new Date(workout.endDate);
    if (today > end && workout.status === 'planned') {
      workout.status = 'missed';
      await this.workoutPlanService.save(workout);
    }
    return workout;
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
        where: { id, user: { id: user.id } },
        relations,
      });
    } catch (error) {
      throw new NotFoundException(`Workout with ID ${id} not found`);
    }
  }

  async deleteWorkoutById(id: string, user: User): Promise<void> {
    const workoutPlan = await this.findOneWorkout(id, user, ['exercises']);
    if (workoutPlan.exercises && workoutPlan.exercises.length > 0) {
      for (const exercise of workoutPlan.exercises) {
        if (exercise.thumbnail) {
          this.uploadService.cleanupFile(exercise.thumbnail);
        }
        if (exercise.videoUrl) {
          this.uploadService.cleanupFile(exercise.videoUrl);
        }
      }
    }
    await this.workoutPlanService.remove(workoutPlan);
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
    const newExercises = original.exercises.map((ex) => {
      const clonedThumb = this.uploadService.cloneFile(ex.thumbnail);
      const clonedVideo = this.uploadService.cloneFile(ex.videoUrl);

      return this.exerciseService.create({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        numberOfSets: ex.numberOfSets,
        repetitions: ex.repetitions,
        duration: ex.duration,
        restTime: ex.restTime,
        note: ex.note,
        thumbnail: clonedThumb,
        videoUrl: clonedVideo,
        workoutId: newWorkout.id,
        user,
      } as DeepPartial<Exercise>);
    });
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
