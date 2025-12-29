import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { Exercise } from './exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { GetExerciseFilter } from './dto/musclegroup-filter.dto';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AppLogger } from 'src/common/logger/app-logger.service';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  imageFileFilter,
  storageConfig,
  videoFileFilter,
} from 'src/common/upload/file-upload';
import { UploadService } from 'src/common/upload/upload.service';

@Controller({ path: 'exercises', version: '1' })
@UseGuards(AuthGuard())
@ApiBearerAuth('accessToken')
export class ExerciseController {
  constructor(
    private readonly exerciseService: ExerciseService,
    private uploadService: UploadService,
    private logger: AppLogger,
  ) {}

  @Post(':id/upload-thumbnail')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storageConfig('exercises'),
      fileFilter: imageFileFilter,
    }),
  )
  async uploadThumbnail(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    const path = this.uploadService.getFilePath(file);
    const updated = await this.exerciseService.uploadMedia(
      id,
      user,
      path,
      'thumbnail',
    );
    return { link: path, data: updated };
  }

  @Post(':id/upload-video')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storageConfig('exercises'),
      fileFilter: videoFileFilter,
    }),
  )
  async uploadVideo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    const path = this.uploadService.getFilePath(file);
    const updated = await this.exerciseService.uploadMedia(
      id,
      user,
      path,
      'videoUrl',
    );
    return { link: path, data: updated };
  }

  @Post(':workoutId')
  async create(
    @Param('workoutId', ParseUUIDPipe) workoutId: string,
    @Body() createExerciseDto: CreateExerciseDto,
    @GetUser() user: User,
  ) {
    this.logger.verbose(
      `User "${user.username}" get all workout `,
      createExerciseDto,
      ExerciseController.name,
    );
    return this.exerciseService.createExercise(
      workoutId,
      createExerciseDto,
      user,
    );
  }

  @Get()
  getAll(
    @Query() getExerciseFilter: GetExerciseFilter,
    @Query() paginationDto: PaginationDto,
    @GetUser() user: User,
  ): Promise<{ data: Exercise[]; totalPages: number }> {
    this.logger.verbose(
      `User "${user.username}" get all exercise`,
      getExerciseFilter,
      ExerciseController.name,
    );
    this.logger.verbose(
      `User "${user.username}" get all workout `,
      getExerciseFilter,
      ExerciseController.name,
    );
    return this.exerciseService.getAllExercies(
      getExerciseFilter,
      paginationDto,
      user,
    );
  }

  @Get('/:id')
  getOne(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<Exercise | null> {
    this.logger.verbose(
      `User "${user.username}" get an exercise with id`,
      id,
      ExerciseController.name,
    );
    return this.exerciseService.findOneExercise(id, user);
  }

  @Delete('/:id')
  delete(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    this.logger.verbose(
      `User "${user.username}" delete an exercise`,
      id,
      ExerciseController.name,
    );
    return this.exerciseService.deleteExerciseById(id, user);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
    @GetUser() user: User,
  ) {
    this.logger.verbose(
      `User "${user.username}" get all workout `,
      updateExerciseDto,
      ExerciseController.name,
    );
    return this.exerciseService.updateExercise(id, updateExerciseDto, user);
  }
}
