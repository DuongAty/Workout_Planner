import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkoutplanService } from './workoutplan.service';
import { Workout } from './workoutplan.entity';
import { Exercise } from '../exercise/exercise.entity';
import { NotFoundException } from '@nestjs/common';
import { ExerciseService } from '../exercise/exercise.service';
import { PassportModule } from '@nestjs/passport';
import { AppLogger } from '../common/logger/app-logger.service';

const mockUser = { id: 'id', username: 'duong', password: '123' };
const workoutRepoMock = {
  create: jest.fn(),
  save: jest.fn(),
  getAllWorkout: jest.fn().mockResolvedValue('value'),
  findOne: jest.fn().mockResolvedValue(''),
  delete: jest.fn(),
  update: jest.fn(),
  where: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(5),
};
const mockExerciseService = {
  create: jest.fn(),
  save: jest.fn(),
};
let serviceWorkPlanService: WorkoutplanService;
let serviceExerciseService: ExerciseService;
describe('WorkoutplanService', () => {
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [
        AppLogger,
        WorkoutplanService,
        ExerciseService,
        {
          provide: getRepositoryToken(Workout),
          useValue: workoutRepoMock,
        },
        {
          provide: getRepositoryToken(Exercise),
          useValue: mockExerciseService,
        },
      ],
    }).compile();
    serviceWorkPlanService = module.get<WorkoutplanService>(WorkoutplanService);
    serviceExerciseService = module.get<ExerciseService>(ExerciseService);
  });
  describe('Sync Number', () => {
    it('Should update the exact number of exercises', async () => {
      const workoutId = 'workout-123';
      const mockCount = 5;
      workoutRepoMock.getCount.mockResolvedValue(mockCount);
      await serviceWorkPlanService.syncNumExercises(workoutId);
      expect(serviceWorkPlanService.createQueryBuilder).toHaveBeenCalledWith(
        'exercise',
      );
      expect(workoutRepoMock.where).toHaveBeenCalledWith(
        'exercise.workoutId = :workoutId',
        { workoutId },
      );
      expect(workoutRepoMock.getCount).toHaveBeenCalled();

      expect(workoutRepoMock.update).toHaveBeenCalledWith(workoutId, {
        numExercises: mockCount,
      });
    });
    it('should throw an error if the assignment counting process fails', async () => {
      const workoutId = 'workout-123';
      workoutRepoMock.getCount.mockRejectedValue(new Error('Database error'));
      await expect(
        serviceWorkPlanService.syncNumExercises(workoutId),
      ).rejects.toThrow('Database error');
      expect(workoutRepoMock.update).not.toHaveBeenCalled();
    });
    it('Should throw a NotFoundException error if workoutId does not exist on update', async () => {
      const workoutId = 'non-existent-id';
      workoutRepoMock.getCount.mockResolvedValue(0);
      workoutRepoMock.update.mockRejectedValue(
        new NotFoundException(`Workout with ID ${workoutId} not found`),
      );
      await expect(
        serviceWorkPlanService.syncNumExercises(workoutId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        serviceWorkPlanService.syncNumExercises(workoutId),
      ).rejects.toThrow(`Workout with ID ${workoutId} not found`);
    });
  });

  describe('createWorkout', () => {
    it('should create and save a workout', async () => {
      const dto = { name: 'Push Day' };
      const created = { id: 1, name: dto.name, user: mockUser };
      workoutRepoMock.create.mockReturnValue(created);
      workoutRepoMock.save.mockResolvedValue(created);
      const result = await serviceWorkPlanService.createWorkout(dto, mockUser);
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
      const filter = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([['data'], 1]),
      };
      workoutRepoMock.createQueryBuilder = jest.fn().mockReturnValue(filter);
      const filterDto = { search: 'Push Up', numExercises: 5 };
      const paginationDto = { page: 2, limit: 10 };
      const expectedSkip = 10;
      const result = await serviceWorkPlanService.getAllWorkout(
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
        data: ['workout1', 'workout2'],
        total: 25,
        totalPages: 3,
      });
    });
  });
});

describe('getWorkoutById', () => {
  it('returns workout when found', async () => {
    const mockWorkout = { id: 'id', name: 'Test name' };
    workoutRepoMock.findOne.mockResolvedValue(mockWorkout);
    const result = await serviceWorkPlanService.findOneWorkout('id', mockUser);
    expect(workoutRepoMock.findOne).toHaveBeenCalledWith({
      where: { id: 'id', user: mockUser },
    });
    expect(result).toEqual(mockWorkout);
  });
  it('throws NotFoundException when workout not found', async () => {
    workoutRepoMock.findOne.mockResolvedValue(null);
    await expect(
      serviceWorkPlanService.findOneWorkout('id', mockUser),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('deleteWorkoutById', () => {
  it('should successfully delete a workout when found', async () => {
    const id = 'id';
    const deleteResult = { affected: 1, raw: [] };
    workoutRepoMock.delete.mockResolvedValue(deleteResult);
    await serviceWorkPlanService.deleteWorkoutById(id, mockUser);
    expect(workoutRepoMock.delete).toHaveBeenCalledWith({
      id: id,
      user: mockUser,
    });
  });
  it('should throw NotFoundException if workout not found or not owned by user', async () => {
    const workoutId = 'non-existent-id';
    const deleteResult = { affected: 0, raw: [] };
    workoutRepoMock.delete.mockResolvedValue(deleteResult);
    await expect(
      serviceWorkPlanService.deleteWorkoutById(workoutId, mockUser),
    ).rejects.toThrow(NotFoundException);
    expect(workoutRepoMock.delete).toHaveBeenCalledWith({
      id: workoutId,
      user: mockUser,
    });
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
    findOneWorkoutSpy = jest.spyOn(serviceWorkPlanService, 'findOneWorkout');
    jest.clearAllMocks();
  });
  it('should successfully update the workout name when found', async () => {
    findOneWorkoutSpy.mockResolvedValue(workout);
    const updatedWorkout = { ...workout, name: newName };
    workoutRepoMock.save.mockResolvedValue(updatedWorkout);
    const result = await serviceWorkPlanService.updateNameWorkout(
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
    workoutRepoMock.findOne.mockRejectedValue(notFoundError);
    await expect(
      serviceWorkPlanService.updateNameWorkout(id, newName, mockUser),
    ).rejects.toThrow(NotFoundException);
    expect(workoutRepoMock.save).not.toHaveBeenCalled();
    expect(workoutRepoMock.findOne).toHaveBeenCalledTimes(1);
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
    findOneWorkoutSpy = jest.spyOn(serviceWorkPlanService, 'findOneWorkout');
    jest.clearAllMocks();
  });
  it('should successfully clone the workout and its exercises', async () => {
    workoutRepoMock.findOne.mockResolvedValue(originalWorkout);
    workoutRepoMock.create.mockReturnValue(newWorkout);
    workoutRepoMock.save.mockReturnValue(newWorkout);
    mockExerciseService.create.mockImplementation((data) => {
      const index = originalExercises.findIndex((ex) => ex.name === data.name);
      return newExercisesCreated[index];
    });
    mockExerciseService.save.mockResolvedValue(newExercisesCreated);
    const result = await serviceWorkPlanService.cloneWorkout(
      workoutId,
      mockUser,
    );
    expect(workoutRepoMock.findOne).toHaveBeenCalledWith({
      where: { id: workoutId, user: mockUser },
      relations: ['exercises'],
    });
    expect(workoutRepoMock.create).toHaveBeenCalledWith({
      name: 'Full Body A (Clone)',
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
    expect(mockExerciseService.save).toHaveBeenCalledWith(newExercisesCreated);
    expect(result.id).toBe(newId);
    expect(result.name).toBe('Full Body A (Clone)');
    expect(result.exercises.length).toBe(originalExercises.length);
  });
});
