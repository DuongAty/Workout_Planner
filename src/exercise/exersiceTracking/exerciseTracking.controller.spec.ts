import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseTrackingController } from './exerciseTracking.controller';
import { ExerciseTrackingService } from './exersciseTracking.service';
import { BadRequestException } from '@nestjs/common';

describe('ExerciseTrackingController', () => {
  let controller: ExerciseTrackingController;
  let service: jest.Mocked<ExerciseTrackingService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExerciseTrackingController],
      providers: [
        {
          provide: ExerciseTrackingService,
          useValue: {
            logSet: jest.fn(),
            getExerciseProgress: jest.fn(),
            getStats: jest.fn(),
            getTimelineProgress: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ExerciseTrackingController);
    service = module.get(ExerciseTrackingService);
  });

  describe('logSet', () => {
    it('should call service.logSet with correct params', async () => {
      const dto = { reps: 10, weight: 100 } as any;
      const exerciseId = '550e8400-e29b-41d4-a716-446655440000';

      service.logSet.mockResolvedValue({ id: 'set1' } as any);

      const result = await controller.logSet(dto, exerciseId);

      expect(service.logSet).toHaveBeenCalledWith(exerciseId, dto);
      expect(result.id).toBe('set1');
    });
  });

  describe('getProgress', () => {
    it('should return exercise progress', async () => {
      service.getExerciseProgress.mockResolvedValue([
        { volume: 1000 },
      ] as any);

      const result = await controller.getProgress('ex1');

      expect(service.getExerciseProgress).toHaveBeenCalledWith('ex1');
      expect(result.length).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return exercise stats', async () => {
      service.getStats.mockResolvedValue({
        totalVolume: 1500,
        personalRecord1RM: 130,
        totalSets: 2,
      } as any);

      const result = await controller.getStats('ex1');

      expect(service.getStats).toHaveBeenCalledWith('ex1');
      expect(result.totalSets).toBe(2);
    });
  });

  describe('getTimeline', () => {
    it('should call service with query params', async () => {
      const query = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };

      service.getTimelineProgress.mockResolvedValue([]);

      const result = await controller.getTimeline('ex1', query as any);

      expect(service.getTimelineProgress).toHaveBeenCalledWith('ex1', query);
      expect(result).toEqual([]);
    });

    it('should bubble error from service', async () => {
      service.getTimelineProgress.mockRejectedValue(
        new BadRequestException('Invalid date range'),
      );

      await expect(
        controller.getTimeline('ex1', {} as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
