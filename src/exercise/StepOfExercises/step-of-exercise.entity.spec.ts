import 'reflect-metadata';
import { StepOfExercise } from './step-of-exercise.entity';
import { Exercise } from '../exercise.entity';
import { getMetadataArgsStorage } from 'typeorm';

describe('StepOfExercise Entity', () => {
  it('should create entity instance correctly', () => {
    const entity = new StepOfExercise();

    entity.id = 'uuid';
    entity.order = 1;
    entity.description = 'Do 10 push-ups';
    entity.exercise = { id: 'exercise-1' } as Exercise;

    expect(entity).toBeDefined();
    expect(entity.order).toBe(1);
    expect(entity.description).toBe('Do 10 push-ups');
    expect(entity.exercise.id).toBe('exercise-1');
  });

  it('should have correct columns metadata', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (col) => col.target === StepOfExercise,
    );

    const columnNames = columns.map((col) => col.propertyName);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('order');
    expect(columnNames).toContain('description');
  });

  it('should have ManyToOne relation with Exercise', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      (rel) => rel.target === StepOfExercise,
    );

    const exerciseRelation = relations.find(
      (rel) => rel.propertyName === 'exercise',
    );

    expect(exerciseRelation).toBeDefined();
    expect(exerciseRelation!.relationType).toBe('many-to-one');
    expect(exerciseRelation!.type()).toBe(Exercise);
  });

  it('should have JoinColumn with name exerciseId', () => {
    const joinColumns = getMetadataArgsStorage().joinColumns.filter(
      (join) => join.target === StepOfExercise,
    );

    const exerciseJoin = joinColumns.find(
      (join) => join.propertyName === 'exercise',
    );

    expect(exerciseJoin).toBeDefined();
    expect(exerciseJoin!.name).toBe('exerciseId');
  });
});
