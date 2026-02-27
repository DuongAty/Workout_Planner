import { Test, TestingModule } from '@nestjs/testing';
import { NutritionService } from './nutrition.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NutritionLog } from './nutrition-log.entity';
import { Workout } from '../workoutplan/workoutplan.entity';
import { User } from '../user/user.entity';
import { OpenAIService } from '../openai/openai.service';
import { Gender, UserGoal } from '../common/enum/user-enum';

describe('NutritionService', () => {
  let service: NutritionService;

  const mockNutritionRepo = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockWorkoutRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepo = {};

  const mockOpenAIService = {
    analyzeFood: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-1',
    gender: Gender.MALE,
    age: 25,
    height: 175,
    weight: 70,
    goal: UserGoal.GAIN_MUSCLE,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NutritionService,
        {
          provide: getRepositoryToken(NutritionLog),
          useValue: mockNutritionRepo,
        },
        { provide: getRepositoryToken(Workout), useValue: mockWorkoutRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: OpenAIService, useValue: mockOpenAIService },
      ],
    }).compile();

    service = module.get(NutritionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logMealAndAnalyze', () => {
    it('should analyze food, save log and return daily balance', async () => {
      mockOpenAIService.analyzeFood.mockResolvedValue({
        totalCalories: 500,
        protein: 30,
        carbs: 50,
        fat: 20,
        advice: 'Good meal',
      });

      mockNutritionRepo.create.mockReturnValue({ id: 'log-1' });
      mockNutritionRepo.save.mockResolvedValue(true);

      jest
        .spyOn(service, 'calculateDailyBalance')
        .mockResolvedValue({ balance: 100 } as any);

      const result = await service.logMealAndAnalyze(mockUser, 'Chicken rice');

      expect(mockOpenAIService.analyzeFood).toHaveBeenCalledWith(
        'Chicken rice',
      );
      expect(mockNutritionRepo.create).toHaveBeenCalled();
      expect(mockNutritionRepo.save).toHaveBeenCalled();
      expect(result.balance).toBe(100);
    });
  });

  describe('calculateDailyBalance', () => {
    it('should calculate intake, burned calories and balance correctly (MALE)', async () => {
      mockNutritionRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([{ calories: 600 }, { calories: 400 }]),
      });

      mockWorkoutRepo.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ estimatedCalories: 300 }]),
      });

      const result = await service.calculateDailyBalance(mockUser);

      // Intake
      expect(result.intake).toBe(1000);

      // BMR = 10*70 + 6.25*175 - 5*25 + 5 = 1674
      expect(result.burned.bmr).toBe(1674);
      expect(result.burned.workout).toBe(300);
      expect(result.burned.total).toBe(1974);

      expect(result.userGoal).toBe(UserGoal.GAIN_MUSCLE);
      expect(result.recentLogs.length).toBe(2);
    });

    it('should use female BMR formula', async () => {
      const femaleUser = {
        ...mockUser,
        gender: Gender.FEMALE,
      };

      mockNutritionRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      mockWorkoutRepo.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.calculateDailyBalance(femaleUser as User);

      // 10*70 + 6.25*175 - 5*25 - 161 = 1508
      expect(result.burned.bmr).toBe(1508);
    });

    it('should handle LOSE_WEIGHT goal', async () => {
      const loseWeightUser = {
        ...mockUser,
        goal: UserGoal.LOSE_WEIGHT,
      };

      mockNutritionRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ calories: 200 }]),
      });

      mockWorkoutRepo.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.calculateDailyBalance(
        loseWeightUser as User,
      );

      expect(result.userGoal).toBe(UserGoal.LOSE_WEIGHT);
      expect(result.analysis).toContain('thâm hụt');
    });
  });
});
