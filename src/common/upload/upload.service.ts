import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  getFilePath(file: Express.Multer.File): string {
    return file.path.replace(/\\/g, '/');
  }

  cleanupFile(relativeOldPath: string): void {
    try {
      if (relativeOldPath && fs.existsSync(`./${relativeOldPath}`)) {
        fs.unlinkSync(`./${relativeOldPath}`);
      }
    } catch (error) {
      console.error('Error while deleting file:', error.message);
      throw new InternalServerErrorException(
        `Cannot delete file: ${relativeOldPath}`,
      );
    }
  }

  cloneFile(relativeOldPath: string): string | null {
    if (!relativeOldPath || !fs.existsSync(`./${relativeOldPath}`)) return null;
    try {
      const ext = path.extname(relativeOldPath);
      const fileName = path.basename(relativeOldPath, ext);
      const directory = path.dirname(relativeOldPath);
      const newRelativePath = path
        .join(directory, `${fileName}-clone-${Date.now()}${ext}`)
        .replace(/\\/g, '/');
      fs.copyFileSync(`./${relativeOldPath}`, `./${newRelativePath}`);
      return newRelativePath;
    } catch (error) {
      console.error('Error when cloning file:', error.message);
      throw new InternalServerErrorException(
        `Cannot copy file: ${relativeOldPath}`,
      );
    }
  }
}
