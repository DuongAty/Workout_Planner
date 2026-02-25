import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSetDto } from './dto/create-set.dto';
import { ExerciseSet } from './exerciseSet.entity';
import { GetProgressQueryDto } from './dto/get-progress-query.dto';
import { SortDirection } from '../../body-measurement/body-measurement.enum';
import { WorkoutMath } from '../../common/mathUtils/math.util';
import { checkDateRange, DateUtils } from '../../common/dateUtils/dateUtils';
import { ExerciseService } from '../exercise.service';
import { User } from 'src/user/user.entity';

@Injectable()
export class ExerciseTrackingService {
  constructor(
    @InjectRepository(ExerciseSet)
    private setRepository: Repository<ExerciseSet>,
    private exerciseService: ExerciseService,
  ) {}

  async logSet(user: User, exerciseId: string, dto: CreateSetDto) {
    const exercise = await this.exerciseService.findOneExercise(
      exerciseId,
      user,
    );
    const newSet = this.setRepository.create({
      ...dto,
      exercise: exercise,
    });
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
    if (exercise) {
      const { startDate, endDate } = query;
      if (startDate && endDate) {
        checkDateRange(startDate, endDate);
      }
      const localDateSql =
        "DATE(set.createdAt AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')";
      const sql1RM = WorkoutMath.get1RMSql('set.weight', 'set.reps');
      const sqlVolume = WorkoutMath.getVolumeSql('set.weight', 'set.reps');

      const prRecord = await this.setRepository
        .createQueryBuilder('set')
        .select('MAX(set.weight)', 'maxWeight')
        .where('set.exerciseId = :exerciseId', { exerciseId })
        .getRawOne();

      const allTimeMaxWeight = parseFloat(prRecord.maxWeight || 0);

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

      const stats = await queryBuilder
        .groupBy(localDateSql)
        .orderBy('date', SortDirection.ASC)
        .getRawMany();

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
}
