import { InjectRepository } from '@nestjs/typeorm';
import { StepOfExercise } from './step-of-exercise.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStepDto, UpdateStepDto } from './dto/create-step.dto';
import { MoreThan, Repository } from 'typeorm';
import { ExerciseService } from '../exercise.service';
import { User } from '../../user/user.entity';
import { SortDirection } from '../../body-measurement/body-measurement.enum';

@Injectable()
export class StepOfExerciseService {
  constructor(
    @InjectRepository(StepOfExercise)
    private readonly stepRepo: Repository<StepOfExercise>,
    private exerciseService: ExerciseService,
  ) {}

  async create(exerciseId: string, createStepDto: CreateStepDto, user: User) {
    const exercise = await this.exerciseService.findOneExercise(
      exerciseId,
      user,
    );
    if (exercise) {
      const step = this.stepRepo.create({
        ...createStepDto,
        exercise: { id: exerciseId },
        user,
      } as any);
      return await this.stepRepo.save(step);
    }
  }

  // async create(exerciseId: string, createStepDto: CreateStepDto, user: User) {
  //   const exercise = await this.exerciseService.findOneExercise(
  //     exerciseId,
  //     user,
  //   );
  //   if (exercise) {
  //     const lastStep = await this.stepRepo.findOne({
  //       where: { exercise: { id: exerciseId } },
  //       order: { order: 'DESC' },
  //     });
  //     const newOrder = lastStep ? lastStep.order + 1 : 1;
  //     const step = this.stepRepo.create({
  //       ...createStepDto,
  //       order: newOrder,
  //       exercise: { id: exerciseId },
  //       user,
  //     } as any);
  //     return await this.stepRepo.save(step);
  //   }
  // }

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

  async findOne(id: string) {
    try {
      return await this.stepRepo.findOneOrFail({ where: { id } });
    } catch (error) {
      throw new NotFoundException(`Step with ID ${id} not found`);
    }
  }

  async update(id: string, updateDto: UpdateStepDto) {
    const step = await this.findOne(id);
    if (step) {
      await this.stepRepo.update(id, updateDto);
    }
    return step;
  }

  async remove(id: string) {
    const stepToDelete = await this.stepRepo.findOne({
      where: { id },
      relations: ['exercise'],
    });

    if (!stepToDelete) {
      throw new NotFoundException(`Step with ID ${id} not found`);
    }
    const exerciseId = stepToDelete.exercise.id;
    const deletedOrder = stepToDelete.order;
    const result = await this.stepRepo.delete(id);
    if ((result.affected ?? 0) > 0) {
      const stepsToUpdate = await this.stepRepo.find({
        where: {
          exercise: { id: exerciseId },
          order: MoreThan(deletedOrder),
        },
      });
      for (const step of stepsToUpdate) {
        step.order -= 1;
      }
      if (stepsToUpdate.length > 0) {
        await this.stepRepo.save(stepsToUpdate);
      }
      return { deleted: true };
    }
    return { deleted: false };
  }
}
