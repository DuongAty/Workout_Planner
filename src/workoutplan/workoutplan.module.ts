import { Module } from '@nestjs/common';
import { WorkoutplanController } from './workoutplan.controller';
import { WorkoutplanService } from './workoutplan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workout } from './workoutplan.entity';
import { Exercise } from '../exercise/exercise.entity';
import { AuthModule } from '../auth/auth.module';
import { LoggerModule } from '../common/logger/logger.module';
import { UploadService } from '../common/upload/upload.service';
import { TransactionService } from '../common/transaction/transaction';
import { BodyMeasurement } from '../body-measurement/body-measurement.entity';
import { BodyMeasurementController } from '../body-measurement/body-measurement.controller';
import { BodyMeasurementService } from '../body-measurement/body-measurement.service';
import { WorkoutReminderService } from '../common/emailSend/send-email.service';
import { WorkoutReminderTask } from '../scheduled-tasks/workout-reminder.task';
import OpenAI from 'openai';
import { OpenAIService } from '../openai/openai.service';
import { NutritionController } from '../nutrition/nutrition.controller';
import { NutritionService } from '../nutrition/nutrition.service';
import { NutritionLog } from '../nutrition/nutrition-log.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workout,
      Exercise,
      BodyMeasurement,
      NutritionLog,
      User,
    ]),
    AuthModule,
    LoggerModule,
  ],
  controllers: [
    WorkoutplanController,
    BodyMeasurementController,
    NutritionController,
  ],
  providers: [
    WorkoutplanService,
    UploadService,
    TransactionService,
    BodyMeasurementService,
    WorkoutReminderService,
    WorkoutReminderTask,
    OpenAIService,
    NutritionService,
  ],
})
export class WorkoutplanModule {}
