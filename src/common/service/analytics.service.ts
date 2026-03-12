import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext } from 'nestjs-i18n';
import {
  getMonthlyAnalysis,
  workoutAnalytics,
} from 'src/modules/workoutplan/prompt/workout-ai.prompt';
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
    const lang = I18nContext.current()?.lang || 'vi';
    const pastWorkouts = await this.workoutRepository.find({
      where: {
        user: { id: userId },
        endDate: today,
      },
      relations: ['user', 'scheduleItems', 'exercises', 'exercises.sets'],
      select: {
        id: true,
        name: true,
        estimatedCalories: true,
        numExercises: true,
        scheduleItems: {
          id: true,
          status: true,
        },
        exercises: {
          id: true,
          duration: true,
        },
        user: {
          id: true,
          fullname: true,
          email: true,
          age: true,
          weight: true,
          height: true,
          goal: true,
          gender: true,
        },
      },
      order: { endDate: 'DESC' },
    });
    if (!pastWorkouts || pastWorkouts.length === 0) {
      return 'Bạn chưa có dữ liệu workout nào đã kết thúc để phân tích.';
    }
    return pastWorkouts.map((workout) => ({
      workoutId: workout.id,
      prompt: workoutAnalytics(JSON.stringify(workout), lang),
    }));
  }

  calculateStats(workouts: any[]) {
    const totalWorkouts = workouts.length;
    let totalExercises = 0;
    let totalDuration = 0;
    let estimatedCalories = 0;
    for (const workout of workouts) {
      totalExercises += workout.exercises?.length || 0;
      estimatedCalories += workout.estimatedCalories || 0;
      workout.exercises.forEach((ex) => {
        totalDuration += Number(ex.duration) || 0;
      });
    }
    return {
      totalWorkouts,
      estimatedCalories,
      totalExercises,
      totalDuration,
    };
  }

  async getMonthlyAnalysis(userId: string) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const lang = I18nContext.current()?.lang || 'vi';
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];
    const workouts = this.workoutRepository.createQueryBuilder('workout');
    workouts
      .leftJoinAndSelect('workout.scheduleItems', 'scheduleItems')
      .leftJoinAndSelect('workout.exercises', 'exercises');
    if (startDate) {
      workouts.andWhere('workout.startDate >= :startDate', { startDate });
    }
    if (endDate) {
      workouts.andWhere('workout.endDate <= :endDate', { endDate });
    }
    const rawData = await workouts
      .where('workout.user = :userId', { userId })
      .getMany();
    if (!rawData.length) {
      return 'Không có dữ liệu workout trong tháng này.';
    }
    const stats = this.calculateStats(rawData);
    return {
      stats,
      prompt: getMonthlyAnalysis(rawData, lang),
    };
  }
}
