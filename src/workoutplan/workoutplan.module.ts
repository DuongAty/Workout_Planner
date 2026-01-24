import { Module } from '@nestjs/common';
import { WorkoutplanController } from './workoutplan.controller';
import { WorkoutplanService } from './workoutplan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workout } from './workoutplan.entity';
import { Exercise } from '../exercise/exercise.entity';
import { AuthModule } from '../auth/auth.module';
import { LoggerModule } from '../common/logger/logger.module';
import { UploadService } from '../common/upload/upload.service';
import { TransactionService } from 'src/common/transaction/transaction';
import { BodyMeasurement } from 'src/body-measurement/body-measurement.entity';
import { BodyMeasurementController } from 'src/body-measurement/body-measurement.controller';
import { BodyMeasurementService } from 'src/body-measurement/body-measurement.service';
import { WorkoutReminderService } from 'src/common/emailSend/send-email.service';
import { WorkoutReminderTask } from 'src/scheduled-tasks/workout-reminder.task';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workout, Exercise, BodyMeasurement]),
    AuthModule,
    LoggerModule,
  ],
  controllers: [WorkoutplanController, BodyMeasurementController],
  providers: [
    WorkoutplanService,
    UploadService,
    TransactionService,
    BodyMeasurementService,
    WorkoutReminderService,
    WorkoutReminderTask,
  ],
})
export class WorkoutplanModule {}
