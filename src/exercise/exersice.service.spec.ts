import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseService } from './exercise.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Exercise } from './exercise.entity';
import { MuscleGroup } from './exercise-musclegroup';
import { WorkoutplanService } from '../workoutplan/workoutplan.service';
import { Workout } from '../workoutplan/workoutplan.entity';
import { NotFoundException } from '@nestjs/common';
import { AppLogger } from '../common/helper/app-logger.service';

const mockUser = { id: 'id', username: 'duong', password: '123' };
const mockExerciseService = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn().mockResolvedValue(''),
  delete: jest.fn(),
};
const mockExersise = {
  id: 'id',
  name: 'Dumbbell Bench Press',
  muscleGroup: MuscleGroup.Chest,
  sets: 4,
  reps: 10,
  restTime: 90,
  note: 'Focus on slow negative',
};
describe('ExerciseService', () => {
  let exerciseService: ExerciseService;
  let findOneWorkoutSpy: jest.SpyInstance;
  let findOneExerciseSpy: jest.SpyInstance;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [
        ExerciseService,
        AppLogger,
        WorkoutplanService,
        {
          provide: getRepositoryToken(Exercise),
          useValue: mockExerciseService,
        },
        {
          provide: getRepositoryToken(Workout),
          useValue: {},
        },
      ],
    }).compile();
    exerciseService = module.get<ExerciseService>(ExerciseService);
    findOneWorkoutSpy = jest.spyOn(exerciseService, 'findOneWorkout');
    findOneExerciseSpy = jest.spyOn(exerciseService, 'findOneExercise');
  });

  describe('createExercise', () => {
    const workoutId = 'workout_id';
    const createExerciseDto = {
      name: 'Dumbbell Bench Press',
      muscleGroup: MuscleGroup.Chest,
      sets: 4,
      reps: 10,
      restTime: 90,
      note: 'Focus on slow negative',
    };
    const mockFoundWorkout = { id: workoutId, name: 'Day A', user: mockUser };
    const createdExerciseEntity = {
      id: 'exercise_id',
      ...createExerciseDto,
      user: mockUser,
      workoutPlan: mockFoundWorkout,
    };

    it('should successfully create and save a new exercise', async () => {
      findOneWorkoutSpy.mockResolvedValue(mockFoundWorkout);
      mockExerciseService.create.mockReturnValue(createdExerciseEntity);
      mockExerciseService.save.mockResolvedValue(createdExerciseEntity);
      const result = await exerciseService.createExercise(
        workoutId,
        createExerciseDto,
        mockUser,
      );
      expect(findOneWorkoutSpy).toHaveBeenCalledWith(workoutId, mockUser);
      expect(mockExerciseService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createExerciseDto,
          user: mockUser,
          workoutId: workoutId,
          workoutPlan: mockFoundWorkout,
        }),
      );
      expect(mockExerciseService.save).toHaveBeenCalledWith(
        createdExerciseEntity,
      );
      expect(result).toEqual(createdExerciseEntity);
    });
    it('should throw NotFoundException if findOneWorkout fails', async () => {
      findOneWorkoutSpy.mockRejectedValueOnce(
        new NotFoundException('Workout not found'),
      );

      await expect(
        exerciseService.createExercise(workoutId, createExerciseDto, mockUser),
      ).rejects.toThrow(NotFoundException);

      expect(mockExerciseService.create).not.toHaveBeenCalledWith();
      expect(mockExerciseService.save).not.toHaveBeenCalledWith();
    });
  });

  describe('getAllExercise', () => {
    it('returns data, total and totalPages', async () => {
      const filter = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([['data'], 1]),
      };
      mockExerciseService.createQueryBuilder = jest.fn(() => filter);
      const result = await exerciseService.getAllExercies(
        { search: '' },
        { page: 1, limit: 10 },
        mockUser,
      );
      expect(result).toEqual({
        data: ['data'],
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('getExerciseById', () => {
    it('returns Exercise when found', async () => {
      mockExerciseService.findOne.mockResolvedValue(mockExersise);
      const result = await exerciseService.findOneExercise('id', mockUser);
      expect(mockExerciseService.findOne).toHaveBeenCalledWith({
        where: { id: 'id', user: mockUser },
      });
      expect(result).toEqual(mockExersise);
    });
    it('throws NotFoundException when Exercise not found', async () => {
      mockExerciseService.findOne.mockResolvedValue(null);
      await expect(
        exerciseService.findOneExercise('id', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteExersiceById', () => {
    it('should successfully delete a exersice when found', async () => {
      const id = 'id';
      const deleteResult = { affected: 1, raw: [] };
      mockExerciseService.delete.mockResolvedValue(deleteResult);
      await exerciseService.deleteExerciseById(id, mockUser);
      expect(mockExerciseService.delete).toHaveBeenCalledWith({
        id: id,
        user: mockUser,
      });
    });
    it('should throw NotFoundException if Exercise not found or not owned by user', async () => {
      const exerciseId = 'non-id';
      const deleteResult = { affected: 0, raw: [] };
      mockExerciseService.delete.mockResolvedValue(deleteResult);
      await expect(
        exerciseService.deleteExerciseById(exerciseId, mockUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockExerciseService.delete).toHaveBeenCalledWith({
        id: exerciseId,
        user: mockUser,
      });
    });
  });

  describe('updateExercise', () => {
    const newName = 'Incline Bench Press';
    const newRestTime = 75;
    const updateDto = {
      name: newName,
      restTime: newRestTime,
    };
    const expectedResult = {
      ...mockExersise,
      name: newName,
      restTime: newRestTime,
    };
    it('Should successfully update partial fields and call save', async () => {
      findOneExerciseSpy.mockResolvedValue(mockExersise);

      mockExerciseService.save.mockResolvedValue(expectedResult);
      const result = await exerciseService.updateExercise(
        mockExersise.id,
        updateDto,
        mockUser,
      );
      expect(findOneExerciseSpy).toHaveBeenCalledWith(
        mockExersise.id,
        mockUser,
      );
      expect(mockExerciseService.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockExersise.id,
          name: newName,
          restTime: newRestTime,
          note: mockExersise.note,
        }),
      );
      expect(result).toEqual(expectedResult);
    });
    it('throws NotFoundException when Exercise not found', async () => {
      mockExerciseService.findOne.mockResolvedValue(null);
      await expect(
        exerciseService.updateExercise('id', updateDto, mockUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockExerciseService.save).not.toHaveBeenCalledWith();
    });
  });
});
