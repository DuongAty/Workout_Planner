import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseController } from './exercise.controller';
import { ExerciseService } from './exercise.service';
import { MuscleGroup } from './exercise-musclegroup';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppLogger } from '../common/logger/app-logger.service';
import { UploadService } from '../common/upload/upload.service';

const mockUser = { id: 'id', username: 'duong', password: '123' };
const mockFile = {
  fieldname: 'file',
  originalname: 'test.jpg',
  mimetype: 'image/jpeg',
  path: 'uploads/exercises/test.jpg',
  buffer: Buffer.from(''),
  size: 1024,
} as Express.Multer.File;

const mockUpdatedExercise = {
  id: 'exercise-id',
  thumbnail: 'uploads/exercises/test.jpg',
  videoUrl: null,
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
const mockExerciseService = {
  createExercise: jest.fn(),
  getAllExercies: jest.fn().mockResolvedValue('value'),
  findOneExercise: jest.fn().mockResolvedValue(''),
  deleteExerciseById: jest.fn(),
  updateExercise: jest.fn(),
  uploadMedia: jest.fn(),
};
const mockUploadService = {
  getFilePath: jest.fn(),
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
        UploadService,
        {
          provide: ExerciseService,
          useValue: mockExerciseService,
        },
        {
          provide: 'Logger',
          useValue: { verbose: jest.fn() },
        },
      ],
    }).compile();
    controller = module.get<ExerciseController>(ExerciseController);
  });

  describe('uploadMedia', () => {
    const exerciseId = 'test-id';

    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('The thumbnail upload should be successful if the file is valid.', async () => {
      const path = 'uploads/exercises/test.jpg';
      mockUploadService.getFilePath.mockReturnValue(path);
      mockExerciseService.uploadMedia.mockResolvedValue(mockUpdatedExercise);
      const result = await controller.uploadMedia(
        exerciseId,
        'thumbnail',
        { ...mockFile, mimetype: 'image/jpeg' },
        mockUser,
      );
      expect(mockExerciseService.uploadMedia).toHaveBeenCalledWith(
        exerciseId,
        mockUser,
        path,
        'thumbnail',
      );
      expect(result.link).toBe(path);
      expect(result.data).toEqual(mockUpdatedExercise);
    });
    it('video upload should be successful.', async () => {
      const videoPath = 'uploads/exercises/test.mp4';
      const mockVideoFile = {
        ...mockFile,
        path: videoPath,
        mimetype: 'video/mp4',
      };
      mockUploadService.getFilePath.mockReturnValue(videoPath);
      await controller.uploadMedia(
        exerciseId,
        'video',
        mockVideoFile,
        mockUser,
      );
      expect(mockExerciseService.uploadMedia).toHaveBeenCalledWith(
        exerciseId,
        mockUser,
        videoPath,
        'videoUrl',
      );
    });
    it('It should throw a BadRequestException if the file is missing.', async () => {
      await expect(
        controller.uploadMedia(exerciseId, 'thumbnail', null, mockUser),
      ).rejects.toThrow(new BadRequestException('File cannot be empty'));
    });

    it('It should throw an error if the fileType is thumbnail but sending a video.', async () => {
      const videoFile = { ...mockFile, mimetype: 'video/mp4' };

      await expect(
        controller.uploadMedia(exerciseId, 'thumbnail', videoFile, mockUser),
      ).rejects.toThrow(
        new BadRequestException(
          'Thumbnail must be an image format (jpg, jpeg, png, gif, webp...)',
        ),
      );
    });
    it('It should throw an error if the file type is video but you send an image.', async () => {
      const imageFile = { ...mockFile, mimetype: 'image/png' };

      await expect(
        controller.uploadMedia(exerciseId, 'video', imageFile, mockUser),
      ).rejects.toThrow(
        new BadRequestException(
          'Video must be in video format (mp4, mov, avi...)',
        ),
      );
    });
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
      mockExerciseService.createExercise.mockResolvedValue(exersiceCreated);
      const result = await controller.create(
        workoutID,
        createExerciseDto,
        mockUser,
      );
      expect(mockExerciseService.createExercise).toHaveBeenCalledWith(
        workoutID,
        createExerciseDto,
        mockUser,
      );
      expect(result).toEqual(exersiceCreated);
    });
    it('It should return the result that the service returned', async () => {
      mockExerciseService.createExercise.mockResolvedValue(
        mockExerciseService,
        mockUser,
      );
      await controller.create(workoutID, createExerciseDto, mockUser);
      expect(mockExerciseService.createExercise).toHaveBeenCalledWith(
        workoutID,
        createExerciseDto,
        mockUser,
      );
    });
    it('should throw error if service fails', async () => {
      jest.clearAllMocks();
      const mockError = new NotFoundException('Workout not found');
      mockExerciseService.createExercise.mockRejectedValue(mockError);
      await expect(
        controller.create(workoutID, createExerciseDto, mockUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockExerciseService.createExercise).toHaveBeenCalledTimes(1);
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
      mockExerciseService.getAllExercies.mockResolvedValue(
        mockExerciseService,
        mockUser,
      );
      await controller.getAll(mockFilter, mockPagination, mockUser);
      expect(mockExerciseService.getAllExercies).toHaveBeenCalledWith(
        mockFilter,
        mockPagination,
        mockUser,
      );
      expect(mockExerciseService.getAllExercies).toHaveBeenCalledTimes(1);
    });
    it('It should return the result that the service returned.', async () => {
      mockExerciseService.getAllExercies.mockResolvedValue(mockExersise);
      const result = await controller.getAll(
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
      mockExerciseService.findOneExercise.mockResolvedValue(mockExersise);
      const result = await controller.getOne(exerciseId, mockUser);
      expect(mockExerciseService.findOneExercise).toHaveBeenCalledWith(
        exerciseId,
        mockUser,
      );
      expect(result).toEqual(mockExersise);
    });
    it('throws NotFoundException when Exercise not found', async () => {
      mockExerciseService.findOneExercise.mockRejectedValue(
        new NotFoundException(`Exercise with ID ${exerciseId} not found`),
      );
      await expect(controller.getOne(exerciseId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteExercise', () => {
    const exerciseId = mockExersise.id;
    it('It should return the result that the service returned.', async () => {
      mockExerciseService.deleteExerciseById.mockResolvedValue(mockExersise);
      const result = await controller.delete(exerciseId, mockUser);
      expect(mockExerciseService.deleteExerciseById).toHaveBeenCalledWith(
        exerciseId,
        mockUser,
      );
      expect(result).toEqual(mockExersise);
    });
    it('throws NotFoundException when exercise not found', async () => {
      mockExerciseService.deleteExerciseById.mockRejectedValue(
        new NotFoundException(`Workout with ID ${exerciseId} not found`),
      );
      await expect(controller.delete(exerciseId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
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
      mockExerciseService.updateExercise.mockResolvedValue(mockResult);
      const result = await controller.update(exerciseId, updateDto, mockUser);
      expect(mockExerciseService.updateExercise).toHaveBeenCalledWith(
        exerciseId,
        updateDto,
        mockUser,
      );
      expect(result).toEqual(mockResult);
    });
    it('throws NotFoundException when exercise not found', async () => {
      mockExerciseService.updateExercise.mockRejectedValue(
        new NotFoundException(`Exercise with ID ${exerciseId} not found`),
      );
      await expect(
        controller.update(exerciseId, updateDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
