import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BodyMeasurement } from './body-measurement.entity';
import { MuscleGroup } from '../exercise/exercise-musclegroup';
import { User } from 'src/user/user.entity';
import {
  CreateMeasurementDto,
  GetMeasurementsQueryDto,
} from './dto/measurement.dto';
import {
  GOOD_PROGRESS,
  NEED_TRY,
  NO_ENOUGH_DATA,
} from 'src/common/constants/constants';

@Injectable()
export class BodyMeasurementService {
  constructor(
    @InjectRepository(BodyMeasurement)
    private repo: Repository<BodyMeasurement>,
  ) {}

  async create(user: User, dto: CreateMeasurementDto) {
    const measurement = this.repo.create({ ...dto, user });
    return await this.repo.save(measurement);
  }

  async getProgress(user: User, key: MuscleGroup) {
    const data = await this.repo.find({
      where: { user: { id: user.id }, key },
      order: { createdAt: 'DESC' },
      take: 2,
    });
    if (data.length < 2) return { message: NO_ENOUGH_DATA, current: data[0] };
    const [latest, prev] = data;
    const diff = latest.value - prev.value;
    const isGoodProgress = key === MuscleGroup.Abs ? diff < 0 : diff > 0;
    return {
      muscleGroup: key,
      current: latest.value,
      diff: parseFloat(diff.toFixed(2)),
      status: isGoodProgress ? GOOD_PROGRESS : NEED_TRY,
      measuredAt: latest.createdAt,
    };
  }

  async findAllForChart(user: User, dto: GetMeasurementsQueryDto) {
    const { key, startDate, endDate } = dto;
    const query = this.repo
      .createQueryBuilder('m')
      .where('m.userId = :userId', { userId: user.id });
    if (key) {
      query.andWhere('m.key = :key', { key });
    }
    if (startDate) {
      query.andWhere('m.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('m.createdAt <= :endDate', { endDate: end });
    }
    const results = await query.orderBy('m.createdAt', 'ASC').getMany();
    return results.map((item) => ({
      date: item.createdAt,
      value: item.value,
      group: item.key,
    }));
  }
}
