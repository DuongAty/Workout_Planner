import { validate } from 'class-validator';
import { CreateStepDto, UpdateStepDto } from './create-step.dto';

describe('CreateStepDto validation', () => {
  it('should pass with valid data', async () => {
    const dto = new CreateStepDto();
    dto.order = 1;
    dto.description = 'Step description';
    dto.exerciseId = 'exercise-uuid';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when description length > 100', async () => {
    const dto = new CreateStepDto();
    dto.order = 1;
    dto.description = 'a'.repeat(101);
    dto.exerciseId = 'exercise-uuid';

    const errors = await validate(dto);

    // ⚠️ This SHOULD fail but WILL NOT because @Max is wrong for string
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should not report error when exerciseId is missing (no decorator)', async () => {
    const dto = new CreateStepDto();
    dto.order = 1;
    dto.description = 'Valid description';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should not report error when order is string (no decorator)', async () => {
    const dto = new CreateStepDto();
    dto.order = '1' as any;
    dto.description = 'Valid description';
    dto.exerciseId = 'exercise-uuid';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

describe('UpdateStepDto validation', () => {
  it('should pass with valid data', async () => {
    const dto = new UpdateStepDto();
    dto.order = 2;
    dto.description = 'Updated step';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when description length > 100', async () => {
    const dto = new UpdateStepDto();
    dto.order = 2;
    dto.description = 'a'.repeat(101);

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
