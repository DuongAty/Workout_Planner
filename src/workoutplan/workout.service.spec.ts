import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { In, EntityManager } from 'typeorm';
import { WorkoutplanService } from './workoutplan.service';
import { WorkoutStatus } from './workout-status';

describe('WorkoutService', () => {
  let service: WorkoutplanService;
  let workoutPlanService: any;
  let exerciseService: any;
  let scheduleItemRepository: any;
  let transactionService: any;
  let uploadService: any;

  const mockUser = { id: 'user-123' } as any;

  beforeEach(async () => {
    // Mocking repositories and services
    workoutPlanService = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    exerciseService = { count: jest.fn() };
    scheduleItemRepository = { find: jest.fn() };
    transactionService = { run: jest.fn((cb) => cb()) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutplanService,
        { provide: 'WorkoutPlanService', useValue: workoutPlanService },
        { provide: 'ExerciseService', useValue: exerciseService },
        { provide: 'ScheduleItemRepository', useValue: scheduleItemRepository },
        { provide: 'TransactionService', useValue: transactionService },
      ],
    }).compile();

    service = module.get<WorkoutplanService>(WorkoutplanService);
  });

  describe('syncNumExercises', () => {
    const workoutId = 'w-1';

    it('should use services when no manager is provided', async () => {
      exerciseService.count.mockResolvedValue(5);

      await service.syncNumExercises(workoutId);

      expect(exerciseService.count).toHaveBeenCalledWith({
        where: { workoutId },
      });
      expect(workoutPlanService.update).toHaveBeenCalledWith(workoutId, {
        numExercises: 5,
      });
    });

    it('should use manager repositories when manager is provided', async () => {
      const mockRepo = {
        count: jest.fn().mockResolvedValue(3),
        update: jest.fn(),
      };
      const mockManager = {
        getRepository: jest.fn().mockReturnValue(mockRepo),
      } as any;

      await service.syncNumExercises(workoutId, mockManager);

      expect(mockManager.getRepository).toHaveBeenCalledTimes(2);
      expect(mockRepo.count).toHaveBeenCalled();
      expect(mockRepo.update).toHaveBeenCalledWith(workoutId, {
        numExercises: 3,
      });
    });
  });

  describe('createRecurringWorkout', () => {
    const dto = {
      name: 'Morning Routine',
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      daysOfWeek: [1, 3], // Monday and Wednesday
    };

    it('should throw BadRequestException if dates conflict', async () => {
      scheduleItemRepository.find.mockResolvedValue([{ date: '2024-01-01' }]);
      await expect(
        service.createRecurringWorkout(dto as any, mockUser),
      ).rejects.toThrow(BadRequestException);

      expect(workoutPlanService.save).not.toHaveBeenCalled();
    });

    it('should successfully create a workout with generated schedule items', async () => {
      scheduleItemRepository.find.mockResolvedValue([]);
      workoutPlanService.create.mockImplementation((val) => val);
      workoutPlanService.save.mockResolvedValue({ id: 'new-workout' });

      const result = await service.createRecurringWorkout(dto as any, mockUser);
      expect(workoutPlanService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.name,
          scheduleItems: expect.arrayContaining([
            expect.objectContaining({
              date: '2024-01-01',
              status: WorkoutStatus.Planned,
            }),
            expect.objectContaining({
              date: '2024-01-03',
              status: WorkoutStatus.Planned,
            }),
          ]),
        }),
      );
      expect(result).toBeDefined();
      expect(workoutPlanService.save).toHaveBeenCalled();
    });
  });
  describe('updateItemStatus', () => {
    it('should update status and return the workout', async () => {
      const scheduleItemId = 'item-123';
      const mockItem = {
        id: scheduleItemId,
        status: 'Planned',
        workout: { id: 'w-1' },
      };

      // Mock QueryBuilder chain
      const queryBuilder: any = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockItem),
      };

      const mockManager = {
        getRepository: jest
          .fn()
          .mockReturnValue({ createQueryBuilder: () => queryBuilder }),
        save: jest.fn().mockResolvedValue({ ...mockItem, status: 'Completed' }),
      };

      // Mock transaction runner
      transactionService.run.mockImplementation(async (cb) => cb(mockManager));
      // Mock findOneWorkout (the return call)
      jest.spyOn(service, 'findOneWorkout').mockResolvedValue(mockWorkout);

      const result = await service.updateItemStatus(
        scheduleItemId,
        mockUser,
        'Completed' as any,
      );

      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Completed' }),
      );
      expect(service.findOneWorkout).toHaveBeenCalledWith(
        'w-1',
        mockUser,
        expect.any(Array),
      );
      expect(result).toEqual(mockWorkout);
    });

    it('should throw NotFoundException if item does not exist', async () => {
      const queryBuilder: any = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null), // Item not found
      };

      const mockManager = {
        getRepository: jest
          .fn()
          .mockReturnValue({ createQueryBuilder: () => queryBuilder }),
      };

      transactionService.run.mockImplementation(async (cb) => cb(mockManager));

      await expect(
        service.updateItemStatus('invalid-id', mockUser, 'Completed' as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSchedule', () => {
    it('should update a specific schedule date successfully', async () => {
      const updateDto = { oldDate: '2024-01-01', newDate: '2024-01-02' };

      const executeMock = jest.fn().mockResolvedValue({ affected: 1 });
      const queryBuilder: any = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: executeMock,
      };

      const mockManager = {
        getRepository: jest
          .fn()
          .mockReturnValue({ createQueryBuilder: () => queryBuilder }),
      };

      transactionService.run.mockImplementation(async (cb) => cb(mockManager));
      jest.spyOn(service, 'findOneWorkout').mockResolvedValue(mockWorkout);

      await service.updateSchedule('w-1', mockUser, updateDto);

      expect(queryBuilder.set).toHaveBeenCalledWith({
        date: '2024-01-02',
        status: 'Planned',
      });
      expect(executeMock).toHaveBeenCalled();
    });

    it('should update startDate and endDate of the workout', async () => {
      const updateDto = { startDate: '2024-02-01', endDate: '2024-02-28' };
      const mockWorkoutRepo = {
        update: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      const mockManager = {
        getRepository: jest.fn().mockReturnValue(mockWorkoutRepo),
      };

      transactionService.run.mockImplementation(async (cb) => cb(mockManager));
      jest.spyOn(service, 'findOneWorkout').mockResolvedValue(mockWorkout);

      await service.updateSchedule('w-1', mockUser, updateDto);

      expect(mockWorkoutRepo.update).toHaveBeenCalledWith(
        { id: 'w-1', user: { id: mockUser.id } },
        { startDate: '2024-02-01', endDate: '2024-02-28' },
      );
    });

    it('should throw NotFoundException if update target date does not exist', async () => {
      const updateDto = { oldDate: 'non-existent', newDate: '2024-01-01' };
      const queryBuilder: any = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }), // 0 rows changed
      };

      const mockManager = {
        getRepository: jest
          .fn()
          .mockReturnValue({ createQueryBuilder: () => queryBuilder }),
      };

      transactionService.run.mockImplementation(async (cb) => cb(mockManager));

      await expect(
        service.updateSchedule('w-1', mockUser, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkMissedWorkouts', () => {
    it('should update past planned workouts to missed status', async () => {
      const executeMock = jest.fn().mockResolvedValue({ affected: 2 });

      // Mock subquery for workout IDs
      const subQueryMock: any = {
        getQuery: jest
          .fn()
          .mockReturnValue('SELECT id FROM workout WHERE userId = ?'),
        getParameters: jest.fn().mockReturnValue({ userId: mockUser.id }),
      };

      const queryBuilderMock: any = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        execute: executeMock,
      };

      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          createQueryBuilder: () => ({
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnValue(subQueryMock),
          }),
        }),
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
      };

      transactionService.run.mockImplementation(async (cb) => cb(mockManager));

      await service.checkMissedWorkouts(mockUser);

      expect(queryBuilderMock.set).toHaveBeenCalledWith({
        status: WorkoutStatus.Missed,
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('date < :today'),
        expect.any(Object),
      );
      expect(executeMock).toHaveBeenCalled();
    });
  });

  describe('getAllWorkout', () => {
    const paginationDto = { page: 1, limit: 10 };

    it('should return paginated data with filters applied', async () => {
      const filter = { search: 'Chest', numExercises: '5' };
      const mockData = [{ id: '1', name: 'Chest Day' }];
      const queryBuilderMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockData, 1]),
      };

      workoutPlanService.createQueryBuilder.mockReturnValue(queryBuilderMock);

      const result = await service.getAllWorkout(
        filter,
        paginationDto,
        mockUser,
      );

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'workout.name ILIKE :search',
        { search: '%Chest%' },
      );
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'workout.numExercises = :numExercises',
        { numExercises: 5 },
      );
      expect(result.totalPages).toBe(1);
      expect(result.data).toEqual(mockData);
    });

    it('should apply innerJoin when todayOnly is true', async () => {
      const filter = { todayOnly: true };
      const queryBuilderMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      workoutPlanService.createQueryBuilder.mockReturnValue(queryBuilderMock);

      await service.getAllWorkout(filter, paginationDto, mockUser);

      expect(queryBuilderMock.innerJoin).toHaveBeenCalledWith(
        'workout.scheduleItems',
        'todayItem',
        'todayItem.date = :today',
        expect.any(Object),
      );
    });
  });

  describe('findOneWorkout', () => {
    it('should return a workout if found', async () => {
      const mockWorkout = { id: 'w-1', user: { id: mockUser.id } };
      workoutPlanService.findOneOrFail.mockResolvedValue(mockWorkout);

      const result = await service.findOneWorkout('w-1', mockUser, [
        'exercises',
      ]);

      expect(workoutPlanService.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 'w-1', user: { id: mockUser.id } },
        relations: ['exercises'],
      });
      expect(result).toEqual(mockWorkout);
    });

    it('should throw NotFoundException if findOneOrFail fails', async () => {
      workoutPlanService.findOneOrFail.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(
        service.findOneWorkout('invalid-id', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('WorkoutService - deleteWorkoutById', () => {
    const mockUser = { id: 'user-1' } as any;
    const mockWorkoutId = 'workout-123';

    it('should cleanup all exercise files and remove the workout', async () => {
      const mockWorkout = {
        id: mockWorkoutId,
        exercises: [
          { thumbnail: 'thumb1.jpg', videoUrl: 'video1.mp4' },
          { thumbnail: 'thumb2.png' },
          { videoUrl: 'video2.mov' },
        ],
      };
      jest
        .spyOn(service, 'findOneWorkout')
        .mockResolvedValue(mockWorkout as any);
      const cleanupSpy = jest
        .spyOn(uploadService, 'cleanupFile')
        .mockImplementation();
      workoutPlanService.remove.mockResolvedValue(undefined);
      transactionService.run.mockImplementation(async (cb) => cb());
      await service.deleteWorkoutById(mockWorkoutId, mockUser);
      expect(service.findOneWorkout).toHaveBeenCalledWith(
        mockWorkoutId,
        mockUser,
        ['exercises'],
      );
      expect(cleanupSpy).toHaveBeenCalledTimes(4);
      expect(cleanupSpy).toHaveBeenCalledWith('thumb1.jpg');
      expect(cleanupSpy).toHaveBeenCalledWith('video1.mp4');
      expect(cleanupSpy).toHaveBeenCalledWith('thumb2.png');
      expect(cleanupSpy).toHaveBeenCalledWith('video2.mov');

      expect(workoutPlanService.remove).toHaveBeenCalledWith(mockWorkout);
    });
    it('should remove the workout even if no exercises or files exist', async () => {
      const mockWorkout = { id: mockWorkoutId, exercises: [] };

      jest
        .spyOn(service, 'findOneWorkout')
        .mockResolvedValue(mockWorkout as any);
      const cleanupSpy = jest.spyOn(uploadService, 'cleanupFile');

      await service.deleteWorkoutById(mockWorkoutId, mockUser);

      expect(cleanupSpy).not.toHaveBeenCalled();
      expect(workoutPlanService.remove).toHaveBeenCalledWith(mockWorkout);
    });

    it('should throw NotFoundException if workout is not found', async () => {
      jest
        .spyOn(service, 'findOneWorkout')
        .mockRejectedValue(new NotFoundException());

      await expect(
        service.deleteWorkoutById('wrong-id', mockUser),
      ).rejects.toThrow(NotFoundException);

      expect(workoutPlanService.remove).not.toHaveBeenCalled();
    });
  });
});
