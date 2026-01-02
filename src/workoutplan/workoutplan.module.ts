import { Module } from '@nestjs/common';
import { WorkoutplanController } from './workoutplan.controller';
import { WorkoutplanService } from './workoutplan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workout } from './workoutplan.entity';
import { Exercise } from '../exercise/exercise.entity';
import { AuthModule } from '../auth/auth.module';
import { LoggerModule } from 'src/common/logger/logger.module';
import { UploadService } from 'src/common/upload/upload.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Workout, Exercise]),
    AuthModule,
    LoggerModule,
  ],
  controllers: [WorkoutplanController],
  providers: [WorkoutplanService, UploadService],
})
export class WorkoutplanModule {}
