import { Module } from '@nestjs/common';
import { WorkoutplanController } from './workoutplan.controller';
import { WorkoutplanService } from './workoutplan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workout } from './workoutplan.entity';
import { Exercise } from '../exercise/exercise.entity';
import { AuthModule } from '../auth/auth.module';
import { LoggerModule } from 'src/common/helper/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workout, Exercise]),
    AuthModule,
    LoggerModule,
  ],
  controllers: [WorkoutplanController],
  providers: [WorkoutplanService],
})
export class WorkoutplanModule {}
