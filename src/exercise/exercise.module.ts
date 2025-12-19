import { Module } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from './exercise.entity';
import { Workout } from 'src/workoutplan/workoutplan.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise, Workout]), AuthModule],
  providers: [ExerciseService],
  controllers: [ExerciseController],
})
export class ExerciseModule {}
