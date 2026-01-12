import {
  BadRequestException,
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
import { AppLogger } from '../common/logger/app-logger.service';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { mediaFileFilter, storageConfig } from '../common/upload/file-upload';
import { UploadService } from '../common/upload/upload.service';
import {
  IMAGE_MIMETYPE_REGEX,
  VIDEO_MIMETYPE_REGEX,
} from '../common/upload/file-upload.constants';
import { WEThrottle } from 'src/common/decorators/throttle.decorator';

@Controller({ path: 'exercises', version: '1' })
@UseGuards(AuthGuard())
@ApiBearerAuth('accessToken')
export class ExerciseController {
  constructor(
    private readonly exerciseService: ExerciseService,
    private uploadService: UploadService,
    private logger: AppLogger,
  ) {}

  @Post(':id/upload')
  @WEThrottle()
  @ApiBearerAuth('accessToken')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileType: {
          type: 'string',
          enum: ['thumbnail', 'video'],
          description: 'Select the file type to upload',
        },
        file: { type: 'string', format: 'binary' },
      },
      required: ['file', 'fileType'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storageConfig('exercises'),
      fileFilter: mediaFileFilter,
    }),
  )
  async uploadMedia(
    @Param('id') id: string,
    @Body('fileType') fileType: 'thumbnail' | 'video',
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    if (!file) throw new BadRequestException('File cannot be empty');
    const isImage = file.mimetype.match(IMAGE_MIMETYPE_REGEX);
    const isVideo = file.mimetype.match(VIDEO_MIMETYPE_REGEX);
    if (fileType === 'thumbnail' && !isImage) {
      throw new BadRequestException(
        'Thumbnail must be an image format (jpg, jpeg, png, gif, webp...)',
      );
    }
    if (fileType === 'video' && !isVideo) {
      throw new BadRequestException(
        'Video must be in video format (mp4, mov, avi...)',
      );
    }
    const dbField: 'thumbnail' | 'videoUrl' =
      fileType === 'thumbnail' ? 'thumbnail' : 'videoUrl';
    const path = this.uploadService.getFilePath(file);
    const updatedExercise = await this.exerciseService.uploadMedia(
      id,
      user,
      path,
      dbField,
    );
    return {
      link: path,
      data: updatedExercise,
    };
  }

  @Post(':workoutId')
  @WEThrottle()
  async create(
    @Param('workoutId', ParseUUIDPipe) workoutId: string,
    @Body() createExerciseDto: CreateExerciseDto,
    @GetUser() user: User,
  ) {
    this.logger.verbose(
      `User "${user.username}" create an exercises `,
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
  @WEThrottle()
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
    return this.exerciseService.getAllExercies(
      getExerciseFilter,
      paginationDto,
      user,
    );
  }

  @Get('/:id')
  @WEThrottle()
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
  @WEThrottle()
  delete(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    this.logger.verbose(
      `User "${user.username}" delete an exercise`,
      id,
      ExerciseController.name,
    );
    return this.exerciseService.deleteExerciseById(id, user);
  }

  @Patch(':id')
  @WEThrottle()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
    @GetUser() user: User,
  ) {
    this.logger.verbose(
      `User "${user.username}" update an exercises `,
      updateExerciseDto,
      ExerciseController.name,
    );
    return this.exerciseService.updateExercise(id, updateExerciseDto, user);
  }
}
