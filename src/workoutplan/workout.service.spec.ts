import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkoutplanService } from './workoutplan.service';
import { Workout } from './workoutplan.entity';
import { Exercise } from '../exercise/exercise.entity';
import { NotFoundException } from '@nestjs/common';
import { ExerciseService } from '../exercise/exercise.service';
import { PassportModule } from '@nestjs/passport';
import { AppLogger } from '../common/logger/app-logger.service';
import { UploadService } from '../common/upload/upload.service';

const mockUser = { id: 'id', username: 'duong', password: '123' };
const mockWorkout = { id: 'workout-123', title: 'Plan A', user: mockUser };
const workoutRepoMock = {
  create: jest.fn(),
  save: jest.fn(),
  getAllWorkout: jest.fn().mockResolvedValue('value'),
  findOneOrFail: jest.fn().mockResolvedValue(''),
  delete: jest.fn(),
  update: jest.fn(),
  where: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(5),
  createQueryBuilder: jest.fn().mockReturnThis(),
  remove: jest.fn(),
};
const mockExerciseService = {
  create: jest.fn(),
  save: jest.fn(),
};
let workPlanService: WorkoutplanService;
let serviceExerciseService: ExerciseService;
describe('WorkoutplanService', () => {
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [
        AppLogger,
        WorkoutplanService,
        ExerciseService,
        UploadService,
        {
          provide: getRepositoryToken(Workout),
          useValue: workoutRepoMock,
        },
        {
          provide: getRepositoryToken(Exercise),
          useValue: mockExerciseService,
        },
        {
          provide: UploadService,
          useValue: {
            cleanupFile: jest.fn().mockResolvedValue(undefined),
            cloneFile: jest.fn((file) => `cloned-${file}`),
          },
        },
      ],
    }).compile();
    workPlanService = module.get<WorkoutplanService>(WorkoutplanService);
    uploadService = module.get<UploadService>(UploadService);
  });
  describe('syncNumExercises', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('nên cập nhật numExercises bằng số lượng exercise trong workout', async () => {
      const workoutId = 'w1';
      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
      };
      mockExerciseService.createQueryBuilder = jest
        .fn()
        .mockReturnValue(queryBuilderMock);

      await workPlanService.syncNumExercises(workoutId);
      expect(mockExerciseService.createQueryBuilder).toHaveBeenCalledWith(
        'exercise',
      );
      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        'exercise.workoutId = :workoutId',
        { workoutId },
      );
      expect(workoutRepoMock.update).toHaveBeenCalledWith(workoutId, {
        numExercises: 3,
      });
    });
    it('nên cập nhật numExercises = 0 khi không có exercise', async () => {
      const workoutId = 'w2';
      mockExerciseService.createQueryBuilder = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });
      await workPlanService.syncNumExercises(workoutId);
      expect(workoutRepoMock.update).toHaveBeenCalledWith(workoutId, {
        numExercises: 0,
      });
    });
  });

  describe('createWorkout', () => {
    it('should create and save a workout', async () => {
      const dto = { name: 'Push Day' };
      const created = { id: 1, name: dto.name, user: mockUser };
      workoutRepoMock.create.mockReturnValue(created);
      workoutRepoMock.save.mockResolvedValue(created);
      const result = await workPlanService.createWorkout(dto, mockUser);
      expect(workoutRepoMock.create).toHaveBeenCalledWith({
        name: dto.name,
        user: mockUser,
      });
      expect(workoutRepoMock.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('getAllWorkout', () => {
    it('returns data, total and totalPages', async () => {
      const mockData = ['workout1', 'workout2'];
      const mockTotal = 2;
      const filter = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockData, mockTotal]),
      };
      workoutRepoMock.createQueryBuilder = jest.fn().mockReturnValue(filter);
      const filterDto = { search: 'Push Up', numExercises: 5 };
      const paginationDto = { page: 2, limit: 10 };
      const expectedSkip = 10;
      const result = await workPlanService.getAllWorkout(
        filterDto,
        paginationDto,
        mockUser,
      );
      expect(workoutRepoMock.createQueryBuilder).toHaveBeenCalledWith(
        'workout',
      );
      expect(filter.where).toHaveBeenCalledWith({ user: mockUser });
      expect(filter.andWhere).toHaveBeenCalledWith(
        'workout.name ILIKE :search',
        { search: `%${filterDto.search}%` },
      );
      expect(filter.andWhere).toHaveBeenCalledWith(
        'workout.numExercises = :numExercises',
        { numExercises: filterDto.numExercises },
      );
      expect(filter.skip).toHaveBeenCalledWith(expectedSkip);
      expect(filter.take).toHaveBeenCalledWith(paginationDto.limit);
      expect(result).toEqual({
        data: mockData,
        total: mockTotal,
        totalPages: 1,
      });
    });
  });

  describe('findOneWorkout', () => {
    it('nên trả về một workout nếu tìm thấy', async () => {
      workoutRepoMock.findOneOrFail.mockResolvedValue(mockWorkout);
      const result = await workPlanService.findOneWorkout(
        'workout-123',
        mockUser,
      );
      expect(workoutRepoMock.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 'workout-123', user: mockUser },
        relations: [],
      });
      expect(result).toEqual(mockWorkout);
    });
    it('nên ném lỗi NotFoundException nếu không tìm thấy workout', async () => {
      workoutRepoMock.findOneOrFail.mockRejectedValue(new Error());
      const workoutId = 'wrong-id';
      await expect(
        workPlanService.findOneWorkout(workoutId, mockUser),
      ).rejects.toThrow(NotFoundException);
      await expect(
        workPlanService.findOneWorkout(workoutId, mockUser),
      ).rejects.toThrow(`Workout with ID "${workoutId}" not found`);
    });
    it('nên gọi đúng relations nếu được truyền vào', async () => {
      workoutRepoMock.findOneOrFail.mockResolvedValue(mockWorkout);
      const relations = ['exercises'];
      await workPlanService.findOneWorkout('workout-123', mockUser, relations);
      expect(workoutRepoMock.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 'workout-123', user: mockUser },
        relations: relations,
      });
    });
  });

  describe('deleteWorkoutById', () => {
    it('should successfully delete a workout', async () => {
      const workoutId = 'id';
      const mockWorkout = { id: workoutId, exercises: [] };
      jest
        .spyOn(workPlanService, 'findOneWorkout')
        .mockResolvedValue(mockWorkout as any);
      workoutRepoMock.remove = jest.fn().mockResolvedValue(mockWorkout);
      await workPlanService.deleteWorkoutById(workoutId, mockUser);
      expect(workoutRepoMock.remove).toHaveBeenCalledWith(mockWorkout);
    });
    it('should throw NotFoundException if workout not found or not owned by user', async () => {
      const workoutId = 'non-existent-id';
      workoutRepoMock.remove.mockClear();
      const spy = jest
        .spyOn(workPlanService, 'findOneWorkout')
        .mockRejectedValue(
          new NotFoundException(`Workout with ID "${workoutId}" not found`),
        );
      await expect(
        workPlanService.deleteWorkoutById(workoutId, mockUser),
      ).rejects.toThrow(NotFoundException);
      expect(workoutRepoMock.remove).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('updateWorkoutName', () => {
    const id = 'id';
    const newName = 'Leg Day Extreme';
    const workout = {
      id: id,
      name: 'Old Name',
      user: mockUser,
    };
    let findOneWorkoutSpy: jest.SpyInstance;
    beforeEach(() => {
      findOneWorkoutSpy = jest.spyOn(workPlanService, 'findOneWorkout');
      jest.clearAllMocks();
    });
    it('should successfully update the workout name when found', async () => {
      findOneWorkoutSpy.mockResolvedValue(workout);
      const updatedWorkout = { ...workout, name: newName };
      workoutRepoMock.save.mockResolvedValue(updatedWorkout);
      const result = await workPlanService.updateNameWorkout(
        id,
        newName,
        mockUser,
      );
      expect(findOneWorkoutSpy).toHaveBeenCalledWith(id, mockUser);
      expect(workoutRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: id,
          name: newName,
          user: mockUser,
        }),
      );
      expect(workoutRepoMock.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedWorkout);
      expect(result.name).toBe(newName);
    });
    it('should throw NotFoundException if findOneWorkout throws it', async () => {
      const notFoundError = new NotFoundException('Workout not found');
      workoutRepoMock.findOneOrFail.mockRejectedValue(notFoundError);
      await expect(
        workPlanService.updateNameWorkout(id, newName, mockUser),
      ).rejects.toThrow(NotFoundException);
      expect(workoutRepoMock.save).not.toHaveBeenCalled();
      expect(workoutRepoMock.findOneOrFail).toHaveBeenCalledTimes(1);
    });
  });

  describe('WorkPlanClone', () => {
    const workoutId = 'id';
    const newId = 'newId';
    const originalExercises = [
      {
        id: 'ex1',
        name: 'Ngực trên',
        sets: 4,
        reps: 10,
        restTime: 60,
        note: '.',
        muscleGroup: 'Ngực',
      },
      {
        id: 'ex2',
        name: 'Squat',
        sets: 3,
        reps: 8,
        restTime: 90,
        note: '.',
        muscleGroup: 'Chân',
      },
    ];
    const originalWorkout = {
      id: workoutId,
      name: 'Full Body A',
      numExercises: 2,
      user: mockUser,
      exercises: originalExercises,
    };
    const newWorkout = {
      id: newId,
      name: originalWorkout.name + ' (Clone)',
      user: mockUser,
    };
    const newExercisesCreated = originalExercises.map((ex, index) => ({
      ...ex,
      id: `newEx${index}`,
      workoutId: newId,
      user: mockUser,
    }));
    let findOneWorkoutSpy: jest.SpyInstance;
    beforeEach(() => {
      findOneWorkoutSpy = jest.spyOn(workPlanService, 'findOneWorkout');
      jest.clearAllMocks();
    });
    it('should successfully clone the workout and its exercises', async () => {
      workoutRepoMock.findOneOrFail.mockResolvedValue(originalWorkout);
      workoutRepoMock.create.mockReturnValue(newWorkout);
      workoutRepoMock.save.mockReturnValue(newWorkout);
      mockExerciseService.create.mockImplementation((data) => {
        const index = originalExercises.findIndex(
          (ex) => ex.name === data.name,
        );
        return newExercisesCreated[index];
      });
      mockExerciseService.save.mockResolvedValue(newExercisesCreated);
      const result = await workPlanService.cloneWorkout(workoutId, mockUser);
      expect(workoutRepoMock.findOneOrFail).toHaveBeenCalledWith({
        where: { id: workoutId, user: mockUser },
        relations: ['exercises'],
      });
      expect(workoutRepoMock.create).toHaveBeenCalledWith({
        name: 'Full Body A (Clone)',
        numExercises: 2,
        user: mockUser,
      });
      expect(workoutRepoMock.save).toHaveBeenCalledWith(newWorkout);
      expect(mockExerciseService.create).toHaveBeenCalledTimes(
        originalExercises.length,
      );
      expect(mockExerciseService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ngực trên',
          workoutId: newId,
          user: mockUser,
        }),
      );
      expect(mockExerciseService.save).toHaveBeenCalledWith(
        newExercisesCreated,
      );
      expect(result.id).toBe(newId);
      expect(result.name).toBe('Full Body A (Clone)');
      expect(result.exercises.length).toBe(originalExercises.length);
    });
  });
});
