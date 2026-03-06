import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { workoutAnalytics } from 'src/modules/workoutplan/prompt/workout-ai.prompt';
import { Workout } from 'src/modules/workoutplan/workoutplan.entity';
import { Repository, LessThan } from 'typeorm';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Workout)
    private workoutRepository: Repository<Workout>,
  ) {}

  async getPastWorkoutsAnalysis(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const pastWorkouts = await this.workoutRepository.find({
      where: {
        user: { id: userId },
        endDate: LessThan(today),
      },
      relations: ['user', 'scheduleItems', 'exercises', 'exercises.sets'],
      select: {
        user: {
          id: true,
          fullname: true,
          username: true,
          email: true,
          age: true,
          weight: true,
          height: true,
          goal: true,
          gender: true,
        },
      },
      order: { endDate: 'DESC' },
      take: 1,
    });

    if (!pastWorkouts || pastWorkouts.length === 0) {
      return 'Bạn chưa có dữ liệu workout nào đã kết thúc để phân tích.';
    }
    const prompt = workoutAnalytics(pastWorkouts);
    return prompt;
  }
}
