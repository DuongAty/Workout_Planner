import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, In, Repository } from 'typeorm';
import { Workout } from './workoutplan.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { GetWorkoutFilter } from './dto/filter-workout.dto';
import { Exercise } from '../exercise/exercise.entity';
import { User } from '../user/user.entity';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { UploadService } from '../../upload/upload.service';
import { WorkoutStatus } from './workout-status';
import { GetExerciseFilter } from '../exercise/dto/musclegroup-filter.dto';
import { UpdateWorkoutDto } from './dto/update-name-dto';
import { TransactionService } from '../../transaction/transaction';
import { ScheduleItem } from './schedule-items/schedule-item.entity';
import { checkDateRange } from '../../utils/dateUtils/dateUtils';
import { OpenAIService } from '../openai/openai.service';
import { workoutAIPrompt } from './prompt/workout-ai.prompt';
import { CloneScheduleDto } from './dto/clone-workout.dto';
import { RRule } from 'rrule';
import { AnalyticsService } from 'src/common/service/analytics.service';
import { I18nContext } from 'nestjs-i18n';
import { AppLogger } from 'src/loggers/app-logger.service';
import { CreateWorkoutPlanResponse } from './responses/workout-plan.response';
import { plainToInstance } from 'class-transformer';
import { AbstractService } from 'src/common/pageService/page.service';
import { ExerciseFilter } from 'src/filters/exercise.filter';

@Injectable()
export class WorkoutplanService extends AbstractService<Workout> {
  constructor(
    @InjectRepository(Workout)
    private workoutPlanService: Repository<Workout>,
    @InjectRepository(Exercise)
    private exerciseService: Repository<Exercise>,
    private uploadService: UploadService,
    private transactionService: TransactionService,
    private openAIService: OpenAIService,
    @InjectRepository(ScheduleItem)
    private scheduleItemRepository: Repository<ScheduleItem>,
    private analyticsService: AnalyticsService,
    private logger: AppLogger,
  ) {
    super(workoutPlanService);
    this.logger.setContext(WorkoutplanService.name);
  }
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
  ): { items: ScheduleItem[]; rruleString: string } {
    const rule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: daysOfWeek,
      dtstart: new Date(startDate),
      until: new Date(endDate),
    });

    const items = rule.all().map((date) => {
      const item = new ScheduleItem();
      item.date = date.toISOString().split('T')[0];
      item.status = WorkoutStatus.Planned;
      return item;
    });
    return {
      items,
      rruleString: rule.toString(),
    };
  }

  async createRecurringWorkout(
    dto: CreateWorkoutDto,
    user: User,
  ): Promise<CreateWorkoutPlanResponse> {
    return await this.transactionService.run<CreateWorkoutPlanResponse>(
      async () => {
        try {
          const { name, startDate, endDate, daysOfWeek } = dto;
          checkDateRange(startDate, endDate);
          const { items: scheduleItems, rruleString } =
            this.generateScheduleItems(startDate, endDate, daysOfWeek);
          if (scheduleItems.length === 0) {
            throw new BadRequestException(
              'No suitable training dates were found.',
            );
          }
          const plannedDates = scheduleItems.map((item) => item.date);
          const existingItems = await this.scheduleItemRepository.find({
            where: {
              workout: { user: { id: user.id } },
              date: In(plannedDates),
            },
          });
          if (existingItems.length > 0) {
            const conflictDates = existingItems.map((item) => item.date);
            throw new BadRequestException(
              `The schedules overlap on these days: ${conflictDates.join(', ')}`,
            );
          }
          const workout = this.workoutPlanService.create({
            name,
            startDate,
            endDate,
            recurrenceRule: rruleString,
            user,
            scheduleItems,
          });
          this.logger.logData(
            `Recurring workout created successfully with data: `,
            workout,
            WorkoutplanService.name,
          );
          const saveWorkout = await this.workoutPlanService.save(workout);
          return plainToInstance(CreateWorkoutPlanResponse, saveWorkout, {
            excludeExtraneousValues: true,
          });
        } catch (err) {
          this.logger.error(
            'Error occurred while creating recurring workout',
            err,
            WorkoutplanService.name,
          );
          throw new BadRequestException('Lỗi DB: ' + err.message);
        }
      },
    );
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
      this.logger.logData(
        `Schedule item status updated successfully with data: `,
        item,
        WorkoutplanService.name,
      );
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
      try {
        const currentWorkout = await this.findOneWorkout(id, user);
        if (!currentWorkout)
          throw new NotFoundException('Workout không tồn tại');
        const finalEndDate = updateDto.endDate || currentWorkout.endDate;
        const finalStartDate = updateDto.startDate || currentWorkout.startDate;
        if (updateDto.newDate && finalEndDate) {
          const newDateVal = new Date(updateDto.newDate);
          const endDateVal = new Date(finalEndDate);
          const startDateVal = new Date(finalStartDate);
          if (newDateVal > endDateVal) {
            throw new BadRequestException(
              `New date (${updateDto.newDate}) do not exceed the end date. (${finalEndDate})`,
            );
          }
          if (newDateVal < startDateVal) {
            throw new BadRequestException(
              `New date (${updateDto.newDate}) not permitted before the start date. (${finalStartDate})`,
            );
          }
        }
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
      } catch (err) {
        this.logger.error(
          'Error occurred while updating schedule',
          err,
          WorkoutplanService.name,
        );
        throw new BadRequestException('Lỗi DB: ' + err.message);
      }
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
  ) {
    const { todayOnly, ...otherFilters } = getWorkoutFilter;
    const queryBuilder = this.baseQuery('workout', otherFilters, ['name']);
    queryBuilder
      .leftJoinAndSelect('workout.scheduleItems', 'scheduleItems')
      .andWhere('workout.userId = :userId', { userId: user.id });
    if (todayOnly) {
      queryBuilder.andWhere('scheduleItems.date = :today', {
        today: todayOnly,
      });
    }
    const result = await this.paginate(queryBuilder, paginationDto);
    this.logger.logData(
      'Get all workouts',
      result.meta,
      WorkoutplanService.name,
    );
    return result;
  }

  async findOneWorkout(
    id: string,
    user: User,
    relations: string[] = [],
  ): Promise<Workout> {
    try {
      const workout = await this.workoutPlanService.findOneOrFail({
        where: { id, user: { id: user.id } },
        relations,
      });
      this.logger.logData(
        `User ${user.username} findOneWorkout with ${id}`,
        { workout },
        WorkoutplanService.name,
      );
      return workout;
    } catch (error) {
      this.logger.error(
        `Workout with ID ${id} not found for user ${user.username}`,
        error,
        WorkoutplanService.name,
      );
      throw new NotFoundException(`Workout with ID ${id} not found`);
    }
  }

  async deleteWorkoutById(id: string, user: User): Promise<void> {
    return await this.transactionService.run<void>(async () => {
      try {
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
        this.logger.logData(
          `User ${user.username} delete workout with ID ${id}`,
          { workoutPlan },
          WorkoutplanService.name,
        );
        await this.workoutPlanService.remove(workoutPlan);
      } catch (err) {
        this.logger.error(
          `Error occurred while deleting workout with ID ${id} for user ${user.username}`,
          err,
          WorkoutplanService.name,
        );
        throw new BadRequestException('Lỗi DB: ' + err.message);
      }
    });
  }

  private hasScheduleChanged(
    original: Workout,
    dto: UpdateWorkoutDto,
  ): boolean {
    return (
      this.isDateChanged(dto.startDate, original.startDate) ||
      this.isDateChanged(dto.endDate, original.endDate) ||
      this.isDaysOfWeekChanged(dto.daysOfWeek, original.recurrenceRule)
    );
  }

  private isDateChanged(
    updated?: string | Date,
    original?: string | Date,
  ): boolean {
    return !!updated && updated !== original;
  }

  private getDaysFromRRuleString(rruleStr: string): number[] {
    try {
      const rule = RRule.fromString(rruleStr);
      return rule.options.byweekday;
    } catch {
      return [];
    }
  }

  private isDaysOfWeekChanged(
    updatedDays?: number[],
    originalRRule?: string,
  ): boolean {
    if (!updatedDays || !originalRRule) return false;
    const originalDays = this.getDaysFromRRuleString(originalRRule);
    return (
      JSON.stringify([...updatedDays].sort()) !==
      JSON.stringify([...originalDays].sort())
    );
  }

  private normalizeDays(days?: number[]): string | null {
    return days ? [...days].map(Number).sort().join(',') : null;
  }

  private hasNameChanged(original: Workout, dto: UpdateWorkoutDto): boolean {
    return !!dto.name && dto.name !== original.name;
  }

  async updateWorkout(id: string, user: User, updateDto: UpdateWorkoutDto) {
    return this.transactionService.run(async () => {
      try {
        const original = await this.findOneWorkout(id, user);
        const finalStartDate = updateDto.startDate ?? original.startDate;
        const finalEndDate = updateDto.endDate ?? original.endDate;
        const finalDays =
          updateDto.daysOfWeek ??
          this.getDaysFromRRuleString(original.recurrenceRule);
        checkDateRange(finalStartDate, finalEndDate);
        const hasTimeChanged = this.hasScheduleChanged(original, updateDto);
        if (hasTimeChanged) {
          return this.cloneWorkout(id, user, {
            name: updateDto.name ?? original.name,
            startDate: finalStartDate,
            endDate: finalEndDate,
            daysOfWeek: finalDays,
            estimatedCalories: original.estimatedCalories,
          });
        }
        if (this.hasNameChanged(original, updateDto)) {
          original.name = updateDto.name!;
          return this.workoutPlanService.save(original);
        }
        this.logger.logData(
          `User ${user.username} update workout with ID ${id}`,
          { original },
          WorkoutplanService.name,
        );
        return original;
      } catch (err) {
        this.logger.error(
          `Error occurred while updating workout with ID ${id} for user ${user.username}`,
          err,
          WorkoutplanService.name,
        );
        throw new BadRequestException('Lỗi DB: ' + err.message);
      }
    });
  }

  async cloneWorkout(
    id: string,
    user: User,
    dto: CloneScheduleDto,
  ): Promise<Workout> {
    return await this.transactionService.run<Workout>(async () => {
      try {
        const original = await this.findOneWorkout(id, user, ['exercises']);
        const { items: scheduleItems, rruleString } =
          this.generateScheduleItems(
            dto.startDate,
            dto.endDate,
            dto.daysOfWeek,
          );
        const newWorkout = await this.workoutPlanService.save(
          this.workoutPlanService.create({
            ...dto,
            name: dto.name || original.name,
            recurrenceRule: rruleString,
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
          } as DeepPartial<Exercise>);
        });
        await this.exerciseService.save(exerciseData);
        this.logger.logData(
          `User ${user.username} cloned workout with ID ${id} to new workout with ID ${newWorkout.id}`,
          { newWorkout },
          WorkoutplanService.name,
        );
        return newWorkout;
      } catch (err) {
        this.logger.error(
          `Error occurred while cloning workout with ID ${id} for user ${user.username}`,
          err,
          WorkoutplanService.name,
        );
        throw new BadRequestException('Lỗi DB: ' + err.message);
      }
    });
  }

  private buildExerciseQuery(workoutId: string, filters: GetExerciseFilter) {
    const qb = this.exerciseService
      .createQueryBuilder('exercise')
      .where('exercise.workoutId = :workoutId', { workoutId });
    const filter = new ExerciseFilter(this.exerciseService);
    filter.apply(qb, filters, 'exercise');
    return qb;
  }

  async getExercisesByWorkoutId(
    id: string,
    user: User,
    filters: GetExerciseFilter,
  ): Promise<Workout> {
    return this.transactionService.run(async () => {
      const workout = await this.findOneWorkout(id, user, ['scheduleItems']);
      workout.exercises = await this.buildExerciseQuery(id, filters).getMany();
      return workout;
    });
  }
  async generateFromChat(message: string) {
    const lang = I18nContext.current()?.lang || 'vi';
    const prompt = workoutAIPrompt(message, lang);
    const data = await this.openAIService.chat(prompt);
    if (!data) {
      throw new BadRequestException('AI response data is incomplete');
    }
    return data;
  }

  async generateAndSave(message: string, userId: string) {
    const aiData = await this.generateFromChat(message);
    if (aiData.is_workout_request === false) {
      throw new BadRequestException(
        'Your request is not related to creating a workout schedule. Please try again!',
      );
    }
    return await this.transactionService.run(async (manager: EntityManager) => {
      try {
        const { items: scheduleItems, rruleString } =
          this.generateScheduleItems(
            aiData.startDate,
            aiData.endDate,
            aiData.daysOfWeek.map(Number),
          );
        const workout = manager.create('Workout', {
          id: aiData.id,
          name: aiData.name,
          numExercises: aiData.numExercises,
          startDate: aiData.startDate,
          endDate: aiData.endDate,
          recurrenceRule: rruleString,
          estimatedCalories: aiData.estimatedCalories,
          user: { id: userId },
        });
        const savedWorkout = (await manager.save(workout)) as Workout;
        const linkedScheduleItems = aiData.scheduleItems.map((item) =>
          manager.create('ScheduleItem', {
            id: item.id,
            date: item.date,
            status: item.status,
            workout: { id: savedWorkout.id },
          }),
        );
        await manager.save('ScheduleItem', linkedScheduleItems);
        const exercises = aiData.exercises.map((ex: any) =>
          manager.create('Exercise', {
            ...ex,
            workoutPlan: savedWorkout,
          }),
        );
        await manager.save('Exercise', exercises);
        this.logger.logData(
          `User with ID ${userId} generated a workout plan using AI with data: `,
          { workout: savedWorkout },
          WorkoutplanService.name,
        );
        return savedWorkout;
      } catch (err) {
        this.logger.error(
          `Error occurred while generating workout plan using AI for user with ID ${userId}`,
          err,
          WorkoutplanService.name,
        );
        throw new BadRequestException('Lỗi DB: ' + err.message);
      }
    });
  }

  async generateWorkoutStatistics(
    userId: string,
    workoutId: string,
    customPrompt?: string,
  ) {
    const prompt = customPrompt;
    if (!prompt) {
      const analysisData =
        await this.analyticsService.getPastWorkoutsAnalysis(userId);
      if (typeof analysisData === 'string') {
        return { message: analysisData };
      }
    }
    if (!prompt) return { message: 'Không có dữ liệu tập luyện.' };
    const data = await this.openAIService.Statistics(prompt);
    if (!data) {
      throw new BadRequestException('AI response data is incomplete');
    }
    return data;
  }
}
