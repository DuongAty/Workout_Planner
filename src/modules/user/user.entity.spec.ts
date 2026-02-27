import { User } from './user.entity';
import { getMetadataArgsStorage } from 'typeorm';

describe('User Entity', () => {
  it('columns and relationships should exist and be defined', () => {
    const metadata = getMetadataArgsStorage();

    const table = metadata.tables.find((t) => t.target === User);
    expect(table.name).toBe('users');

    const columns = metadata.columns.filter((c) => c.target === User);
    const usernameCol = columns.find((c) => c.propertyName === 'username');
    expect(usernameCol.options.unique).toBe(true);

    const passwordCol = columns.find((c) => c.propertyName === 'password');
    expect(passwordCol).toBeDefined();

    const primaryColumn = metadata.generations.find((g) => g.target === User);
    expect(primaryColumn.propertyName).toBe('id');
    expect(primaryColumn.strategy).toBe('uuid');

    const relations = metadata.relations.filter((r) => r.target === User);
    const workoutRelation = relations.find((r) => r.propertyName === 'workout');
    expect(workoutRelation.relationType).toBe('one-to-many');
    expect(workoutRelation.options.eager).toBe(true);

    const exerciseRelation = relations.find(
      (r) => r.propertyName === 'exercise',
    );
    expect(exerciseRelation.relationType).toBe('one-to-many');
    expect(exerciseRelation.options.eager).toBe(true);
  });
});
