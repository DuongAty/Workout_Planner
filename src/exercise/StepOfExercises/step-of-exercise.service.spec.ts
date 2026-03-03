import { Test, TestingModule } from '@nestjs/testing';
import { StepOfExerciseService } from './step-of-exercise.service';
import { Repository } from 'typeorm';
import { StepOfExercise } from './step-of-exercise.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExerciseService } from '../exercise.service';
import { SortDirection } from '../../body-measurement/body-measurement.enum';

describe('StepOfExerciseService', () => {
  let service: StepOfExerciseService;
  let repo: jest.Mocked<Repository<StepOfExercise>>;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockExerciseService = {};

  const mockUser = { id: 'user-1' } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StepOfExerciseService,
        {
          provide: getRepositoryToken(StepOfExercise),
          useValue: mockRepo,
        },
        {
          provide: ExerciseService,
          useValue: mockExerciseService,
        },
      ],
    }).compile();

    service = module.get(StepOfExerciseService);
    repo = module.get(getRepositoryToken(StepOfExercise));
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('should create and save a step', async () => {
      const dto = { content: 'Step 1', order: 1 };
      const exerciseId = 'ex-1';

      const createdStep = { id: 'step-1', ...dto };

      repo.create.mockReturnValue(createdStep as any);
      repo.save.mockResolvedValue(createdStep as any);

      const result = await service.create(exerciseId, dto as any, mockUser);

      expect(repo.create).toHaveBeenCalledWith({
        ...dto,
        exercise: { id: exerciseId },
        user: mockUser,
      });

      expect(repo.save).toHaveBeenCalledWith(createdStep);
      expect(result).toEqual(createdStep);
    });
  });

  describe('findAllByExercise()', () => {
    it('should return steps ordered by ASC', async () => {
      const steps = [
        { id: '1', order: 1 },
        { id: '2', order: 2 },
      ];

      repo.find.mockResolvedValue(steps as any);

      const result = await service.findAllByExercise('ex-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { exercise: { id: 'ex-1' } },
        order: { order: SortDirection.ASC },
      });

      expect(result).toEqual(steps);
    });
  });

  describe('update()', () => {
    it('should update and return updated step', async () => {
      const updateDto = { content: 'Updated step' };
      const updatedStep = { id: 'step-1', content: 'Updated step' };

      repo.update.mockResolvedValue({ affected: 1 } as any);
      repo.findOne.mockResolvedValue(updatedStep as any);

      const result = await service.update('step-1', updateDto as any);

      expect(repo.update).toHaveBeenCalledWith('step-1', updateDto);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'step-1' } });
      expect(result).toEqual(updatedStep);
    });

    it('should return null if step not found after update', async () => {
      repo.update.mockResolvedValue({ affected: 0 } as any);
      repo.findOne.mockResolvedValue(null);

      const result = await service.update('step-x', {} as any);

      expect(result).toBeNull();
    });
  });

  describe('remove()', () => {
    it('should return deleted true when affected > 0', async () => {
      repo.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.remove('step-1');

      expect(repo.delete).toHaveBeenCalledWith('step-1');
      expect(result).toEqual({ deleted: true });
    });

    it('should return deleted false when affected = 0', async () => {
      repo.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await service.remove('step-1');

      expect(result).toEqual({ deleted: false });
    });
  });
});
