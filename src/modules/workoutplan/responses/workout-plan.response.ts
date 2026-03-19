import { Expose, Type } from 'class-transformer';

class ScheduleItemResponse {
  @Expose()
  date: string;

  @Expose()
  status: string;
}
export class CreateWorkoutPlanResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  numExercises: number;

  @Expose()
  startDate: string;

  @Expose()
  endDate: string;

  @Expose()
  recurrenceRule: string;

  @Expose()
  @Type(() => ScheduleItemResponse)
  scheduleItems: ScheduleItemResponse[];
}
