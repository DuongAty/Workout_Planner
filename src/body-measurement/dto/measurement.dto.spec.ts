import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateMeasurementDto,
  GetMeasurementsQueryDto,
  UnitType,
} from './measurement.dto';
import { MuscleGroup } from '../../exercise/exercise-musclegroup';

describe('Measurement DTO Validation', () => {
  describe('CreateMeasurementDto', () => {
    const validData = {
      key: MuscleGroup.Chest,
      value: 100,
      unit: UnitType.cm,
    };

    it('should pass when data is valid', async () => {
      const dto = plainToInstance(CreateMeasurementDto, validData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass when unit is omitted', async () => {
      const dto = plainToInstance(CreateMeasurementDto, {
        key: MuscleGroup.Chest,
        value: 80,
        unit: UnitType.cm,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail when key is missing', async () => {
      const dto = plainToInstance(CreateMeasurementDto, {
        value: 80,
        unit: UnitType.cm,
      });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'key')).toBe(true);
    });

    it('should fail when key is not in MuscleGroup enum', async () => {
      const dto = plainToInstance(CreateMeasurementDto, {
        ...validData,
        key: 'INVALID_KEY',
      });
      const errors = await validate(dto);
      const keyError = errors.find(e => e.property === 'key');
      expect(keyError).toBeDefined();
      expect(keyError?.constraints).toHaveProperty('isEnum');
    });

    it('should fail when value is missing', async () => {
      const dto = plainToInstance(CreateMeasurementDto, {
        key: MuscleGroup.Chest,
      });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'value')).toBe(true);
    });

    it('should fail when value is not a number', async () => {
      const dto = plainToInstance(CreateMeasurementDto, {
        ...validData,
        value: 'abc',
      });
      const errors = await validate(dto);
      const valueError = errors.find(e => e.property === 'value');
      expect(valueError).toBeDefined();
      expect(valueError?.constraints).toHaveProperty('isNumber');
    });

    it('should fail when unit is not in UnitType enum', async () => {
      const dto = plainToInstance(CreateMeasurementDto, {
        ...validData,
        unit: 'mm',
      });
      const errors = await validate(dto);
      const unitError = errors.find(e => e.property === 'unit');
      expect(unitError).toBeDefined();
      expect(unitError?.constraints).toHaveProperty('isEnum');
    });
  });

  describe('GetMeasurementsQueryDto', () => {
    it('should pass when no query params provided', async () => {
      const dto = plainToInstance(GetMeasurementsQueryDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass when only key is provided', async () => {
      const dto = plainToInstance(GetMeasurementsQueryDto, {
        key: MuscleGroup.Abs,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass when only startDate is provided', async () => {
      const dto = plainToInstance(GetMeasurementsQueryDto, {
        startDate: '2026-01-01',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass when full query is provided', async () => {
      const dto = plainToInstance(GetMeasurementsQueryDto, {
        key: MuscleGroup.Chest,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail when key is not in MuscleGroup enum', async () => {
      const dto = plainToInstance(GetMeasurementsQueryDto, {
        key: 'INVALID_KEY',
      });
      const errors = await validate(dto);
      const keyError = errors.find(e => e.property === 'key');
      expect(keyError).toBeDefined();
      expect(keyError?.constraints).toHaveProperty('isEnum');
    });
  });
});
