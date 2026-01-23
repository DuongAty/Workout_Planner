import { InjectRepository } from '@nestjs/typeorm';
import { StepOfExercise } from './step-of-exercise.entity';
import { Injectable } from '@nestjs/common';
import { CreateStepDto, UpdateStepDto } from './dto/create-step.dto';
import { Repository } from 'typeorm';
import { ExerciseService } from '../exercise.service';
import { User } from 'src/user/user.entity';
import { SortDirection } from 'src/body-measurement/body-measurement.enum';

@Injectable()
export class StepOfExerciseService {
  constructor(
    @InjectRepository(StepOfExercise)
    private readonly stepRepo: Repository<StepOfExercise>,
    private exerciseService: ExerciseService,
  ) {}

  async create(exerciseId: string, createStepDto: CreateStepDto, user: User) {
    const step = this.stepRepo.create({
      ...createStepDto,
      exercise: { id: exerciseId },
      user,
    } as any);
    return await this.stepRepo.save(step);
  }

  async findAllByExercise(exerciseId: string) {
    return await this.stepRepo.find({
      where: { exercise: { id: exerciseId } },
      order: { order: SortDirection.ASC },
    });
  }

  async update(id: string, updateDto: UpdateStepDto) {
    await this.stepRepo.update(id, updateDto);
    return await this.stepRepo.findOne({ where: { id } });
  }

  async remove(id: string) {
    const result = await this.stepRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
