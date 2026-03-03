import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseTrackingService } from './exersciseTracking.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExerciseSet } from './exerciseSet.entity';
import { Exercise } from '../exercise.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { WorkoutMath } from '../../common/mathUtils/math.util';
import { checkDateRange } from '../../common/dateUtils/dateUtils';

jest.mock('../../common/mathUtils/math.util');
jest.mock('../../common/dateUtils/dateUtils');

describe('ExerciseTrackingService', () => {
  let service: ExerciseTrackingService;
  let setRepo: jest.Mocked<Repository<ExerciseSet>>;
  let exerciseRepo: jest.Mocked<Repository<Exercise>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciseTrackingService,
        {
          provide: getRepositoryToken(ExerciseSet),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
            getRawOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Exercise),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ExerciseTrackingService);
    setRepo = module.get(getRepositoryToken(ExerciseSet));
    exerciseRepo = module.get(getRepositoryToken(Exercise));
  });

  describe('logSet', () => {
    it('should create and save set when exercise exists', async () => {
      exerciseRepo.findOneBy.mockResolvedValue({ id: 'ex1' } as Exercise);
      setRepo.create.mockReturnValue({ id: 'set1' } as any);
      setRepo.save.mockResolvedValue({ id: 'set1' } as any);

      const result = await service.logSet('ex1', {
        reps: 10,
        weight: 100,
      } as any);

      expect(exerciseRepo.findOneBy).toHaveBeenCalledWith({ id: 'ex1' });
      expect(setRepo.create).toHaveBeenCalled();
      expect(setRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('set1');
    });

    it('should throw NotFoundException when exercise not found', async () => {
      exerciseRepo.findOneBy.mockResolvedValue(null);

      await expect(service.logSet('ex1', {} as any)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(setRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('getExerciseProgress', () => {
    it('should calculate volume and 1RM for each set', async () => {
      (WorkoutMath.calculateVolume as jest.Mock).mockReturnValue(1000);
      (WorkoutMath.calculate1RM as jest.Mock).mockReturnValue(120);

      setRepo.find.mockResolvedValue([
        { weight: 100, reps: 10 } as ExerciseSet,
      ]);

      const result = await service.getExerciseProgress('ex1');

      expect(result[0].volume).toBe(1000);
      expect(result[0].estimated1RM).toBe(120);
    });
  });

  describe('getStats', () => {
    it('should calculate totals correctly', async () => {
      jest.spyOn(service, 'getExerciseProgress').mockResolvedValue([
        { volume: 1000, estimated1RM: 120 },
        { volume: 500, estimated1RM: 130 },
      ] as any);

      const result = await service.getStats('ex1');

      expect(result.totalVolume).toBe(1500);
      expect(result.personalRecord1RM).toBe(130);
      expect(result.totalSets).toBe(2);
    });
  });

  describe('getTimelineProgress', () => {
    it('should validate date range when provided', async () => {
      (checkDateRange as jest.Mock).mockImplementation(() => {});

      const qb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        getRawOne: jest.fn().mockResolvedValue([]),
      };

      setRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getTimelineProgress('ex1', {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(checkDateRange).toHaveBeenCalled();
    });
  });
});
