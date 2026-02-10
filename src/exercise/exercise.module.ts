import { Module, forwardRef } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from './exercise.entity';
import { Workout } from '../workoutplan/workoutplan.entity';
import { AuthModule } from '../auth/auth.module';
import { LoggerModule } from '../common/logger/logger.module';
import { WorkoutplanModule } from '../workoutplan/workoutplan.module';
import { WorkoutplanService } from '../workoutplan/workoutplan.service';
import { UploadService } from '../common/upload/upload.service';
import { ExerciseSet } from './exersiceTracking/exerciseSet.entity';
import { ExerciseTrackingService } from './exersiceTracking/exersciseTracking.service';
import { ExerciseTrackingController } from './exersiceTracking/exerciseTracking.controller';
import { TransactionService } from '../common/transaction/transaction';
import { StepOfExerciseService } from './StepOfExercises/step-of-exercise.service';
import { StepOfExerciseController } from './StepOfExercises/step-of-exercise.controller';
import { StepOfExercise } from './StepOfExercises/step-of-exercise.entity';
import { OpenAIService } from '../openai/openai.service';

@Module({
  imports: [
    forwardRef(() => WorkoutplanModule),
    TypeOrmModule.forFeature([Exercise, Workout, ExerciseSet, StepOfExercise]),
    AuthModule,
    LoggerModule,
  ],
  providers: [
    ExerciseService,
    WorkoutplanService,
    UploadService,
    ExerciseTrackingService,
    TransactionService,
    StepOfExerciseService,
    OpenAIService,
  ],
  controllers: [
    ExerciseController,
    ExerciseTrackingController,
    StepOfExerciseController,
  ],
})
export class ExerciseModule {}
