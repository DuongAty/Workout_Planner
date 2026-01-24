import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { StepOfExerciseService } from './step-of-exercise.service';
import { CreateStepDto, UpdateStepDto } from './dto/create-step.dto';
import { GetUser } from 'src/user/get-user.decorator';
import { User } from 'src/user/user.entity';

@Controller('steps-of-exercise')
export class StepOfExerciseController {
  constructor(private readonly stepService: StepOfExerciseService) {}

  @Post('/:exerciseId')
  async create(
    @Param('exerciseId') exerciseId: string,
    @Body() createStepDto: CreateStepDto,
    @GetUser() user: User,
  ) {
    return await this.stepService.create(exerciseId, createStepDto, user);
  }

  @Get('exercise/:exerciseId')
  async findAll(@Param('exerciseId') exerciseId: string) {
    return await this.stepService.findAllByExercise(exerciseId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateStepDto) {
    return await this.stepService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.stepService.remove(id);
  }
}
