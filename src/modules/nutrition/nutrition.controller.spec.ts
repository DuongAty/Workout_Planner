import { Test, TestingModule } from '@nestjs/testing';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';
import { User } from '../user/user.entity';

describe('NutritionController', () => {
  let controller: NutritionController;
  let service: NutritionService;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@mail.com',
  } as User;

  const mockNutritionService = {
    logMealAndAnalyze: jest.fn(),
    calculateDailyBalance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NutritionController],
      providers: [
        {
          provide: NutritionService,
          useValue: mockNutritionService,
        },
      ],
    }).compile();

    controller = module.get<NutritionController>(NutritionController);
    service = module.get<NutritionService>(NutritionService);

    jest.clearAllMocks();
  });

  describe('logMeal()', () => {
    it('should call logMealAndAnalyze with user and meal', async () => {
      const dto = {
        meal: {
          calories: 500,
          protein: 30,
        },
      };

      const result = { calories: 500, status: 'ok' };
      mockNutritionService.logMealAndAnalyze.mockResolvedValue(result);

      const response = await controller.logMeal(dto as any, mockUser);

      expect(service.logMealAndAnalyze).toHaveBeenCalledTimes(1);
      expect(service.logMealAndAnalyze).toHaveBeenCalledWith(
        mockUser,
        dto.meal,
      );
      expect(response).toEqual(result);
    });
  });

  describe('getSummary()', () => {
    it('should call calculateDailyBalance with date', async () => {
      const date = '2026-01-01';
      const result = { caloriesIn: 2000, caloriesOut: 1800 };

      mockNutritionService.calculateDailyBalance.mockResolvedValue(result);

      const response = await controller.getSummary(mockUser, date);

      expect(service.calculateDailyBalance).toHaveBeenCalledTimes(1);
      expect(service.calculateDailyBalance).toHaveBeenCalledWith(
        mockUser,
        date,
      );
      expect(response).toEqual(result);
    });

    it('should call calculateDailyBalance without date', async () => {
      const result = { caloriesIn: 1500, caloriesOut: 1600 };

      mockNutritionService.calculateDailyBalance.mockResolvedValue(result);

      const response = await controller.getSummary(mockUser, undefined);

      expect(service.calculateDailyBalance).toHaveBeenCalledTimes(1);
      expect(service.calculateDailyBalance).toHaveBeenCalledWith(
        mockUser,
        undefined,
      );
      expect(response).toEqual(result);
    });
  });
});
