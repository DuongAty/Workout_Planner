import { Module } from '@nestjs/common';
import { WorkoutplanController } from './workoutplan.controller';
import { WorkoutplanService } from './workoutplan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workout } from './workoutplan.entity';
import { Exercise } from 'src/exercise/exercise.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workout, Exercise])],
  controllers: [WorkoutplanController],
  providers: [WorkoutplanService],
})
export class WorkoutplanModule {}
