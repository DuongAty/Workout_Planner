import { Test, TestingModule } from '@nestjs/testing';
import { BodyMeasurementController } from './body-measurement.controller';
import { BodyMeasurementService } from './body-measurement.service';
import {
  CreateMeasurementDto,
  GetMeasurementsQueryDto,
} from './dto/measurement.dto';
import { MuscleGroup } from '../exercise/exercise-musclegroup';

describe('BodyMeasurementController', () => {
  let controller: BodyMeasurementController;
  let service: BodyMeasurementService;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
  };

  const mockBodyMeasurementService = {
    create: jest.fn(),
    findAllForChart: jest.fn(),
    getProgress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BodyMeasurementController],
      providers: [
        {
          provide: BodyMeasurementService,
          useValue: mockBodyMeasurementService,
        },
      ],
    }).compile();

    controller = module.get<BodyMeasurementController>(
      BodyMeasurementController,
    );
    service = module.get<BodyMeasurementService>(BodyMeasurementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('should call service.create with user and dto', async () => {
      const dto: CreateMeasurementDto = {
        key: MuscleGroup.Chest,
        value: 100,
        measuredAt: new Date(),
      };

      const result = { id: 'measurement-1', ...dto };
      mockBodyMeasurementService.create.mockResolvedValue(result);

      const response = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith(mockUser, dto);
      expect(response).toEqual(result);
    });
  });

  describe('getChartData()', () => {
    it('should call service.findAllForChart with user and query', async () => {
      const query: GetMeasurementsQueryDto = {
        key: MuscleGroup.Chest,
        from: '2026-01-01',
        to: '2026-01-31',
      };

      const result = [
        { date: '2026-01-01', value: 90 },
        { date: '2026-01-10', value: 95 },
      ];

      mockBodyMeasurementService.findAllForChart.mockResolvedValue(result);

      const response = await controller.getChartData(mockUser, query);

      expect(service.findAllForChart).toHaveBeenCalledWith(mockUser, query);
      expect(response).toEqual(result);
    });
  });

  describe('getProgress()', () => {
    it('should call service.getProgress with user and muscle group key', async () => {
      const key = MuscleGroup.Chest;
      const result = {
        start: 90,
        current: 100,
        progress: 10,
      };

      mockBodyMeasurementService.getProgress.mockResolvedValue(result);

      const response = await controller.getProgress(mockUser, key);

      expect(service.getProgress).toHaveBeenCalledWith(mockUser, key);
      expect(response).toEqual(result);
    });
  });
});
