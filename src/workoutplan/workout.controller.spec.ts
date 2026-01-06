import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutplanController } from './workoutplan.controller';
import { WorkoutplanService } from './workoutplan.service';
import { PassportModule } from '@nestjs/passport';
import { NotFoundException } from '@nestjs/common';
import { AppLogger } from '../common/logger/app-logger.service';

const mockUser = { id: 'id', username: 'duong', password: '123' };
const mockWorkoutService = {
  createWorkout: jest.fn(),
  getAllWorkout: jest.fn().mockResolvedValue('value'),
  findOneWorkout: jest.fn().mockResolvedValue(''),
  deleteWorkoutById: jest.fn(),
  updateNameWorkout: jest.fn(),
  cloneWorkout: jest.fn(),
};
const mockWorkout = { id: 'id', name: 'Ngực' };
describe('Workoutplancontroller', () => {
  let controller: WorkoutplanController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [WorkoutplanController],
      providers: [
        AppLogger,
        {
          provide: WorkoutplanService,
          useValue: mockWorkoutService,
        },
        {
          provide: 'Logger',
          useValue: { verbose: jest.fn() },
        },
      ],
    }).compile();
    controller = module.get<WorkoutplanController>(WorkoutplanController);
  });

  describe('createWWork', () => {
    const mockCreateWorkoutDto = { name: 'Ngực' };
    it('You should call service.createWorkout with the correct DTO and User.', async () => {
      mockWorkoutService.createWorkout.mockResolvedValue(mockCreateWorkoutDto);
      await controller.create(mockCreateWorkoutDto, mockUser);
      expect(mockWorkoutService.createWorkout).toHaveBeenCalledTimes(1);
      expect(mockWorkoutService.createWorkout).toHaveBeenCalledWith(
        mockCreateWorkoutDto,
        mockUser,
      );
    });
    it('It should return the result that the service returned.', async () => {
      mockWorkoutService.createWorkout.mockResolvedValue(mockWorkoutService);
      const result = await controller.create(mockCreateWorkoutDto, mockUser);
      expect(result).toEqual(mockWorkoutService);
    });
  });

  describe('getAllWorkout', () => {
    const mockFilter = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([['data'], 1]),
    };
    const mockPagination = { page: 1, limit: 10 };
    it('You should call workoutService.getAllWorkout with the correct parameters.', async () => {
      mockWorkoutService.getAllWorkout.mockResolvedValue(mockWorkoutService);
      await controller.getAll(mockFilter, mockPagination, mockUser);
      expect(mockWorkoutService.getAllWorkout).toHaveBeenCalledWith(
        mockFilter,
        mockPagination,
        mockUser,
      );
      expect(mockWorkoutService.getAllWorkout).toHaveBeenCalledTimes(1);
    });
    it('It should return the result that the service returned.', async () => {
      mockWorkoutService.getAllWorkout.mockResolvedValue(mockWorkout);
      const result = await controller.getAll(
        mockFilter,
        mockPagination,
        mockUser,
      );
      expect(result).toEqual(mockWorkout);
    });
  });

  describe('findOneWorkout', () => {
    const workoutId = mockWorkout.id;
    it('It should return the result that the service returned.', async () => {
      mockWorkoutService.findOneWorkout.mockResolvedValue(mockWorkout);
      const result = await controller.getOne(workoutId, mockUser);
      expect(mockWorkoutService.findOneWorkout).toHaveBeenCalledWith(
        workoutId,
        mockUser,
      );
      expect(result).toEqual(mockWorkout);
    });
    it('throws NotFoundException when workout not found', async () => {
      mockWorkoutService.findOneWorkout.mockRejectedValue(
        new NotFoundException(`Workout with ID ${workoutId} not found`),
      );
      await expect(controller.getOne(workoutId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteWorkout', () => {
    const workoutId = mockWorkout.id;
    it('It should return the result that the service returned.', async () => {
      mockWorkoutService.deleteWorkoutById.mockResolvedValue(mockWorkout);
      const result = await controller.delete(workoutId, mockUser);
      expect(mockWorkoutService.deleteWorkoutById).toHaveBeenCalledWith(
        workoutId,
        mockUser,
      );
      expect(result).toEqual(mockWorkout);
    });
    it('throws NotFoundException when workout not found', async () => {
      mockWorkoutService.deleteWorkoutById.mockRejectedValue(
        new NotFoundException(`Workout with ID ${workoutId} not found`),
      );
      await expect(controller.delete(workoutId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateWorkout', () => {
    const workoutId = mockWorkout.id;
    const mockUpdateWorkoutDto = { name: 'Ngực đã Cập nhật' };
    const mockUpdatedWorkout = {
      id: 'id',
      name: mockUpdateWorkoutDto.name,
      user: mockUser,
    };
    it('It should return the result that the service returned.', async () => {
      mockWorkoutService.updateNameWorkout.mockResolvedValue(
        mockUpdatedWorkout,
      );
      const result = await controller.update(
        workoutId,
        mockUpdateWorkoutDto,
        mockUser,
      );
      expect(mockWorkoutService.updateNameWorkout).toHaveBeenCalledWith(
        workoutId,
        mockUpdateWorkoutDto.name,
        mockUser,
      );
      expect(result).toEqual(mockUpdatedWorkout);
    });
    it('throws NotFoundException when workout not found', async () => {
      mockWorkoutService.updateNameWorkout.mockRejectedValue(
        new NotFoundException(`Workout with ID ${workoutId} not found`),
      );
      await expect(
        controller.update(workoutId, mockUpdateWorkoutDto.name, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
  describe('cloneWorkout', () => {
    const workoutId = mockWorkout.id;
    it('It should return the result that the service returned.', async () => {
      mockWorkoutService.cloneWorkout.mockResolvedValue(mockWorkout);
      const result = await controller.clone(workoutId, mockUser);
      expect(mockWorkoutService.cloneWorkout).toHaveBeenCalledWith(
        workoutId,
        mockUser,
      );
      expect(result).toEqual(mockWorkout);
    });
    it('throws NotFoundException when workout not found', async () => {
      mockWorkoutService.cloneWorkout.mockRejectedValue(
        new NotFoundException(`Workout with ID ${workoutId} not found`),
      );
      await expect(controller.clone(workoutId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
