import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import {
  IMAGE_MIMETYPE_REGEX,
  VIDEO_MIMETYPE_REGEX,
} from './file-upload.constants';

export const generateFileName = (originalname: string): string => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = extname(originalname);
  return `${uniqueSuffix}${ext}`;
};

export const storageConfig = (folder: string) =>
  diskStorage({
    destination: `./uploads/${folder}`,
    filename: (req, file, cb) => {
      const fileName = generateFileName(file.originalname);
      cb(null, fileName);
    },
  });

export const mediaFileFilter = (req, file, callback) => {
  if (
    !file.mimetype.match(IMAGE_MIMETYPE_REGEX) &&
    !file.mimetype.match(VIDEO_MIMETYPE_REGEX)
  ) {
    return callback(
      new BadRequestException('Only photo or video formats are allowed!'),
      false,
    );
  }
  callback(null, true);
};
