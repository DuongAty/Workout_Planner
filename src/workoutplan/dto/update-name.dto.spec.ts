import { validate } from 'class-validator';
import { UpdateNameWorkoutDto } from './update-name-dto';
describe('CreateWorkoutDto', () => {
  const validDto = {
    name: 'Bài tập Ngực',
  };

  it('Validation should be passed when the data is valid.', async () => {
    const dto = new UpdateNameWorkoutDto();
    dto.name = validDto.name;

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });
  it('The authentication process will fail if the "name" field is left blank.', async () => {
    const dto = new UpdateNameWorkoutDto();
    dto.name = '';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
    const nameError = errors.find((e) => e.property === 'name');
    expect(nameError?.constraints).toHaveProperty('isNotEmpty');
  });
});
