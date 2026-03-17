import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JobService } from './job.service';
import { OpenAIProcessor } from 'src/processors/openai.processor';
import { WorkoutplanService } from 'src/modules/workoutplan/workoutplan.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { NutritionService } from 'src/modules/nutrition/nutrition.service';
import { User } from 'src/modules/user/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workout } from 'src/modules/workoutplan/workoutplan.entity';
import { Exercise } from 'src/modules/exercise/exercise.entity';
import { UploadService } from 'src/upload/upload.service';
import { TransactionService } from 'src/transaction/transaction';
import { OpenAIService } from 'src/modules/openai/openai.service';
import { ScheduleItem } from 'src/modules/workoutplan/schedule-items/schedule-item.entity';
import { AnalyticsService } from 'src/common/service/analytics.service';
import { NutritionLog } from 'src/modules/nutrition/nutrition-log.entity';
import { AppLogger } from 'src/loggers/app-logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Workout, Exercise, ScheduleItem, NutritionLog]),
    BullModule.registerQueue(
      {
        name: 'email',
      },
      { name: 'openai' },
    ),
  ],
  providers: [
    JobService,
    OpenAIProcessor,
    WorkoutplanService,
    NotificationService,
    NutritionService,
    UploadService,
    TransactionService,
    OpenAIService,
    AnalyticsService,
    AppLogger,
  ],
  exports: [JobService],
})
export class JobsModule {}
