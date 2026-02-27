import { NutritionLog } from './nutrition-log.entity';
import { User } from '../user/user.entity';
import { instanceToPlain } from 'class-transformer';

describe('NutritionLog Entity', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@mail.com',
  } as User;

  it('should create NutritionLog with valid data', () => {
    const log = new NutritionLog();

    log.mealDescription = 'Chicken rice';
    log.calories = 600;
    log.protein = 40;
    log.carbs = 70;
    log.fat = 15;
    log.advice = 'Good protein intake';
    log.user = mockUser;
    log.userId = mockUser.id;
    log.createdAt = new Date();

    expect(log.mealDescription).toBe('Chicken rice');
    expect(log.calories).toBe(600);
    expect(log.protein).toBe(40);
    expect(log.carbs).toBe(70);
    expect(log.fat).toBe(15);
    expect(log.advice).toBe('Good protein intake');
    expect(log.user).toBe(mockUser);
    expect(log.userId).toBe('user-123');
    expect(log.createdAt).toBeInstanceOf(Date);
  });

  it('should allow advice to be null', () => {
    const log = new NutritionLog();

    log.mealDescription = 'Salad';
    log.calories = 300;
    log.protein = 10;
    log.carbs = 20;
    log.fat = 5;
    log.advice = null;

    expect(log.advice).toBeNull();
  });

  it('should exclude user when transformed to plain object', () => {
    const log = new NutritionLog();

    log.id = 'log-1';
    log.mealDescription = 'Steak';
    log.calories = 800;
    log.protein = 50;
    log.carbs = 0;
    log.fat = 40;
    log.user = mockUser;
    log.userId = mockUser.id;

    const plain = instanceToPlain(log);

    expect(plain.user).toBeUndefined();
    expect(plain.userId).toBe('user-123');
    expect(plain.mealDescription).toBe('Steak');
  });
});
