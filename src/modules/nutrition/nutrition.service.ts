import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpenAIService } from '../openai/openai.service';
import { User } from '../user/user.entity';
import { Workout } from '../workoutplan/workoutplan.entity';
import { NutritionLog } from './nutrition-log.entity';
import { Gender, UserGoal } from 'src/enums/user-enum';

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

  async logMealAndAnalyze(user: User, mealDescription: string, lang: string) {
    const aiData = await this.openAIService.analyzeFood(mealDescription);
    if (aiData.is_food === false) {
      throw new BadRequestException(
        'The content you entered is not a meal. Please try again!',
      );
    }
    const log = this.nutritionRepo.create({
      id: aiData.id,
      mealDescription,
      calories: aiData.totalCalories,
      protein: aiData.protein,
      carbs: aiData.carbs,
      fat: aiData.fat,
      advice: aiData.advice,
      user: user,
    });
    await this.nutritionRepo.save(log);
    return await this.calculateDailyBalance(user);
  }

  async calculateDailyBalance(user: User, dateStr?: string) {
    const todayDate = dateStr || new Date().toISOString().split('T')[0];
    const startDate = new Date();
    const endDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    try {
      const logs = await this.nutritionRepo
        .createQueryBuilder('log')
        .where('log.userId = :userId', { userId: user.id })
        .andWhere('DATE(log.createdAt) = :todayDate', { todayDate })
        .getMany();
      const totalIntake = logs.reduce((sum, log) => sum + log.calories, 0);
      const workoutsToday = await this.workoutRepo
        .createQueryBuilder('workout')
        .innerJoin(
          'workout.scheduleItems',
          'todayItem',
          'todayItem.date = :todayDate',
          { todayDate },
        )
        .andWhere('workout.userId = :userId', { userId: user.id })
        .getMany();
      const burnedFromWorkout = workoutsToday.reduce(
        (sum, workout) => sum + workout.estimatedCalories,
        0,
      );
      let bmr: number;
      if (user.gender === Gender.MALE) {
        bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
      } else {
        bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
      }
      const totalBurned = bmr + burnedFromWorkout;
      const balance = totalIntake - totalBurned;
      const status = this.getStatus(user.goal, balance);
      const advice = this.getAdvice(user.goal, balance);
      return {
        date: new Date(startDate).toLocaleDateString('en-CA'),
        intake: totalIntake,
        burned: {
          bmr: Math.round(bmr),
          workout: burnedFromWorkout,
          total: Math.round(totalBurned),
        },
        balance: Math.round(balance),
        userGoal: user.goal,
        analysis: status,
        recentLogs: logs,
      };
    } catch (e) {
      throw new BadRequestException('DB Error: ' + e.message);
    }
  }

  private getStatus(goal: UserGoal, balance: number) {
    if (goal === UserGoal.GAIN_MUSCLE) {
      if (balance > 300) {
        return 'Tuyệt vời, bạn đang dư calo để tăng cơ!';
      } else if (balance > 0) {
        return 'Hơi thiếu, cần ăn thêm để tối ưu tăng cơ.';
      } else {
        return 'Cảnh báo: Bạn đang thâm hụt calo, cơ bắp khó phát triển.';
      }
    } else if (goal === UserGoal.LOSE_WEIGHT) {
      if (balance < -300) {
        return 'Tốt, bạn đang thâm hụt calo để giảm cân.';
      } else if (balance < 0) {
        return 'Đang giảm chậm, cố gắng vận động thêm.';
      } else {
        return 'Cảnh báo: Bạn đang dư calo, sẽ không giảm cân được.';
      }
    }
  }

  private getAdvice(goal: UserGoal, balance: number) {
    if (goal === UserGoal.GAIN_MUSCLE) {
      if (balance > 300) {
        return 'Cố gắng vận động thêm và ăn đủ để tăng cơ.';
      } else if (balance > 0) {
        return 'Ăn thêm để tối ưu tăng cơ.';
      } else {
        return 'Cố gắng vận động nhiều hơn và ăn đủ để tăng cơ.';
      }
    } else if (goal === UserGoal.LOSE_WEIGHT) {
      if (balance < -300) {
        return 'Cố gắng vận động nhiều hơn và ăn đủ để giảm cân.';
      } else if (balance < 0) {
        return 'Ăn thêm để giảm cân.';
      } else {
        return 'Cố gắng vận động nhiều hơn và ăn đủ để giảm cân.';
      }
    }
  }
}
