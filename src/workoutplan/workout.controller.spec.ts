import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutplanController } from './workoutplan.controller';
import { WorkoutplanService } from './workoutplan.service';
import { PassportModule } from '@nestjs/passport';
import { NotFoundException } from '@nestjs/common';
import { AppLogger } from '../common/helper/app-logger.service';

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
  let service: WorkoutplanService;
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
    service = module.get<WorkoutplanService>(WorkoutplanService);
  });

  describe('createWWork', () => {
    const mockCreateWorkoutDto = { name: 'Ngực' };
    it('You should call service.createWorkout with the correct DTO and User.', async () => {
      service.createWorkout.mockResolvedValue(mockWorkoutService, mockUser);
      await controller.createWorkout(mockCreateWorkoutDto, mockUser);

      expect(service.createWorkout).toHaveBeenCalledTimes(1);
      expect(service.createWorkout).toHaveBeenCalledWith(
        mockCreateWorkoutDto,
        mockUser,
      );
    });
    it('It should return the result that the service returned.', async () => {
      service.createWorkout.mockResolvedValue(mockWorkoutService);
      const result = await controller.createWorkout(
        mockCreateWorkoutDto,
        mockUser,
      );
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
      service.getAllWorkout.mockResolvedValue(mockWorkoutService, mockUser);
      await controller.getWorkout(mockFilter, mockPagination, mockUser);
      expect(service.getAllWorkout).toHaveBeenCalledWith(
        mockFilter,
        mockPagination,
        mockUser,
      );
      expect(service.getAllWorkout).toHaveBeenCalledTimes(1);
    });
    it('It should return the result that the service returned.', async () => {
      service.getAllWorkout.mockResolvedValue(mockWorkout);
      const result = await controller.getWorkout(
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
      service.findOneWorkout.mockResolvedValue(mockWorkout);
      const result = await controller.getWorkoutbyId(workoutId, mockUser);
      expect(service.findOneWorkout).toHaveBeenCalledWith(workoutId, mockUser);
      expect(result).toEqual(mockWorkout);
    });
    it('throws NotFoundException when workout not found', async () => {
      service.findOneWorkout.mockRejectedValue(
        new NotFoundException(`Workout with ID ${workoutId} not found`),
      );
      await expect(
        controller.getWorkoutbyId(workoutId, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteWorkout', () => {
    const workoutId = mockWorkout.id;
    it('It should return the result that the service returned.', async () => {
      service.deleteWorkoutById.mockResolvedValue(mockWorkout);
      const result = await controller.deleteWorkoutByid(workoutId, mockUser);
      expect(service.deleteWorkoutById).toHaveBeenCalledWith(
        workoutId,
        mockUser,
      );
      expect(result).toEqual(mockWorkout);
    });
    it('throws NotFoundException when workout not found', async () => {
      service.deleteWorkoutById.mockRejectedValue(
        new NotFoundException(`Workout with ID ${workoutId} not found`),
      );
      await expect(
        controller.deleteWorkoutByid(workoutId, mockUser),
      ).rejects.toThrow(NotFoundException);
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
      service.updateNameWorkout.mockResolvedValue(mockUpdatedWorkout);
      const result = await controller.updateNameWorkout(
        workoutId,
        mockUpdateWorkoutDto,
        mockUser,
      );
      expect(service.updateNameWorkout).toHaveBeenCalledWith(
        workoutId,
        mockUpdateWorkoutDto.name,
        mockUser,
      );
      expect(result).toEqual(mockUpdatedWorkout);
    });
    it('throws NotFoundException when workout not found', async () => {
      service.updateNameWorkout.mockRejectedValue(
        new NotFoundException(`Workout with ID ${workoutId} not found`),
      );
      await expect(
        controller.updateNameWorkout(
          workoutId,
          mockUpdateWorkoutDto.name,
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
  describe('cloneWorkout', () => {
    const workoutId = mockWorkout.id;
    it('It should return the result that the service returned.', async () => {
      service.cloneWorkout.mockResolvedValue(mockWorkout);
      const result = await controller.cloneWorkout(workoutId, mockUser);
      expect(service.cloneWorkout).toHaveBeenCalledWith(workoutId, mockUser);
      expect(result).toEqual(mockWorkout);
    });
    it('throws NotFoundException when workout not found', async () => {
      service.cloneWorkout.mockRejectedValue(
        new NotFoundException(`Workout with ID ${workoutId} not found`),
      );
      await expect(
        controller.cloneWorkout(workoutId, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
