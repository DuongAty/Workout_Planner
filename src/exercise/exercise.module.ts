import { Module } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from './exercise.entity';
import { Workout } from '../workoutplan/workoutplan.entity';
import { AuthModule } from '../auth/auth.module';
import { LoggerModule } from 'src/common/helper/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exercise, Workout]),
    AuthModule,
    LoggerModule,
  ],
  providers: [ExerciseService],
  controllers: [ExerciseController],
})
export class ExerciseModule {}
