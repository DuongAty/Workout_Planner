import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StepOfExerciseService } from './step-of-exercise.service';
import { CreateStepDto, UpdateStepDto } from './dto/create-step.dto';
import { GetUser } from '../../user/get-user.decorator';
import { User } from '../../user/user.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@Controller('steps-of-exercise')
@ApiBearerAuth('accessToken')
@UseGuards(AuthGuard())
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
  async findAll(
    @GetUser() user: User,
    @Param('exerciseId') exerciseId: string,
  ) {
    return await this.stepService.findAllByExerciseId(user, exerciseId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateStepDto) {
    return await this.stepService.update(id, updateDto);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return await this.stepService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.stepService.remove(id);
  }
}
