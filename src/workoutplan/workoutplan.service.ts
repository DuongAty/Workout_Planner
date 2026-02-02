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
import { DateUtils } from 'src/common/dateUtils/dateUtils';

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
    scheduleItemId: string,
    user: User,
    newStatus: WorkoutStatus,
  ): Promise<Workout> {
    return await this.transactionService.run<Workout>(async (manager) => {
      const item = await manager
        .getRepository(ScheduleItem)
        .createQueryBuilder('item')
        .innerJoinAndSelect('item.workout', 'workout')
        .where('item.id = :scheduleItemId AND workout.userId = :userId', {
          scheduleItemId,
          userId: user.id,
        })
        .getOne();
      if (!item) {
        throw new NotFoundException(`Schedule item not found.`);
      }
      item.status = newStatus;
      await manager.save(item);
      return this.findOneWorkout(item.workout.id, user, [
        'scheduleItems',
        'exercises',
      ]);
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

  private hasScheduleChanged(
    original: Workout,
    dto: UpdateWorkoutDto,
  ): boolean {
    return (
      this.isDateChanged(dto.startDate, original.startDate) ||
      this.isDateChanged(dto.endDate, original.endDate) ||
      this.isDaysOfWeekChanged(dto.daysOfWeek, original.daysOfWeek)
    );
  }

  private isDateChanged(
    updated?: string | Date,
    original?: string | Date,
  ): boolean {
    return !!updated && updated !== original;
  }

  private isDaysOfWeekChanged(
    updated?: number[],
    original?: number[],
  ): boolean {
    if (!updated) return false;
    return this.normalizeDays(updated) !== this.normalizeDays(original);
  }

  private normalizeDays(days?: number[]): string | null {
    return days ? [...days].map(Number).sort().join(',') : null;
  }

  private hasNameChanged(original: Workout, dto: UpdateWorkoutDto): boolean {
    return !!dto.name && dto.name !== original.name;
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
    return this.transactionService.run(async () => {
      const original = await this.findOneWorkout(id, user);
      const hasTimeChanged = this.hasScheduleChanged(original, updateDto);
      if (hasTimeChanged) {
        return this.cloneWorkout(id, user, {
          name: updateDto.name ?? original.name,
          startDate: updateDto.startDate ?? original.startDate,
          endDate: updateDto.endDate ?? original.endDate,
          daysOfWeek: updateDto.daysOfWeek ?? original.daysOfWeek,
        });
      }
      if (this.hasNameChanged(original, updateDto)) {
        original.name = updateDto.name!;
        return this.workoutPlanService.save(original);
      }
      return original;
    });
  }

  async cloneWorkout(
    id: string,
    user: User,
    dto: {
      name?: string;
      startDate: string;
      endDate: string;
      daysOfWeek: number[];
    },
  ): Promise<Workout> {
    return await this.transactionService.run<Workout>(async () => {
      const original = await this.findOneWorkout(id, user, ['exercises']);
      const scheduleDates = DateUtils.generateScheduleDays(
        dto.startDate,
        dto.endDate,
        dto.daysOfWeek,
      );
      const scheduleItems = scheduleDates.map((date) => ({
        date,
        status: WorkoutStatus.Planned,
      }));
      const newWorkout = await this.workoutPlanService.save(
        this.workoutPlanService.create({
          ...dto,
          name: dto.name || original.name,
          scheduleItems,
          user,
          numExercises: original.exercises.length,
        }),
      );
      const exerciseData = original.exercises.map((ex) => {
        const thumbnail = ex.thumbnail
          ? this.uploadService.cloneFile(ex.thumbnail)
          : null;
        const videoUrl = ex.videoUrl
          ? this.uploadService.cloneFile(ex.videoUrl)
          : null;
        return this.exerciseService.create({
          ...ex,
          id: undefined,
          thumbnail,
          videoUrl,
          workoutId: newWorkout.id,
          user,
        } as DeepPartial<Exercise>);
      });
      await this.exerciseService.save(exerciseData);
      return newWorkout;
    });
  }

  private buildExerciseQuery(workoutId: string, filters: GetExerciseFilter) {
    const query = this.exerciseService
      .createQueryBuilder('exercise')
      .where('exercise.workoutId = :workoutId', { workoutId });
    applyExerciseFilters(query, filters, 'exercise');
    return query;
  }

  async getExercisesByWorkoutId(
    id: string,
    user: User,
    filters: GetExerciseFilter,
  ): Promise<Workout> {
    return await this.transactionService.run<Workout>(async () => {
      const workout = await this.findOneWorkout(id, user, ['scheduleItems']);
      workout.exercises = await this.buildExerciseQuery(id, filters).getMany();
      return workout;
    });
  }
}
