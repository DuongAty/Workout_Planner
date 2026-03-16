import { Test, TestingModule } from '@nestjs/testing';
import { StepOfExerciseController } from './step-of-exercise.controller';
import { StepOfExerciseService } from './step-of-exercise.service';

describe('StepOfExerciseController', () => {
  let controller: StepOfExerciseController;
  let service: jest.Mocked<StepOfExerciseService>;

  const mockService = {
    create: jest.fn(),
    findAllByExercise: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = { id: 'user-1' } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StepOfExerciseController],
      providers: [
        {
          provide: StepOfExerciseService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(StepOfExerciseController);
    service = module.get(StepOfExerciseService);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('should call service.create and return result', async () => {
      const dto = { content: 'Step 1', order: 1 };
      const exerciseId = 'ex-1';
      const resultMock = { id: 'step-1', ...dto };

      service.create.mockResolvedValue(resultMock as any);

      const result = await controller.create(exerciseId, dto as any, mockUser);

      expect(service.create).toHaveBeenCalledWith(exerciseId, dto, mockUser);
      expect(result).toEqual(resultMock);
    });
  });

  describe('findAll()', () => {
    it('should return steps by exerciseId', async () => {
      const steps = [
        { id: '1', order: 1 },
        { id: '2', order: 2 },
      ];

      service.findAllByExercise.mockResolvedValue(steps as any);

      const result = await controller.findAll('ex-1');

      expect(service.findAllByExercise).toHaveBeenCalledWith('ex-1');
      expect(result).toEqual(steps);
    });
  });

  describe('update()', () => {
    it('should update step and return updated result', async () => {
      const updateDto = { content: 'Updated step' };
      const updatedStep = { id: 'step-1', content: 'Updated step' };

      service.update.mockResolvedValue(updatedStep as any);

      const result = await controller.update('step-1', updateDto as any);

      expect(service.update).toHaveBeenCalledWith('step-1', updateDto);
      expect(result).toEqual(updatedStep);
    });
  });

  describe('remove()', () => {
    it('should remove step and return deleted status', async () => {
      service.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove('step-1');

      expect(service.remove).toHaveBeenCalledWith('step-1');
      expect(result).toEqual({ deleted: true });
    });
  });
});
