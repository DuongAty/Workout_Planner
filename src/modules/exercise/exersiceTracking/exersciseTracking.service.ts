import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSetDto } from './dto/create-set.dto';
import { ExerciseSet } from './exerciseSet.entity';
import { GetProgressQueryDto } from './dto/get-progress-query.dto';
import { SortDirection } from '../../body-measurement/body-measurement.enum';
import { WorkoutMath } from '../../../utils/mathUtils/math.util';
import { checkDateRange, DateUtils } from '../../../utils/dateUtils/dateUtils';
import { ExerciseService } from '../exercise.service';
import { User } from 'src/modules/user/user.entity';
import { AppLogger } from 'src/loggers/app-logger.service';

@Injectable()
export class ExerciseTrackingService {
  constructor(
    @InjectRepository(ExerciseSet)
    private setRepository: Repository<ExerciseSet>,
    private exerciseService: ExerciseService,
    private logger: AppLogger,
  ) { this.logger.setContext(ExerciseTrackingService.name); }

  async logSet(user: User, exerciseId: string, dto: CreateSetDto) {
    const exercise = await this.exerciseService.findOneExercise(
      exerciseId,
      user,
    );
    const newSet = this.setRepository.create({
      ...dto,
      exercise: exercise,
    });
    this.logger.logData(
      `User ${user.username} log set for exercise with Id: ${exerciseId}`,
      newSet,
      ExerciseTrackingService.name,
    );
    return await this.setRepository.save(newSet);
  }

  async getExerciseProgress(user: User, exerciseId: string) {
    const exercise = await this.exerciseService.findOneExercise(
      exerciseId,
      user,
    );
    if (exercise) {
      const sets = await this.setRepository.find({
        where: { exerciseId },
        order: { createdAt: SortDirection.ASC },
      });
      return sets.map((set) => ({
        ...set,
        volume: WorkoutMath.calculateVolume(set.weight, set.reps),
        estimated1RM: WorkoutMath.calculate1RM(set.weight, set.reps),
      }));
    }
  }

  async getStats(user: User, exerciseId: string) {
    const exercise = await this.exerciseService.findOneExercise(
      exerciseId,
      user,
    );
    if (exercise) {
      const sets = await this.getExerciseProgress(user, exerciseId);
      if (sets) {
        const totalVolume = sets.reduce((sum, set) => sum + set.volume, 0);
        const max1RM = Math.max(...sets.map((set) => set.estimated1RM), 0);
        return {
          totalVolume,
          personalRecord1RM: max1RM,
          totalSets: sets.length,
          history: sets,
        };
      }
    }
  }

  async getTimelineProgress(
    user: User,
    exerciseId: string,
    query: GetProgressQueryDto,
  ) {
    const exercise = await this.exerciseService.findOneExercise(
      exerciseId,
      user,
    );
    if (!exercise)
      return new NotFoundException(`Exercise with ${exerciseId} not found`);
    const { startDate, endDate } = query;
    if (startDate && endDate) {
      checkDateRange(startDate, endDate);
    }
    const [allTimeMaxWeight, stats] = await Promise.all([
      this.getAllTimePersonalRecord(exerciseId),
      this.getDailyStats(exerciseId, startDate, endDate),
    ]);
    return this.formatStatsResponse(stats, allTimeMaxWeight);
  }

  private async getAllTimePersonalRecord(exerciseId: string): Promise<number> {
    const maxWeight = await this.setRepository.maximum('weight', {
      exerciseId,
    });
    return maxWeight || 0;
  }

  private async getDailyStats(
    exerciseId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const localDateSql =
      "DATE(set.createdAt AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')";
    const sql1RM = WorkoutMath.get1RMSql('set.weight', 'set.reps');
    const sqlVolume = WorkoutMath.getVolumeSql('set.weight', 'set.reps');
    const queryBuilder = this.setRepository
      .createQueryBuilder('set')
      .select(localDateSql, 'date')
      .addSelect(`MAX(${sql1RM})`, 'max1RM')
      .addSelect(`SUM(${sqlVolume})`, 'totalVolume')
      .addSelect('MAX(set.weight)', 'maxWeight')
      .where('set.exerciseId = :exerciseId', { exerciseId });
    if (startDate && endDate) {
      queryBuilder.andWhere('set.createdAt BETWEEN :startDate AND :endDate', {
        startDate: DateUtils.getStartOfDay(startDate),
        endDate: DateUtils.getEndOfDay(endDate),
      });
    }
    return queryBuilder
      .groupBy(localDateSql)
      .orderBy('date', SortDirection.ASC)
      .getRawMany();
  }

  private formatStatsResponse(stats: any[], allTimeMaxWeight: number) {
    return stats.map((s) => ({
      date: s.date,
      max1RM: WorkoutMath.round(parseFloat(s.max1RM)),
      totalVolume: WorkoutMath.round(parseFloat(s.totalVolume)),
      maxWeight: parseFloat(s.maxWeight),
      personalRecord: allTimeMaxWeight,
      isPRDay: parseFloat(s.maxWeight) >= allTimeMaxWeight,
    }));
  }
}
