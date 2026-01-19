import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSetDto } from './dto/create-set.dto';
import { ExerciseSet } from './exerciseSet.entity';
import { Exercise } from '../exercise.entity';
import { GetProgressQueryDto } from './dto/get-progress-query.dto';

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
      order: { createdAt: 'ASC' },
    });
    return sets.map((set) => {
      const estimated1RM = set.weight * (1 + 0.0333 * set.reps);
      const volume = set.weight * set.reps;
      return {
        ...set,
        volume: Math.round(volume * 100) / 100,
        estimated1RM: Math.round(estimated1RM * 100) / 100,
      };
    });
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
    const prRecord = await this.setRepository
      .createQueryBuilder('set')
      .select('MAX(set.weight)', 'maxWeight')
      .where('set.exerciseId = :exerciseId', { exerciseId })
      .getRawOne();
    const allTimeMaxWeight = parseFloat(prRecord.maxWeight || 0);
    const queryBuilder = this.setRepository
      .createQueryBuilder('set')
      .select(localDateSql, 'date')
      .addSelect('MAX(set.weight * (1 + 0.0333 * set.reps))', 'max1RM')
      .addSelect('SUM(set.weight * set.reps)', 'totalVolume')
      .addSelect('MAX(set.weight)', 'maxWeight')
      .where('set.exerciseId = :exerciseId', { exerciseId });
    if (startDate && endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('set.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate: endOfDay,
      });
    }
    const stats = await queryBuilder
      .groupBy(localDateSql)
      .orderBy('date', 'ASC')
      .getRawMany();
    return stats.map((s) => {
      const currentMaxWeight = parseFloat(s.maxWeight);
      return {
        date: s.date,
        max1RM: parseFloat(parseFloat(s.max1RM).toFixed(2)),
        totalVolume: parseFloat(parseFloat(s.totalVolume).toFixed(2)),
        maxWeight: currentMaxWeight,
        personalRecord: allTimeMaxWeight,
        isPRDay: currentMaxWeight >= allTimeMaxWeight,
      };
    });
  }
}
