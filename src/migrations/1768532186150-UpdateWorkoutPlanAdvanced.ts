import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateWorkoutPlanAdvanced1768532186150 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('workouts', [
      new TableColumn({ name: 'startDate', type: 'date', isNullable: true }),
      new TableColumn({ name: 'endDate', type: 'date', isNullable: true }),
      new TableColumn({
        name: 'scheduledDate',
        type: 'date',
        isNullable: true,
      }),
      new TableColumn({
        name: 'daysOfWeek',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'status',
        type: 'varchar',
        default: "'planned'",
      }),
      new TableColumn({
        name: 'parentWorkoutId',
        type: 'uuid',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('workouts', [
      'startDate',
      'endDate',
      'scheduledDate',
      'daysOfWeek',
      'status',
      'parentWorkoutId',
    ]);
  }
}
