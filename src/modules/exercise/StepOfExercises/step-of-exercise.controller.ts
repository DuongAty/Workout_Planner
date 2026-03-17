import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { StepOfExerciseService } from './step-of-exercise.service';
import { SaveStepsDto } from './dto/create-step.dto';
import { GetUser } from '../../user/get-user.decorator';
import { User } from '../../user/user.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AppLogger } from 'src/loggers/app-logger.service';

@Controller('steps-of-exercise')
@ApiBearerAuth('accessToken')
@UseGuards(AuthGuard())
export class StepOfExerciseController {
  constructor(
    private readonly stepService: StepOfExerciseService,
    private logger: AppLogger,
  ) {
    this.logger.setContext(StepOfExerciseController.name);
  }

  @Patch('exercise/:exerciseId/steps')
  async saveSteps(
    @Param('exerciseId') exerciseId: string,
    @Body() saveStepsDto: SaveStepsDto,
    @GetUser() user: User,
  ) {
    this.logger.logData(
      `User ${user.username} save steps with Id: `,
      exerciseId,
      StepOfExerciseController.name,
    );
    return await this.stepService.saveMany(
      exerciseId,
      saveStepsDto.steps,
      user,
    );
  }

  @Get('exercise/:exerciseId')
  async findAll(
    @GetUser() user: User,
    @Param('exerciseId') exerciseId: string,
  ) {
    return await this.stepService.findAllByExerciseId(user, exerciseId);
  }
}
