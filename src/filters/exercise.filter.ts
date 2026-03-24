import { SelectQueryBuilder, Repository } from 'typeorm';
import { AbstractService } from '../common/pageService/page.service';
import { Exercise } from 'src/modules/exercise/exercise.entity';
import { GetExerciseFilter } from 'src/modules/exercise/dto/musclegroup-filter.dto';

export class ExerciseFilter extends AbstractService<Exercise> {
  constructor(repository: Repository<Exercise>) {
    super(repository);
  }

  apply(
    qb: SelectQueryBuilder<Exercise>,
    filters: GetExerciseFilter,
    alias = 'exercise',
  ) {
    const { search, ...rest } = filters;
    this.applySearch(qb, alias, ['name'], search);
    this.applyFilters(qb, alias, rest);
    return qb;
  }
}
