import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { WorkoutplanService } from './workoutplan.service';
import { WorkoutStatus } from './workout-status';
import { UploadService } from '../../upload/upload.service';
import { TransactionService } from '../../transaction/transaction';
import { OpenAIService } from '../openai/openai.service';
import { DateUtils } from '../../utils/dateUtils/dateUtils';

import { Workout } from './workoutplan.entity';
import { Exercise } from '../exercise/exercise.entity';
import { ScheduleItem } from './schedule-items/schedule-item.entity';
import { BodyMeasurement } from '../body-measurement/body-measurement.entity';
import { NutritionLog } from '../nutrition/nutrition-log.entity';
import { User } from '../user/user.entity';

describe('WorkoutplanService', () => {
  let service: WorkoutplanService;
  const mockUser = { id: 'user-123' } as User;
  const mockWorkout = {
    id: 'w-1',
    name: 'Test Workout',
    startDate: '2024-01-01',
    endDate: '2024-01-07',
    daysOfWeek: [1, 3],
    exercises: [],
    scheduleItems: [],
    user: mockUser,
  } as unknown as Workout;

  const createMockQueryBuilder = () => ({
    select: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
    setParameters: jest.fn().mockReturnThis(),
    getQuery: jest.fn().mockReturnValue('SELECT query'),
    getParameters: jest.fn().mockReturnValue({}),
  });

  const mockWorkoutRepo = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
  };

  const mockExerciseRepo = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
  };

  const mockScheduleItemRepo = {
    find: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
  };

  const mockGenericRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUploadService = {
    cleanupFile: jest.fn(),
    cloneFile: jest.fn((fileName) => `cloned_${fileName}`),
  };

  const mockOpenAIService = {
    chat: jest.fn(),
  };

  const mockTransactionService = {
    run: jest.fn(async (callback) => {
      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity === Workout || entity === 'Workout')
            return mockWorkoutRepo;
          if (entity === Exercise || entity === 'Exercise')
            return mockExerciseRepo;
          if (entity === ScheduleItem || entity === 'ScheduleItem')
            return mockScheduleItemRepo;
          return mockGenericRepo;
        }),
        create: jest.fn().mockImplementation((entity, data) => data),
        save: jest
          .fn()
          .mockImplementation(async (entity, data) => data || entity),
        createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
      };
      return await callback(mockManager);
    }),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutplanService,
        { provide: getRepositoryToken(Workout), useValue: mockWorkoutRepo },
        { provide: getRepositoryToken(Exercise), useValue: mockExerciseRepo },
        {
          provide: getRepositoryToken(ScheduleItem),
          useValue: mockScheduleItemRepo,
        },
        { provide: getRepositoryToken(User), useValue: mockGenericRepo },
        {
          provide: getRepositoryToken(BodyMeasurement),
          useValue: mockGenericRepo,
        },
        {
          provide: getRepositoryToken(NutritionLog),
          useValue: mockGenericRepo,
        },
        { provide: UploadService, useValue: mockUploadService },
        { provide: OpenAIService, useValue: mockOpenAIService },
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();
    service = module.get<WorkoutplanService>(WorkoutplanService);
  });

  describe('createRecurringWorkout', () => {
    const dto = {
      name: 'Morning Routine',
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      daysOfWeek: [1, 3],
    };

    it('should create a workout successfully when no conflict exists', async () => {
      mockScheduleItemRepo.find.mockResolvedValue([]);
      mockWorkoutRepo.create.mockReturnValue(mockWorkout);
      mockWorkoutRepo.save.mockResolvedValue(mockWorkout);
      const result = await service.createRecurringWorkout(dto as any, mockUser);
      expect(mockScheduleItemRepo.find).toHaveBeenCalled();
      expect(mockWorkoutRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockWorkout);
    });

    it('should throw BadRequestException if dates conflict', async () => {
      mockScheduleItemRepo.find.mockResolvedValue([{ date: '2024-01-01' }]);
      await expect(
        service.createRecurringWorkout(dto as any, mockUser),
      ).rejects.toThrow(BadRequestException);

      expect(mockWorkoutRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('getAllWorkout', () => {
    const filterDto = { page: 1, limit: 10 };

    it('should return paginated workouts', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[mockWorkout], 1]);
      mockWorkoutRepo.createQueryBuilder.mockReturnValue(qb);
      const result = await service.getAllWorkout({}, filterDto, mockUser);
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(result.data).toEqual([mockWorkout]);
      expect(result.total).toBe(1);
    });

    it('should apply search filter correctly', async () => {
      const qb = createMockQueryBuilder();
      mockWorkoutRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getAllWorkout({ search: 'Legs' }, filterDto, mockUser);

      expect(qb.andWhere).toHaveBeenCalledWith('workout.name ILIKE :search', {
        search: '%Legs%',
      });
    });

    it('should apply todayOnly filter (Inner Join)', async () => {
      const qb = createMockQueryBuilder();
      mockWorkoutRepo.createQueryBuilder.mockReturnValue(qb);
      await service.getAllWorkout({ todayOnly: true }, filterDto, mockUser);
      expect(qb.innerJoin).toHaveBeenCalledWith(
        'workout.scheduleItems',
        'todayItem',
        expect.stringContaining('todayItem.date = :today'),
        expect.any(Object),
      );
    });
  });

  describe('findOneWorkout', () => {
    it('should return workout if found', async () => {
      mockWorkoutRepo.findOneOrFail.mockResolvedValue(mockWorkout);
      const result = await service.findOneWorkout('w-1', mockUser);
      expect(result).toEqual(mockWorkout);
    });

    it('should throw NotFoundException if not found', async () => {
      mockWorkoutRepo.findOneOrFail.mockRejectedValue(new Error('DB Error'));

      await expect(
        service.findOneWorkout('invalid-id', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateWorkout', () => {
    it('should trigger cloneWorkout when schedule (startDate) changes', async () => {
      jest.spyOn(service, 'findOneWorkout').mockResolvedValue(mockWorkout);
      const cloneSpy = jest
        .spyOn(service as any, 'cloneWorkout')
        .mockResolvedValue({ id: 'w-cloned' });
      const updateDto = { startDate: '2024-02-01', endDate: '2024-02-07' };
      const result = await service.updateWorkout('w-1', mockUser, updateDto);
      expect(cloneSpy).toHaveBeenCalled();
      expect(result).toEqual({ id: 'w-cloned' });
    });
    it('should only update name (no clone) when schedule is same', async () => {
      jest.spyOn(service, 'findOneWorkout').mockResolvedValue(mockWorkout);
      const cloneSpy = jest.spyOn(service as any, 'cloneWorkout');
      const updateDto = { name: 'New Name' };
      mockWorkoutRepo.save.mockResolvedValue({
        ...mockWorkout,
        name: 'New Name',
      });
      const result = await service.updateWorkout('w-1', mockUser, updateDto);
      expect(cloneSpy).not.toHaveBeenCalled();
      expect(mockWorkoutRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('New Name');
    });
  });

  describe('deleteWorkoutById', () => {
    it('should cleanup files and remove workout', async () => {
      const workoutWithFiles = {
        ...mockWorkout,
        exercises: [
          { thumbnail: 'thumb.jpg', videoUrl: 'video.mp4' },
          { thumbnail: null, videoUrl: 'video2.mp4' },
        ],
      };
      jest
        .spyOn(service, 'findOneWorkout')
        .mockResolvedValue(workoutWithFiles as any);

      await service.deleteWorkoutById('w-1', mockUser);
      expect(mockUploadService.cleanupFile).toHaveBeenCalledTimes(3);
      expect(mockWorkoutRepo.remove).toHaveBeenCalled();
    });

    it('should handle workout with no exercises', async () => {
      jest.spyOn(service, 'findOneWorkout').mockResolvedValue(mockWorkout); // mockWorkout có exercises = []
      await service.deleteWorkoutById('w-1', mockUser);
      expect(mockUploadService.cleanupFile).not.toHaveBeenCalled();
      expect(mockWorkoutRepo.remove).toHaveBeenCalled();
    });
  });

  describe('generateAndSave (AI)', () => {
    const aiResponse = {
      name: 'AI Plan',
      startDate: '2024-01-01',
      endDate: '2024-01-02',
      daysOfWeek: [1],
      scheduleItems: [{ date: '2024-01-01' }],
      exercises: [{ name: 'Pushup' }],
    };

    it('should save AI generated data successfully', async () => {
      jest
        .spyOn(service, 'generateFromChat')
        .mockResolvedValue(aiResponse as any);
      const mockManager = {
        create: jest.fn((entity, data) => data),
        save: jest.fn(async (entity, data) => data),
      };
      mockTransactionService.run.mockImplementation(async (cb) =>
        cb(mockManager),
      );
      const result = await service.generateAndSave('create plan', 'user-id');
      expect(mockManager.create).toHaveBeenCalledWith(
        'Workout',
        expect.anything(),
      );
      expect(mockManager.create).toHaveBeenCalledWith(
        'Exercise',
        expect.anything(),
      );
      expect(mockManager.save).toHaveBeenCalledTimes(3); // Workout + ScheduleItems + Exercises
    });

    it('should throw InternalServerErrorException if DB save fails', async () => {
      jest
        .spyOn(service, 'generateFromChat')
        .mockResolvedValue(aiResponse as any);
      const mockManager = {
        create: jest.fn(),
        save: jest.fn().mockRejectedValue(new Error('DB Error')),
      };
      mockTransactionService.run.mockImplementation(async (cb) =>
        cb(mockManager),
      );

      await expect(service.generateAndSave('msg', 'uid')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw BadRequestException if AI returns null', async () => {
      mockOpenAIService.chat.mockResolvedValue(null);
      await expect(service.generateFromChat('msg')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cloneWorkout', () => {
    it('should deeply clone workout, schedule and files', async () => {
      jest.spyOn(service, 'findOneWorkout').mockResolvedValue({
        ...mockWorkout,
        exercises: [{ id: 'ex1', thumbnail: 't.jpg' }],
      } as any);
      jest
        .spyOn(DateUtils, 'generateScheduleDays')
        .mockReturnValue(['2024-02-01']);
      mockWorkoutRepo.create.mockReturnValue({ id: 'new-w' });
      mockWorkoutRepo.save.mockResolvedValue({ id: 'new-w' });
      await service.cloneWorkout('w-1', mockUser, {
        startDate: '2024-02-01',
        endDate: '2024-02-02',
        daysOfWeek: [1],
      } as any);
      expect(mockUploadService.cloneFile).toHaveBeenCalledWith('t.jpg');
      expect(mockExerciseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: undefined,
          thumbnail: 'cloned_t.jpg',
        }),
      );
    });
  });

  describe('checkMissedWorkouts', () => {
    it('should update status to Missed for past planned items', async () => {
      const qb = createMockQueryBuilder();
      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          createQueryBuilder: () => qb,
        }),
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      };
      mockTransactionService.run.mockImplementation(async (cb) =>
        cb(mockManager),
      );
      await service.checkMissedWorkouts(mockUser);
      expect(qb.update).toHaveBeenCalledWith(ScheduleItem);
      expect(qb.set).toHaveBeenCalledWith({ status: WorkoutStatus.Missed });
      expect(qb.execute).toHaveBeenCalled();
    });
  });

  describe('updateItemStatus', () => {
    it('should throw NotFoundException if item does not exist', async () => {
      const qb = createMockQueryBuilder();
      qb.getOne.mockResolvedValue(null); // Không tìm thấy

      const mockManager = {
        getRepository: jest
          .fn()
          .mockReturnValue({ createQueryBuilder: () => qb }),
      };
      mockTransactionService.run.mockImplementation(async (cb) =>
        cb(mockManager),
      );

      await expect(
        service.updateItemStatus('item-id', mockUser, WorkoutStatus.Completed),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
