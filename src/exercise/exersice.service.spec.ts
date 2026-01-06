import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseService } from './exercise.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Exercise } from './exercise.entity';
import { MuscleGroup } from './exercise-musclegroup';
import { WorkoutplanService } from '../workoutplan/workoutplan.service';
import { Workout } from '../workoutplan/workoutplan.entity';
import { NotFoundException } from '@nestjs/common';
import { AppLogger } from '../common/logger/app-logger.service';
import { UploadService } from '../common/upload/upload.service';

const mockUser = { id: 'id', username: 'duong', password: '123' };
const mockExerciseService = {
  create: jest.fn(),
  save: jest.fn(),
  findOneOrFail: jest.fn().mockResolvedValue(''),
  delete: jest.fn(),
  remove: jest.fn(),
  uploadMedia: jest.fn(),
};
const mockExersise = {
  id: 'id',
  name: 'Dumbbell Bench Press',
  muscleGroup: MuscleGroup.Chest,
  numberOfSets: 4,
  repetitions: 10,
  duration: 500,
  restTime: 90,
  note: 'Focus on slow negative',
};
describe('ExerciseService', () => {
  let exerciseService: ExerciseService;
  let findOneExerciseSpy: jest.SpyInstance;
  let workoutPlanService: WorkoutplanService;
  let uploadService: UploadService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [
        ExerciseService,
        AppLogger,
        WorkoutplanService,
        UploadService,
        {
          provide: getRepositoryToken(Exercise),
          useValue: mockExerciseService,
        },
        {
          provide: getRepositoryToken(Workout),
          useValue: {},
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
            cleanupFile: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();
    exerciseService = module.get<ExerciseService>(ExerciseService);
    workoutPlanService = module.get<WorkoutplanService>(WorkoutplanService);
    findOneExerciseSpy = jest.spyOn(exerciseService, 'findOneExercise');
    uploadService = module.get<UploadService>(UploadService);
  });

  describe('uploadMedia', () => {
    const exerciseId = 'ex-123';
    const mockPath = 'uploads/exercises/new-file.jpg';
    const mockOldPath = 'uploads/exercises/old-file.jpg';

    const mockExercise = {
      id: exerciseId,
      name: 'Push Up',
      thumbnail: null,
      videoUrl: null,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('You should upload a thumbnail the first time (without any old files).', async () => {
      const findOneSpy = jest
        .spyOn(exerciseService, 'findOneExercise')
        .mockResolvedValue(mockExercise as any);
      mockExerciseService.save.mockResolvedValue({
        ...mockExercise,
        thumbnail: mockPath,
      });
      const result = await exerciseService.uploadMedia(
        exerciseId,
        mockUser,
        mockPath,
        'thumbnail',
      );
      expect(uploadService.cleanupFile).not.toHaveBeenCalled();
      expect(mockExerciseService.save).toHaveBeenCalledWith(
        expect.objectContaining({
          thumbnail: mockPath,
        }),
      );
      expect(result.thumbnail).toBe(mockPath);
    });
    it('You should delete the old thumbnail when uploading a new one (overwrite it)', async () => {
      const exerciseWithThumb = { ...mockExercise, thumbnail: mockOldPath };
      jest
        .spyOn(exerciseService, 'findOneExercise')
        .mockResolvedValue(exerciseWithThumb as any);
      mockExerciseService.save.mockImplementation((ent) =>
        Promise.resolve(ent),
      );
      await exerciseService.uploadMedia(
        exerciseId,
        mockUser,
        mockPath,
        'thumbnail',
      );
      expect(uploadService.cleanupFile).toHaveBeenCalledWith(mockOldPath);
      expect(mockExerciseService.save).toHaveBeenCalledWith(
        expect.objectContaining({
          thumbnail: mockPath,
        }),
      );
    });

    it('You should delete the old video URL when uploading a new video.', async () => {
      const exerciseWithVideo = { ...mockExercise, videoUrl: mockOldPath };
      jest
        .spyOn(exerciseService, 'findOneExercise')
        .mockResolvedValue(exerciseWithVideo as any);
      mockExerciseService.save.mockImplementation((ent) =>
        Promise.resolve(ent),
      );

      await exerciseService.uploadMedia(
        exerciseId,
        mockUser,
        mockPath,
        'videoUrl',
      );
      expect(uploadService.cleanupFile).toHaveBeenCalledWith(mockOldPath);
      expect(mockExerciseService.save).toHaveBeenCalledWith(
        expect.objectContaining({
          videoUrl: mockPath,
        }),
      );
    });
    it('throws NotFoundException when Exercise not found.', async () => {
      jest
        .spyOn(exerciseService, 'findOneExercise')
        .mockRejectedValue(new NotFoundException());
      await expect(
        exerciseService.uploadMedia(
          exerciseId,
          mockUser,
          mockPath,
          'thumbnail',
        ),
      ).rejects.toThrow(NotFoundException);
      expect(mockExerciseService.save).not.toHaveBeenCalled();
      expect(uploadService.cleanupFile).not.toHaveBeenCalled();
    });
  });

  describe('createExercise', () => {
    const workoutId = 'workout-123';
    const createExerciseDto = {
      name: 'Dumbbell Bench Press',
      muscleGroup: MuscleGroup.Chest,
      sets: 4,
      reps: 10,
      druration: 500,
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
      workoutPlanService.findOneWorkout.mockResolvedValue(mockFoundWorkout);
      mockExerciseService.create.mockReturnValue(createdExerciseEntity);
      mockExerciseService.save.mockResolvedValue(createdExerciseEntity);
      workoutPlanService.syncNumExercises = jest.fn().mockResolvedValue(true);
      const result = await exerciseService.createExercise(
        workoutId,
        createExerciseDto as any,
        mockUser,
      );
      expect(mockExerciseService.save).toHaveBeenCalledWith(
        createdExerciseEntity,
      );
      expect(workoutPlanService.syncNumExercises).toHaveBeenCalledWith(
        workoutId,
      );
      expect(result).toEqual(createdExerciseEntity);
    });
    it('should throw NotFoundException if findOneWorkout fails', async () => {
      workoutPlanService.findOneWorkout.mockRejectedValueOnce(
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
      const filterDto = { search: '', muscleGroup: undefined, duration: 500 };
      const paginationDto = { page: 1, limit: 10 };
      const filter = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([['data'], 1]),
      };
      mockExerciseService.createQueryBuilder = jest
        .fn()
        .mockReturnValue(filter);
      const result = await exerciseService.getAllExercies(
        filterDto,
        paginationDto,
        mockUser,
      );
      expect(result).toEqual({
        data: ['data'],
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('findOneExercise', () => {
    it('should return exercise when found', async () => {
      const exerciseId = 'exercise-123';
      const mockExercise = {
        id: exerciseId,
        name: 'Push up',
        duration: 300,
        user: mockUser,
      } as Exercise;

      mockExerciseService.findOneOrFail.mockResolvedValue(mockExercise);

      const result = await exerciseService.findOneExercise(
        exerciseId,
        mockUser,
      );

      expect(mockExerciseService.findOneOrFail).toHaveBeenCalledWith({
        where: { id: exerciseId, user: mockUser },
      });
      expect(result).toEqual(mockExercise);
    });

    it('should throw NotFoundException when exercise not found', async () => {
      const exerciseId = 'non-existent-id';
      const error = new Error('Could not find any entity');
      error.name = 'EntityNotFoundError';

      mockExerciseService.findOneOrFail.mockRejectedValue(error);

      await expect(
        exerciseService.findOneExercise(exerciseId, mockUser),
      ).rejects.toThrow(NotFoundException);

      await expect(
        exerciseService.findOneExercise(exerciseId, mockUser),
      ).rejects.toThrow(`Exercise with ID ${exerciseId} not found`);

      expect(mockExerciseService.findOneOrFail).toHaveBeenCalledWith({
        where: { id: exerciseId, user: mockUser },
      });
    });

    it('should throw NotFoundException when exercise belongs to different user', async () => {
      const exerciseId = 'exercise-123';
      const error = new Error('Could not find any entity');
      error.name = 'EntityNotFoundError';

      mockExerciseService.findOneOrFail.mockRejectedValue(error);

      await expect(
        exerciseService.findOneExercise(exerciseId, mockUser),
      ).rejects.toThrow(NotFoundException);

      expect(mockExerciseService.findOneOrFail).toHaveBeenCalledWith({
        where: { id: exerciseId, user: mockUser },
      });
    });

    it('should handle database errors properly', async () => {
      const exerciseId = 'exercise-123';
      const dbError = new Error('Database connection failed');

      mockExerciseService.findOneOrFail.mockRejectedValue(dbError);

      await expect(
        exerciseService.findOneExercise(exerciseId, mockUser),
      ).rejects.toThrow(NotFoundException);

      await expect(
        exerciseService.findOneExercise(exerciseId, mockUser),
      ).rejects.toThrow(`Exercise with ID ${exerciseId} not found`);
    });
  });

  describe('deleteExerciseById', () => {
    const id = 'test-ex-id';
    const mockExercise = {
      id,
      workoutId: 'workout-123',
      thumbnail: 'thumb.jpg',
      videoUrl: 'video.mp4',
    };
    it('Therefore, deleting exercises and cleaning up files was successful.', async () => {
      const findOneSpy = jest
        .spyOn(exerciseService, 'findOneExercise')
        .mockResolvedValue(mockExercise as any);
      mockExerciseService.remove.mockResolvedValue(mockExercise);
      await exerciseService.deleteExerciseById(id, mockUser);
      expect(findOneSpy).toHaveBeenCalledWith(id, mockUser);
      expect(uploadService.cleanupFile).toHaveBeenCalledWith('thumb.jpg');
      expect(uploadService.cleanupFile).toHaveBeenCalledWith('video.mp4');
      expect(mockExerciseService.remove).toHaveBeenCalledWith(mockExercise);
      expect(workoutPlanService.syncNumExercises).toHaveBeenCalledWith(
        'workout-123',
      );
    });
    it('You should throw a NotFoundException if the assignment is not found.', async () => {
      jest
        .spyOn(exerciseService, 'findOneExercise')
        .mockRejectedValue(
          new NotFoundException(`Exercise with ID "${id}" not found`),
        );
      await expect(
        exerciseService.deleteExerciseById(id, mockUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockExerciseService.remove).not.toHaveBeenCalled();
      expect(workoutPlanService.syncNumExercises).not.toHaveBeenCalled();
    });
  });

  describe('updateExercise', () => {
    const newName = 'Incline Bench Press';
    const newRestTime = 75;
    const updateDto = {
      name: newName,
      restTime: newRestTime,
    };
    const mockExerciseId = 'test-id';
    const mockExistingExercise = {
      id: mockExerciseId,
      name: 'Old Name',
      restTime: 60,
      note: 'Old note',
    };
    const expectedResult = {
      ...mockExistingExercise,
      name: newName,
      restTime: newRestTime,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('Should successfully update partial fields and call save', async () => {
      findOneExerciseSpy.mockResolvedValue(mockExistingExercise);
      mockExerciseService.save.mockResolvedValue(expectedResult);

      const result = await exerciseService.updateExercise(
        mockExerciseId,
        updateDto,
        mockUser,
      );
      expect(findOneExerciseSpy).toHaveBeenCalledWith(mockExerciseId, mockUser);
      expect(mockExerciseService.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockExerciseId,
          name: newName,
          restTime: newRestTime,
        }),
      );
      expect(result).toEqual(expectedResult);
    });

    it('throws NotFoundException when Exercise not found', async () => {
      mockExerciseService.findOneOrFail.mockRejectedValue(
        new Error('Entity not found'),
      );
      await expect(
        exerciseService.updateExercise(mockExerciseId, updateDto, mockUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockExerciseService.save).not.toHaveBeenCalled();
    });
  });
});
