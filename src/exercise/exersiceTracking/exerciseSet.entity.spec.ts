import 'reflect-metadata';
import { ExerciseSet } from './exerciseSet.entity';
import { Exercise } from '../exercise.entity';
import { getMetadataArgsStorage } from 'typeorm';

describe('ExerciseSet Entity', () => {
  it('should be defined', () => {
    const entity = new ExerciseSet();
    expect(entity).toBeDefined();
  });

  describe('Columns', () => {
    it('should have weight column as float', () => {
      const column = getMetadataArgsStorage().columns.find(
        c => c.target === ExerciseSet && c.propertyName === 'weight',
      );
      expect(column).toBeDefined();
      expect(column!.options.type).toBe('float');
    });

    it('should have reps column as int', () => {
      const column = getMetadataArgsStorage().columns.find(
        c => c.target === ExerciseSet && c.propertyName === 'reps',
      );
      expect(column!.options.type).toBe('int');
    });

    it('should allow rpe to be nullable', () => {
      const column = getMetadataArgsStorage().columns.find(
        c => c.target === ExerciseSet && c.propertyName === 'rpe',
      );
      expect(column!.options.nullable).toBe(true);
    });

    it('should have exerciseId column', () => {
      const column = getMetadataArgsStorage().columns.find(
        c => c.target === ExerciseSet && c.propertyName === 'exerciseId',
      );
      expect(column).toBeDefined();
    });
  });

  describe('Relations', () => {
    it('should have ManyToOne relation with Exercise', () => {
      const relation = getMetadataArgsStorage().relations.find(
        r => r.target === ExerciseSet && r.propertyName === 'exercise',
      );

      expect(relation).toBeDefined();
      expect(relation!.relationType).toBe('many-to-one');
      const relationType =
        typeof relation!.type === 'function'
          ? relation!.type()
          : relation!.type;

      expect(relationType).toBe(Exercise);
      expect(relation!.options.onDelete).toBe('CASCADE');
    });
  });

  describe('Instantiation', () => {
    it('should create entity with values', () => {
      const set = Object.assign(new ExerciseSet(), {
        weight: 100,
        reps: 10,
        rpe: 8,
        exerciseId: 'exercise-uuid',
      });

      expect(set.weight).toBe(100);
      expect(set.reps).toBe(10);
      expect(set.rpe).toBe(8);
      expect(set.exerciseId).toBe('exercise-uuid');
    });

    it('should allow rpe to be undefined', () => {
      const set = Object.assign(new ExerciseSet(), {
        weight: 80,
        reps: 12,
      });

      expect(set.rpe).toBeUndefined();
    });
  });
});
