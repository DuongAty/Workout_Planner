import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseService } from './exercise.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Exercise } from './exercise.entity';
import { MuscleGroup } from './exercise-musclegroup';
import { WorkoutplanService } from '../workoutplan/workoutplan.service';
import { Workout } from '../workoutplan/workoutplan.entity';
import { NotFoundException } from '@nestjs/common';
import { UploadService } from '../common/upload/upload.service';
import { TransactionService } from '../common/transaction/transaction';

const mockUser: any = { id: 'user-uuid', username: 'duong' };

const createMockQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getQuery: jest.fn().mockReturnValue('SELECT query'),

  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
});

// Mock cho Manager bên trong Transaction
const mockManager = {
  create: jest
    .fn()
    .mockImplementation((entity, data) => ({ id: 'new-id', ...data })),
  save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
  softRemove: jest.fn().mockImplementation((data) => Promise.resolve(data)),
};

describe('ExerciseService', () => {
  let exerciseService: ExerciseService;
  let workoutPlanService: WorkoutplanService;
  let uploadService: UploadService;
  let exerciseRepo: any;

  const mockExerciseRepo = {
    findOneOrFail: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciseService,
        {
          provide: getRepositoryToken(Exercise),
          useValue: mockExerciseRepo,
        },
        {
          provide: WorkoutplanService,
          useValue: {
            findOneWorkout: jest.fn(),
            syncNumExercises: jest.fn(),
          },
        },
        {
          provide: UploadService,
          useValue: {
            cleanupFile: jest.fn(),
          },
        },
        {
          provide: TransactionService,
          useValue: {
            // Quan trọng: Giả lập run() thực thi callback với mockManager
            run: jest.fn((cb) => cb(mockManager)),
          },
        },
      ],
    }).compile();

    exerciseService = module.get<ExerciseService>(ExerciseService);
    workoutPlanService = module.get<WorkoutplanService>(WorkoutplanService);
    uploadService = module.get<UploadService>(UploadService);
    exerciseRepo = module.get(getRepositoryToken(Exercise));

    jest.clearAllMocks();
  });

  describe('createExercise', () => {
    const workoutId = 'workout-123';
    const dto: any = { name: 'Push Up', muscleGroup: MuscleGroup.Chest };

    it('nên tạo exercise thành công và đồng bộ số lượng bài tập', async () => {
      const mockWorkout = { id: workoutId };
      workoutPlanService.findOneWorkout = jest
        .fn()
        .mockResolvedValue(mockWorkout);

      const result = await exerciseService.createExercise(
        workoutId,
        dto,
        mockUser,
      );

      expect(workoutPlanService.findOneWorkout).toHaveBeenCalledWith(
        workoutId,
        mockUser,
      );
      expect(mockManager.create).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalled();
      expect(workoutPlanService.syncNumExercises).toHaveBeenCalledWith(
        workoutId,
        mockManager,
      );
      expect(result.name).toBe(dto.name);
    });
  });

  describe('uploadMedia', () => {
    it('nên dọn dẹp file cũ nếu đã tồn tại thumbnail', async () => {
      const mockExercise = { id: '1', thumbnail: 'old-path.jpg' };
      jest
        .spyOn(exerciseService, 'findOneExercise')
        .mockResolvedValue(mockExercise as any);
      exerciseRepo.save.mockResolvedValue({
        ...mockExercise,
        thumbnail: 'new-path.jpg',
      });

      await exerciseService.uploadMedia(
        '1',
        mockUser,
        'new-path.jpg',
        'thumbnail',
      );

      expect(uploadService.cleanupFile).toHaveBeenCalledWith('old-path.jpg');
      expect(exerciseRepo.save).toHaveBeenCalled();
    });
  });

  describe('getAllExercies', () => {
    it('nên trả về dữ liệu phân trang', async () => {
      const mockFilter = { search: 'Push' };
      const mockPagination = { page: 1, limit: 10 };

      const result = await exerciseService.getAllExercies(
        mockFilter as any,
        mockPagination as any,
        mockUser,
      );

      expect(exerciseRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('totalPages');
    });
  });

  describe('deleteExerciseById', () => {
    it('nên thực hiện softRemove và dọn dẹp tài nguyên media', async () => {
      const mockExercise = {
        id: '1',
        workoutId: 'w-1',
        thumbnail: 'thumb.jpg',
        videoUrl: 'video.mp4',
      };
      jest
        .spyOn(exerciseService, 'findOneExercise')
        .mockResolvedValue(mockExercise as any);

      await exerciseService.deleteExerciseById('1', mockUser);

      expect(mockManager.softRemove).toHaveBeenCalledWith(mockExercise);
      expect(uploadService.cleanupFile).toHaveBeenCalledTimes(2);
      expect(workoutPlanService.syncNumExercises).toHaveBeenCalledWith(
        'w-1',
        mockManager,
      );
    });
  });

  describe('updateExercise', () => {
    it('nên cập nhật các trường được thay đổi', async () => {
      const mockExercise = { id: '1', name: 'Old Name' };
      const dto = { name: 'New Name' };
      jest
        .spyOn(exerciseService, 'findOneExercise')
        .mockResolvedValue(mockExercise as any);

      await exerciseService.updateExercise('1', dto, mockUser);

      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
        }),
      );
    });
  });

  describe('findOneExercise', () => {
    it('nên ném lỗi NotFoundException nếu không tìm thấy', async () => {
      exerciseRepo.findOneOrFail.mockRejectedValue(new Error());

      await expect(
        exerciseService.findOneExercise('1', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
