import { validate } from 'class-validator';
import { BodyMeasurement } from './body-measurement.entity';
import { MuscleGroup } from '../exercise/exercise-musclegroup';

describe('BodyMeasurement Entity', () => {
  const createValidEntity = (): BodyMeasurement => {
    const entity = new BodyMeasurement();
    entity.key = MuscleGroup.Chest;
    entity.value = 100;
    entity.unit = 'cm';
    entity.user = { id: 'user-1' } as any;
    return entity;
  };

  describe('Valid cases', () => {
    it('should pass validation with valid data', async () => {
      const entity = createValidEntity();
      const errors = await validate(entity);

      expect(errors.length).toBe(0);
    });

    it('should allow value = 10 (Min)', async () => {
      const entity = createValidEntity();
      entity.value = 10;

      const errors = await validate(entity);
      expect(errors.length).toBe(0);
    });

    it('should allow value = 200 (Max)', async () => {
      const entity = createValidEntity();
      entity.value = 200;

      const errors = await validate(entity);
      expect(errors.length).toBe(0);
    });
  });

  describe('Validation errors', () => {
    it('should fail when value < 10', async () => {
      const entity = createValidEntity();
      entity.value = 5;

      const errors = await validate(entity);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail when value > 200', async () => {
      const entity = createValidEntity();
      entity.value = 250;

      const errors = await validate(entity);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('max');
    });

    it('should fail when value is not a number', async () => {
      const entity = createValidEntity();
      entity.value = 'abc' as any;

      const errors = await validate(entity);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when key is not in MuscleGroup enum', async () => {
      const entity = createValidEntity();
      entity.key = 'INVALID_KEY' as any;

      const errors = await validate(entity);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Relations', () => {
    it('should allow assigning user relation', async () => {
      const entity = createValidEntity();
      entity.user = { id: 'user-123', email: 'test@test.com' } as any;

      const errors = await validate(entity);
      expect(errors.length).toBe(0);
    });
  });
});
