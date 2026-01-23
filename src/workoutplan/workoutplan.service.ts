import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';
import { Workout } from './workoutplan.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { GetWorkoutFilter } from './dto/filter-workout.dto';
import { Exercise } from '../exercise/exercise.entity';
import { User } from '../user/user.entity';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { UploadService } from '../common/upload/upload.service';
import { WorkoutStatus } from './workout-status';
import { GetExerciseFilter } from 'src/exercise/dto/musclegroup-filter.dto';
import { applyExerciseFilters } from 'src/common/filter/exercese-filter';
import { UpdateWorkoutDto } from './dto/update-name-dto';
import { TransactionService } from 'src/common/transaction/transaction';
import { ScheduleItem } from './schedule-items/schedule-item.entity';

@Injectable()
export class WorkoutplanService {
  constructor(
    @InjectRepository(Workout)
    private workoutPlanService: Repository<Workout>,
    @InjectRepository(Exercise)
    private exerciseService: Repository<Exercise>,
    private uploadService: UploadService,
    private transactionService: TransactionService,
  ) {}
  async syncNumExercises(workoutId: string, manager?: EntityManager) {
    const exerciseRepo = manager
      ? manager.getRepository(Exercise)
      : this.exerciseService;
    const workoutRepo = manager
      ? manager.getRepository(Workout)
      : this.workoutPlanService;
    const count = await exerciseRepo.count({
      where: { workoutId: workoutId },
    });
    await workoutRepo.update(workoutId, { numExercises: count });
  }

  private generateScheduleItems(
    startDate: string,
    endDate: string,
    daysOfWeek: number[],
  ): ScheduleItem[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const items: ScheduleItem[] = [];
    const current = new Date(start);
    while (current <= end) {
      if (daysOfWeek.includes(current.getDay())) {
        const item = new ScheduleItem();
        item.date = current.toISOString().split('T')[0];
        item.status = WorkoutStatus.Planned;
        items.push(item);
      }
      current.setDate(current.getDate() + 1);
    }
    return items;
  }

  async createRecurringWorkout(
    dto: CreateWorkoutDto,
    user: User,
  ): Promise<Workout> {
    return await this.transactionService.run<Workout>(async () => {
      const { name, startDate, endDate, daysOfWeek } = dto;
      const scheduleItems = this.generateScheduleItems(
        startDate,
        endDate,
        daysOfWeek,
      );
      const workout = this.workoutPlanService.create({
        name,
        startDate,
        endDate,
        daysOfWeek,
        user,
        scheduleItems,
      });
      return await this.workoutPlanService.save(workout);
    });
  }

  async updateItemStatus(
    id: string,
    user: User,
    itemDate: string,
    newStatus: WorkoutStatus,
  ): Promise<Workout> {
    return await this.transactionService.run<Workout>(async (manager) => {
      const item = await manager
        .getRepository(ScheduleItem)
        .createQueryBuilder('item')
        .innerJoin('item.workout', 'workout')
        .where(
          'workout.id = :id AND workout.userId = :userId AND item.date = :itemDate',
          { id, userId: user.id, itemDate },
        )
        .getOne();

      if (!item) {
        throw new NotFoundException(`Training date ${itemDate} not found.`);
      }
      item.status = newStatus;
      await manager.save(item);
      return this.findOneWorkout(id, user, ['scheduleItems']);
    });
  }

  async updateSchedule(
    id: string,
    user: User,
    updateDto: {
      oldDate?: string;
      newDate?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<Workout> {
    return await this.transactionService.run<Workout>(async (manager) => {
      if (updateDto.oldDate && updateDto.newDate) {
        const result = await manager
          .getRepository(ScheduleItem)
          .createQueryBuilder()
          .update()
          .set({ date: updateDto.newDate, status: WorkoutStatus.Planned })
          .where('workoutId = :id AND date = :oldDate', {
            id,
            oldDate: updateDto.oldDate,
          })
          .execute();

        if (result.affected === 0)
          throw new NotFoundException('Schedule date not found');
      }
      if (updateDto.startDate || updateDto.endDate) {
        await manager.getRepository(Workout).update(
          { id, user: { id: user.id } },
          {
            ...(updateDto.startDate && { startDate: updateDto.startDate }),
            ...(updateDto.endDate && { endDate: updateDto.endDate }),
          },
        );
      }
      return this.findOneWorkout(id, user, ['scheduleItems']);
    });
  }

  async checkMissedWorkouts(user: User): Promise<void> {
    return await this.transactionService.run<void>(async (manager) => {
      const today = new Date().toISOString().split('T')[0];
      const subQuery = manager
        .getRepository(Workout)
        .createQueryBuilder('workout')
        .select('workout.id')
        .where('workout.userId = :userId', { userId: user.id });
      await manager
        .createQueryBuilder()
        .update(ScheduleItem)
        .set({ status: WorkoutStatus.Missed })
        .where('status = :planned', { planned: WorkoutStatus.Planned })
        .andWhere('date < :today', { today })
        .andWhere(`"workoutId" IN (${subQuery.getQuery()})`)
        .setParameters(subQuery.getParameters())
        .execute();
    });
  }

  async getAllWorkout(
    getWorkoutFilter: GetWorkoutFilter,
    paginationDto: PaginationDto,
    user: User,
  ): Promise<{ data: Workout[]; total: number; totalPages: number }> {
    const { page, limit } = paginationDto;
    const { search, numExercises, startDate, endDate, todayOnly } =
      getWorkoutFilter;
    const skip = (page - 1) * limit;
    const query = this.workoutPlanService.createQueryBuilder('workout');
    query.leftJoinAndSelect('workout.scheduleItems', 'scheduleItems');
    query.where({ user });
    if (search) {
      query.andWhere('workout.name ILIKE :search', {
        search: `%${search}%`,
      });
    }
    if (numExercises !== undefined && numExercises !== null) {
      query.andWhere('workout.numExercises = :numExercises', { numExercises });
    }
    if (startDate) {
      query.andWhere('workout.startDate >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('workout.endDate <= :endDate', { endDate });
    }
    if (todayOnly) {
      const today = new Date().toISOString().split('T')[0];
      query.innerJoin(
        'workout.scheduleItems',
        'todayItem',
        'todayItem.date = :today',
        { today },
      );
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
    return await this.transactionService.run<void>(async () => {
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
    });
  }

  async updateWorkout(id: string, user: User, updateDto: UpdateWorkoutDto) {
    return await this.transactionService.run(async () => {
      const original = await this.findOneWorkout(id, user);
      const normalizedDtoDays = updateDto.daysOfWeek
        ? updateDto.daysOfWeek.map(Number).sort().join(',')
        : null;
      const normalizedOriginalDays = original.daysOfWeek
        ? original.daysOfWeek.map(Number).sort().join(',')
        : null;
      const isTimeChanged =
        (updateDto.startDate && updateDto.startDate !== original.startDate) ||
        (updateDto.endDate && updateDto.endDate !== original.endDate) ||
        (normalizedDtoDays !== null &&
          normalizedDtoDays !== normalizedOriginalDays);
      if (isTimeChanged) {
        const cloned = await this.cloneWorkout(id, user, {
          name: updateDto.name || original.name,
          startDate: updateDto.startDate || original.startDate,
          endDate: updateDto.endDate || original.endDate,
          daysOfWeek: updateDto.daysOfWeek || original.daysOfWeek,
        });
        return cloned;
      }
      if (updateDto.name && updateDto.name !== original.name) {
        original.name = updateDto.name;
        return await this.workoutPlanService.save(original);
      }
      return original;
    });
  }

  async cloneWorkout(
    id: string,
    user: User,
    newScheduleData: {
      name?: string;
      startDate: string;
      endDate: string;
      daysOfWeek: number[];
    },
  ): Promise<Workout> {
    return await this.transactionService.run<Workout>(async () => {
      const original = await this.findOneWorkout(id, user, ['exercises']);
      const scheduleItems: { date: string; status: string }[] = [];
      const start = new Date(newScheduleData.startDate);
      const end = new Date(newScheduleData.endDate);
      const current = new Date(start);
      while (current <= end) {
        if (newScheduleData.daysOfWeek.includes(current.getDay())) {
          scheduleItems.push({
            date: current.toISOString().split('T')[0],
            status: WorkoutStatus.Planned,
          });
        }
        current.setDate(current.getDate() + 1);
      }
      const newWorkout = this.workoutPlanService.create({
        name: newScheduleData.name || original.name,
        startDate: newScheduleData.startDate,
        endDate: newScheduleData.endDate,
        daysOfWeek: newScheduleData.daysOfWeek,
        scheduleItems,
        user,
        numExercises: original.exercises.length,
      });
      await this.workoutPlanService.save(newWorkout);
      const exercisePromises = original.exercises.map(async (ex) => {
        const clonedThumb = ex.thumbnail
          ? this.uploadService.cloneFile(ex.thumbnail)
          : null;
        const clonedVideo = ex.videoUrl
          ? this.uploadService.cloneFile(ex.videoUrl)
          : null;
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
      const newExercises = await Promise.all(exercisePromises);
      await this.exerciseService.save(newExercises);
      return newWorkout;
    });
  }

  async getExercisesByWorkoutId(
    id: string,
    user: User,
    filters: GetExerciseFilter,
  ): Promise<Workout> {
    return await this.transactionService.run<Workout>(async () => {
      const workout = await this.findOneWorkout(id, user);
      const query = this.exerciseService
        .createQueryBuilder('exercise')
        .where('exercise.workoutId = :id', { id });
      applyExerciseFilters(query, filters, 'exercise');
      workout.exercises = await query.getMany();
      return workout;
    });
  }
}
