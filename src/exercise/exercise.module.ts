import { Module, forwardRef } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from './exercise.entity';
import { Workout } from '../workoutplan/workoutplan.entity';
import { AuthModule } from '../auth/auth.module';
import { LoggerModule } from 'src/common/logger/logger.module';
import { WorkoutplanModule } from '../workoutplan/workoutplan.module';
import { WorkoutplanService } from '../workoutplan/workoutplan.service';

@Module({
  imports: [
    forwardRef(() => WorkoutplanModule),
    TypeOrmModule.forFeature([Exercise, Workout]),
    AuthModule,
    LoggerModule,
  ],
  providers: [ExerciseService, WorkoutplanService],
  controllers: [ExerciseController],
})
export class ExerciseModule {}
