import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from './workoutplan.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { PaginationDto } from 'src/untils/pagination.dto';

@Injectable()
export class WorkoutplanService {
  private logger = new Logger();
  constructor(
    @InjectRepository(Workout)
    private workoutPlanService: Repository<Workout>,
  ) {}
  async createTask(createWorkoutDto: CreateWorkoutDto): Promise<Workout> {
    const { name } = createWorkoutDto;
    const workout = this.workoutPlanService.create({
      name,
    });
    return await this.workoutPlanService.save(workout);
  }
  async getAllWorkout(
    paginationDto: PaginationDto,
  ): Promise<{ data: Workout[]; total: number; totalPages: number }> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;
    const query = this.workoutPlanService.createQueryBuilder('workout');
    query.skip(skip).take(limit);
    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return { data, total, totalPages };
  }
  async findOne(id: string): Promise<Workout> {
    const workout = await this.workoutPlanService.findOne({
      where: { id },
    });
    if (!workout) {
      throw new NotFoundException(`Workout with ID "${id}" not found`);
    }
    return workout;
  }
  async deleteWorkoutById(id: string): Promise<void> {
    const result = await this.workoutPlanService.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException(`Task with id: ${id} not found`);
    }
  }

  async updateNameWorkout(id: string, name: string): Promise<Workout> {
    const workout = await this.workoutPlanService.findOne({ where: { id } });
    if (!workout) {
      throw new NotFoundException(`Task with id: ${id} not found`);
    }
    workout.name = name;
    await this.workoutPlanService.save(workout);
    return workout;
  }
}
