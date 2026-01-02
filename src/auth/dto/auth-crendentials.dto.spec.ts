import { validate } from 'class-validator';
import { AuthCredentialsDto } from './auth-credentials.dto';

describe('AuthCredentialsDto', () => {
  let dto: AuthCredentialsDto;
  beforeEach(() => {
    dto = new AuthCredentialsDto();
  });

  it('The check should pass (valid) when the data is valid.', async () => {
    dto.username = 'testuser123';
    dto.password = 'password123';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe('username validation', () => {
    it('It will fail if the username is shorter than 8 characters.', async () => {
      dto.username = 'short';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0].property).toBe('username');
    });

    it('It will fail if the username is longer than 20 characters.', async () => {
      dto.username = 'a'.repeat(21);
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('password validation', () => {
    it('It will fail if the password is empty or not a string.', async () => {
      dto.password = 12345678;
      dto.username = 'testuser';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it('It will fail if the password is too short.', async () => {
      dto.username = 'testuser';
      dto.password = '123';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });
  });
});
