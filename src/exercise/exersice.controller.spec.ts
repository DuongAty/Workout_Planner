import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseController } from './exercise.controller';
import { ExerciseService } from './exercise.service';
import { MuscleGroup } from './exercise-musclegroup';
import { NotFoundException } from '@nestjs/common';
import { AppLogger } from '../common/helper/app-logger.service';

const mockUser = { id: 'id', username: 'duong', password: '123' };
const mockExersise = {
  id: 'id',
  name: 'Dumbbell Bench Press',
  muscleGroup: MuscleGroup.Chest,
  sets: 4,
  reps: 10,
  restTime: 90,
  note: 'Focus on slow negative',
};
const mockExersiceService = {
  createExercise: jest.fn(),
  getAllExercies: jest.fn().mockResolvedValue('value'),
  findOneExercise: jest.fn().mockResolvedValue(''),
  deleteExerciseById: jest.fn(),
  updateExercise: jest.fn(),
};
const workoutID = 'id';
describe('ExerciseController', () => {
  let controller: ExerciseController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [ExerciseController],
      providers: [
        AppLogger,
        {
          provide: ExerciseService,
          useValue: mockExersiceService,
        },
        {
          provide: 'Logger',
          useValue: { verbose: jest.fn() },
        },
      ],
    }).compile();
    controller = module.get<ExerciseController>(ExerciseController);
  });

  describe('createExercise', () => {
    const createExerciseDto = {
      name: 'Dumbbell Bench Press',
      muscleGroup: MuscleGroup.Chest,
      sets: 4,
      reps: 10,
      restTime: 90,
      note: 'Focus on slow negative',
    };
    const exersiceCreated = {
      workoutID,
      ...createExerciseDto,
      mockUser,
    };
    it('You should call service.createExercise with the correct DTO and User.', async () => {
      mockExersiceService.createExercise.mockResolvedValue(exersiceCreated);
      const result = await controller.createExercise(
        workoutID,
        createExerciseDto,
        mockUser,
      );
      expect(mockExersiceService.createExercise).toHaveBeenCalledWith(
        workoutID,
        createExerciseDto,
        mockUser,
      );
      expect(result).toEqual(exersiceCreated);
    });
    it('It should return the result that the service returned', async () => {
      mockExersiceService.createExercise.mockResolvedValue(
        mockExersiceService,
        mockUser,
      );
      await controller.createExercise(workoutID, createExerciseDto, mockUser);
      expect(mockExersiceService.createExercise).toHaveBeenCalledWith(
        workoutID,
        createExerciseDto,
        mockUser,
      );
    });
    it('should throw error if service fails', async () => {
      jest.clearAllMocks();
      const mockError = new NotFoundException('Workout not found');
      mockExersiceService.createExercise.mockRejectedValue(mockError);
      await expect(
        controller.createExercise(workoutID, createExerciseDto, mockUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockExersiceService.createExercise).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllExersices', () => {
    const mockFilter = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([['data'], 1]),
    };
    const mockPagination = { page: 1, limit: 10 };
    it('You should call exerciseService.getAllExercises with the correct parameters.', async () => {
      mockExersiceService.getAllExercies.mockResolvedValue(
        mockExersiceService,
        mockUser,
      );
      await controller.getExersices(mockFilter, mockPagination, mockUser);
      expect(mockExersiceService.getAllExercies).toHaveBeenCalledWith(
        mockFilter,
        mockPagination,
        mockUser,
      );
      expect(mockExersiceService.getAllExercies).toHaveBeenCalledTimes(1);
    });
    it('It should return the result that the service returned.', async () => {
      mockExersiceService.getAllExercies.mockResolvedValue(mockExersise);
      const result = await controller.getExersices(
        mockFilter,
        mockPagination,
        mockUser,
      );
      expect(result).toEqual(mockExersise);
    });
  });

  describe('findOneExercise', () => {
    const exerciseId = mockExersise.id;
    it('It should return the result that the service returned.', async () => {
      mockExersiceService.findOneExercise.mockResolvedValue(mockExersise);
      const result = await controller.getExercisebyId(exerciseId, mockUser);
      expect(mockExersiceService.findOneExercise).toHaveBeenCalledWith(
        exerciseId,
        mockUser,
      );
      expect(result).toEqual(mockExersise);
    });
    it('throws NotFoundException when Exercise not found', async () => {
      mockExersiceService.findOneExercise.mockRejectedValue(
        new NotFoundException(`Exercise with ID ${exerciseId} not found`),
      );
      await expect(
        controller.getExercisebyId(exerciseId, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteExercise', () => {
    const exerciseId = mockExersise.id;
    it('It should return the result that the service returned.', async () => {
      mockExersiceService.deleteExerciseById.mockResolvedValue(mockExersise);
      const result = await controller.deleteExerciseByid(exerciseId, mockUser);
      expect(mockExersiceService.deleteExerciseById).toHaveBeenCalledWith(
        exerciseId,
        mockUser,
      );
      expect(result).toEqual(mockExersise);
    });
    it('throws NotFoundException when exercise not found', async () => {
      mockExersiceService.deleteExerciseById.mockRejectedValue(
        new NotFoundException(`Workout with ID ${exerciseId} not found`),
      );
      await expect(
        controller.deleteExerciseByid(exerciseId, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateExercise', () => {
    const exerciseId = 'exercise-id';
    const updateDto = {
      name: 'Bench Press Updated',
      muscleGroup: MuscleGroup.Chest,
      sets: 4,
      reps: 12,
      restTime: 60,
      note: 'Go heavy',
    };
    const mockResult = { id: exerciseId, ...updateDto, user: mockUser };
    it('should call exerciseService.updateExercise and return the result', async () => {
      mockExersiceService.updateExercise.mockResolvedValue(mockResult);
      const result = await controller.updateExercise(
        exerciseId,
        updateDto,
        mockUser,
      );
      expect(mockExersiceService.updateExercise).toHaveBeenCalledWith(
        exerciseId,
        updateDto,
        mockUser,
      );
      expect(result).toEqual(mockResult);
    });
    it('throws NotFoundException when exercise not found', async () => {
      mockExersiceService.updateExercise.mockRejectedValue(
        new NotFoundException(`Exercise with ID ${exerciseId} not found`),
      );
      await expect(
        controller.updateExercise(exerciseId, updateDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
