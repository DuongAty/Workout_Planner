import { Module } from '@nestjs/common';
import { WorkoutplanController } from './workoutplan.controller';
import { WorkoutplanService } from './workoutplan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workout } from './workoutplan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workout])],
  controllers: [WorkoutplanController],
  providers: [WorkoutplanService],
})
export class WorkoutplanModule {}
