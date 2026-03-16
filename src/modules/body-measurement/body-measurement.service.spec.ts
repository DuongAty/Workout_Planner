import { Test, TestingModule } from '@nestjs/testing';
import { BodyMeasurementService } from './body-measurement.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BodyMeasurement } from './body-measurement.entity';
import { MuscleGroup } from '../exercise/exercise-musclegroup';
import {
  GOOD_PROGRESS,
  NEED_TRY,
  NO_ENOUGH_DATA,
} from '../../constants/constants';
import * as dateUtils from '../../utils/dateUtils/dateUtils';

describe('BodyMeasurementService', () => {
  let service: BodyMeasurementService;
  let repo: Repository<BodyMeasurement>;

  const mockUser = { id: 'user-1' } as any;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BodyMeasurementService,
        {
          provide: getRepositoryToken(BodyMeasurement),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get(BodyMeasurementService);
    repo = module.get(getRepositoryToken(BodyMeasurement));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('should create and save measurement', async () => {
      const dto = { key: MuscleGroup.Chest, value: 100 } as any;
      const entity = { id: 'm1', ...dto, user: mockUser };

      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue(entity);

      const result = await service.create(mockUser, dto);

      expect(repo.create).toHaveBeenCalledWith({ ...dto, user: mockUser });
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });
  });

  describe('getProgress()', () => {
    it('should return NO_ENOUGH_DATA if data length < limit', async () => {
      const measurement = { value: 100 };

      mockRepo.find.mockResolvedValue([measurement]);

      const result = await service.getProgress(mockUser, MuscleGroup.CHEST, 2);

      expect(result).toEqual({
        message: NO_ENOUGH_DATA,
        current: measurement,
      });
    });

    it('should return GOOD_PROGRESS when value increases', async () => {
      const latest = {
        value: 110,
        createdAt: new Date(),
      };
      const prev = { value: 100 };

      mockRepo.find.mockResolvedValue([latest, prev]);

      const result = await service.getProgress(mockUser, MuscleGroup.Chest, 2);

      expect(result.status).toBe(GOOD_PROGRESS);
      expect(result.diff).toBe(10);
    });

    it('should return GOOD_PROGRESS for Abs when value decreases', async () => {
      const latest = {
        value: 80,
        createdAt: new Date(),
      };
      const prev = { value: 90 };

      mockRepo.find.mockResolvedValue([latest, prev]);

      const result = await service.getProgress(mockUser, MuscleGroup.Abs, 2);

      expect(result.status).toBe(GOOD_PROGRESS);
      expect(result.diff).toBe(-10);
    });

    it('should return NEED_TRY when progress is bad', async () => {
      const latest = {
        value: 90,
        createdAt: new Date(),
      };
      const prev = { value: 100 };

      mockRepo.find.mockResolvedValue([latest, prev]);

      const result = await service.getProgress(mockUser, MuscleGroup.Chest, 2);

      expect(result.status).toBe(NEED_TRY);
    });
  });

  describe('findAllForChart()', () => {
    it('should build query and map result correctly', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      const data = [
        {
          createdAt: new Date('2026-01-01'),
          value: 100,
          key: MuscleGroup.Chest,
        },
      ];

      qb.getMany.mockResolvedValue(data);
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllForChart(mockUser, {
        key: MuscleGroup.Chest,
      } as any);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual([
        {
          date: data[0].createdAt,
          value: 100,
          group: MuscleGroup.Chest,
        },
      ]);
    });

    it('should call checkDateRange if startDate and endDate provided', async () => {
      const spy = jest.spyOn(dateUtils, 'checkDateRange').mockImplementation();

      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAllForChart(mockUser, {
        startDate: '2026-01-01',
        endDate: '2026-01-10',
      } as any);

      expect(spy).toHaveBeenCalledWith('2026-01-01', '2026-01-10');
    });
  });
});
