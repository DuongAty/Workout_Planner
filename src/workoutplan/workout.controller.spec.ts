import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutplanController } from './workoutplan.controller';
import { WorkoutplanService } from './workoutplan.service';
import { PassportModule } from '@nestjs/passport';
import { NotFoundException } from '@nestjs/common';
import { AppLogger } from '../common/logger/app-logger.service';

// Mock Data
const mockUser = { id: 'id', username: 'duong', password: '123' };
const mockWorkout = { id: 'id', name: 'Ngực', user: mockUser };

const mockWorkoutService = {
  createRecurringWorkout: jest.fn(),
  getAllWorkout: jest.fn(),
  findOneWorkout: jest.fn(),
  deleteWorkoutById: jest.fn(),
  updateWorkout: jest.fn(),
  cloneWorkout: jest.fn(),
};

describe('WorkoutplanController', () => {
  let controller: WorkoutplanController;

  beforeEach(async () => {
    jest.clearAllMocks(); // Reset mocks trước mỗi test để tránh conflict

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

  describe('createWorkout', () => {
    const mockCreateWorkoutDto = { name: 'Ngực' };

    it('should call service.createWorkout with the correct DTO and User', async () => {
      mockWorkoutService.createRecurringWorkout.mockResolvedValue(mockWorkout);

      await controller.create(mockCreateWorkoutDto, mockUser);

      expect(mockWorkoutService.createRecurringWorkout).toHaveBeenCalledTimes(
        1,
      );
      expect(mockWorkoutService.createRecurringWorkout).toHaveBeenCalledWith(
        mockCreateWorkoutDto,
        mockUser,
      );
    });

    it('should return the result that the service returned', async () => {
      mockWorkoutService.createRecurringWorkout.mockResolvedValue(mockWorkout);

      const result = await controller.create(mockCreateWorkoutDto, mockUser);

      expect(result).toEqual(mockWorkout);
    });
  });

  describe('getAllWorkout', () => {
    const mockFilter = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([['data'], 1]),
    } as any;

    const mockPagination = { page: 1, limit: 10 };
    const mockResult = { data: [mockWorkout], total: 1 }; // Giả lập kết quả trả về chuẩn

    it('should call workoutService.getAllWorkout with the correct parameters', async () => {
      mockWorkoutService.getAllWorkout.mockResolvedValue(mockResult);

      await controller.getAll(mockFilter, mockPagination, mockUser);

      expect(mockWorkoutService.getAllWorkout).toHaveBeenCalledTimes(1);
      expect(mockWorkoutService.getAllWorkout).toHaveBeenCalledWith(
        mockFilter,
        mockPagination,
        mockUser,
      );
    });

    it('should return the result that the service returned', async () => {
      mockWorkoutService.getAllWorkout.mockResolvedValue(mockResult);
      const result = await controller.getAll(
        mockFilter,
        mockPagination,
        mockUser,
      );

      expect(result).toEqual(mockResult);
    });
  });

  describe('findOneWorkout', () => {
    const workoutId = mockWorkout.id;

    it('should return the result that the service returned', async () => {
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

    it('should return the result that the service returned', async () => {
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
      ...mockWorkout,
      name: mockUpdateWorkoutDto.name,
    };

    it('should return the result that the service returned', async () => {
      mockWorkoutService.updateWorkout.mockResolvedValue(mockUpdatedWorkout);

      // Gọi controller với DTO object
      const result = await controller.update(
        workoutId,
        mockUpdateWorkoutDto,
        mockUser,
      );

      // Kiểm tra service nhận vào name string (vì logic service thường tách name ra)
      expect(mockWorkoutService.updateWorkout).toHaveBeenCalledWith(
        workoutId,
        mockUser,
        expect.objectContaining({
          name: mockUpdateWorkoutDto.name,
        }),
      );
      expect(result).toEqual(mockUpdatedWorkout);
    });

    it('throws NotFoundException when workout not found', async () => {
      mockWorkoutService.updateWorkout.mockRejectedValue(
        new NotFoundException(`Workout with ID ${workoutId} not found`),
      );

      await expect(
        controller.update(workoutId, mockUpdateWorkoutDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cloneWorkout', () => {
    const workoutId = mockWorkout.id;

    it('should return the result that the service returned', async () => {
      mockWorkoutService.cloneWorkout.mockResolvedValue(mockWorkout);

      const result = await controller.clone(workoutId, mockUser);

      expect(mockWorkoutService.cloneWorkout).toHaveBeenCalledWith(
        workoutId,
        mockUser,
        undefined,
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
