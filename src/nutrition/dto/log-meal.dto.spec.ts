import { validate } from 'class-validator';
import { LogMealDto } from './log-meal.dto';
import { plainToInstance } from 'class-transformer';

describe('LogMealDto', () => {
  it('should pass when meal is a valid non-empty string', async () => {
    const dto = new LogMealDto();
    dto.meal = 'Sáng nay tôi ăn phở bò và trứng';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when meal is an empty string', async () => {
    const dto = new LogMealDto();
    dto.meal = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('meal');
  });

  it('should fail when meal is null', async () => {
    const dto = new LogMealDto();
    dto.meal = null;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when meal is undefined', async () => {
    const dto = new LogMealDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when meal is a number', async () => {
    const dto = new LogMealDto();
    dto.meal = 12345;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when meal is an object', async () => {
    const dto = new LogMealDto();
    dto.meal = { text: 'ăn phở' };

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when meal is whitespace only (after transform)', async () => {
    const dto = plainToInstance(LogMealDto, {
      meal: '   ',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
