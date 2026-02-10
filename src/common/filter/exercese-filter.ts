import { GetExerciseFilter } from '../exercise/dto/musclegroup-filter.dto';
import { SelectQueryBuilder } from 'typeorm';

export const applyExerciseFilters = (
  query: SelectQueryBuilder<any>,
  filters: GetExerciseFilter,
  alias: string = 'exercises',
) => {
  const { search, muscleGroup, duration } = filters;

  if (muscleGroup) {
    query.andWhere(`${alias}.muscleGroup = :muscleGroup`, { muscleGroup });
  }
  if (duration) {
    query.andWhere(`${alias}.duration = :duration`, { duration });
  }
  if (search) {
    query.andWhere(`${alias}.name ILIKE :search`, { search: `%${search}%` });
  }

  return query;
};
