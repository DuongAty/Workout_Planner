import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BodyMeasurement } from './body-measurement.entity';
import { MuscleGroup } from '../exercise/exercise-musclegroup';
import { User } from 'src/user/user.entity';
import { CreateMeasurementDto } from './dto/measurement.dto';

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

    if (data.length < 2)
      return { message: 'Cần thêm dữ liệu', current: data[0] };

    const [latest, prev] = data;
    const diff = latest.value - prev.value;

    // Logic tiến bộ dựa trên Enum
    // Bụng (Abs) giảm là tốt, các nhóm cơ khác tăng là tốt
    const isGoodProgress = key === MuscleGroup.Abs ? diff < 0 : diff > 0;

    return {
      muscleGroup: key,
      current: latest.value,
      diff: parseFloat(diff.toFixed(2)),
      status: isGoodProgress ? 'Tiến bộ' : 'Cần cố gắng',
      measuredAt: latest.createdAt,
    };
  }

  async findAllForChart(user: User, key?: MuscleGroup) {
    const query = this.repo
      .createQueryBuilder('m')
      .where('m.userId = :userId', { userId: user.id });

    if (key) query.andWhere('m.key = :key', { key });

    const results = await query.orderBy('m.createdAt', 'ASC').getMany();

    return results.map((item) => ({
      date: item.createdAt,
      value: item.value,
      group: item.key,
    }));
  }
}
