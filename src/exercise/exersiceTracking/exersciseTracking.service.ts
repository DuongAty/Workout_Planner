import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSetDto } from './dto/create-set.dto';
import { ExerciseSet } from './exerciseSet.entity';
import { Exercise } from '../exercise.entity';
import { GetProgressQueryDto } from './dto/get-progress-query.dto';
import { SortDirection } from 'src/body-measurement/body-measurement.enum';
import { WorkoutMath } from 'src/common/mathUtils/math.util';
import { DateUtils } from 'src/common/dateUtils/dateUtils';

@Injectable()
export class ExerciseTrackingService {
  constructor(
    @InjectRepository(ExerciseSet)
    private setRepository: Repository<ExerciseSet>,
    @InjectRepository(Exercise)
    private exerciseRepository: Repository<Exercise>,
  ) {}

  async logSet(exerciseId: string, dto: CreateSetDto) {
    const exercise = await this.exerciseRepository.findOneBy({
      id: exerciseId,
    });
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
    }
    const newSet = this.setRepository.create({
      ...dto,
      exercise: exercise,
    });
    return await this.setRepository.save(newSet);
  }

  async getExerciseProgress(exerciseId: string) {
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

  async getStats(exerciseId: string) {
    const sets = await this.getExerciseProgress(exerciseId);
    const totalVolume = sets.reduce((sum, set) => sum + set.volume, 0);
    const max1RM = Math.max(...sets.map((set) => set.estimated1RM), 0);
    return {
      totalVolume,
      personalRecord1RM: max1RM,
      totalSets: sets.length,
      history: sets,
    };
  }

  async getTimelineProgress(exerciseId: string, query: GetProgressQueryDto) {
    const { startDate, endDate } = query;
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
