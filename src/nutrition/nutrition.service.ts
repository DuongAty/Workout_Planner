import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { OpenAIService } from '../openai/openai.service';
import { User, UserGoal } from '../user/user.entity';
import { Workout } from 'src/workoutplan/workoutplan.entity';
import { NutritionLog } from './nutrition-log.entity';

@Injectable()
export class NutritionService {
  constructor(
    @InjectRepository(NutritionLog)
    private nutritionRepo: Repository<NutritionLog>,
    @InjectRepository(Workout)
    private workoutRepo: Repository<Workout>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private openAIService: OpenAIService,
  ) {}

  async logMealAndAnalyze(user: User, mealDescription: string) {
    const aiData = await this.openAIService.analyzeFood(mealDescription);
    const log = this.nutritionRepo.create({
      mealDescription,
      calories: aiData.totalCalories,
      protein: aiData.protein,
      carbs: aiData.carbs,
      fat: aiData.fat,
      user: user,
    });
    await this.nutritionRepo.save(log);
    return await this.calculateDailyBalance(user);
  }

  async calculateDailyBalance(user: User) {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const logs = await this.nutritionRepo.find({
      where: { userId: user.id, createdAt: Between(startOfDay, endOfDay) },
    });
    const totalIntake = logs.reduce((sum, item) => sum + item.calories, 0);
    const todayStr = startOfDay.toLocaleDateString('en-CA');
    const workoutsToday = await this.workoutRepo
      .createQueryBuilder('workout')
      .innerJoin(
        'workout.scheduleItems',
        'todayItem',
        'todayItem.date = :todayStr',
        { todayStr },
      )
      .andWhere('workout.userId = :userId', { userId: user.id })
      .getMany();

    const burnedFromWorkout = workoutsToday.reduce(
      (sum, w) => sum + w.estimatedCalories,
      0,
    );
    const bmr = 88.36 + 13.4 * (user.weight || 70) + 4.8 * (user.height || 170);
    const totalBurned = bmr + burnedFromWorkout;
    const balance = totalIntake - totalBurned;
    let status = '';
    const advice = '';
    const goal = user.goal || UserGoal.MAINTAIN;

    if (goal === UserGoal.GAIN_MUSCLE) {
      if (balance > 300) {
        status = 'Tuyệt vời, bạn đang dư calo để tăng cơ!';
      } else if (balance > 0) {
        status = 'Hơi thiếu, cần ăn thêm để tối ưu tăng cơ.';
      } else {
        status = 'Cảnh báo: Bạn đang thâm hụt calo, cơ bắp khó phát triển.';
      }
    } else if (goal === UserGoal.LOSE_WEIGHT) {
      if (balance < -300) {
        status = 'Tốt, bạn đang thâm hụt calo để giảm cân.';
      } else if (balance < 0) {
        status = 'Đang giảm chậm, cố gắng vận động thêm.';
      } else {
        status = 'Cảnh báo: Bạn đang dư calo, sẽ không giảm cân được.';
      }
    }

    return {
      date: todayStr,
      intake: totalIntake,
      burned: {
        bmr: Math.round(bmr),
        workout: burnedFromWorkout,
        total: Math.round(totalBurned),
      },
      balance: Math.round(balance),
      userGoal: goal,
      analysis: status,
      recentLogs: logs,
    };
  }
}
