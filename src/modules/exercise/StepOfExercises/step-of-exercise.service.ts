import { InjectRepository } from '@nestjs/typeorm';
import { StepOfExercise } from './step-of-exercise.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpsertStepDto } from './dto/create-step.dto';
import { Repository } from 'typeorm';
import { ExerciseService } from '../exercise.service';
import { User } from '../../user/user.entity';
import { SortDirection } from '../../body-measurement/body-measurement.enum';
import { AppLogger } from 'src/loggers/app-logger.service';

@Injectable()
export class StepOfExerciseService {
  constructor(
    @InjectRepository(StepOfExercise)
    private readonly stepRepo: Repository<StepOfExercise>,
    private exerciseService: ExerciseService,
    private logger: AppLogger,
  ) {
    this.logger.setContext(StepOfExerciseService.name);
  }

  async saveMany(exerciseId: string, stepsDto: UpsertStepDto[], user: User) {
    const exercise = await this.exerciseService.findOneExercise(
      exerciseId,
      user,
    );
    if (!exercise) throw new NotFoundException('Exercise not found');
    const stepsToSave = stepsDto.map((dto) => ({
      ...dto,
      exercise: { id: exerciseId },
      user: user,
    }));
    const savedSteps = await this.stepRepo.save(stepsToSave);
    const activeIds = savedSteps.map((s) => s.id);
    await this.stepRepo
      .createQueryBuilder()
      .delete()
      .where('exerciseId = :exerciseId AND id NOT IN (:...ids)', {
        exerciseId,
        ids: activeIds.length > 0 ? activeIds : ['none'],
      })
      .execute();
    this.logger.logData(
      `Saved steps for exercise`,
      exerciseId,
      StepOfExerciseService.name,
    );
    return savedSteps;
  }

  async findAllByExerciseId(user: User, exerciseId: string) {
    const exercise = await this.exerciseService.findOneExercise(
      exerciseId,
      user,
    );
    if (exercise) {
      return await this.stepRepo.find({
        where: { exercise: { id: exerciseId } },
        order: { order: SortDirection.ASC },
      });
    }
  }
}
