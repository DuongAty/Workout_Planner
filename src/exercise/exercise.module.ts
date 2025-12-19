import { Module } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from './exercise.entity';
import { Workout } from 'src/workoutplan/workoutplan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise, Workout])],
  providers: [ExerciseService],
  controllers: [ExerciseController],
})
export class ExerciseModule {}
