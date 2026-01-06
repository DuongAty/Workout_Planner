import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';

jest.mock('fs');

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
    jest.clearAllMocks();
  });

  describe('getFilePath', () => {
    it('The path should be standardized from backslash to forward slash.', () => {
      const mockFile = {
        path: 'uploads\\exercises\\image.jpg',
      } as Express.Multer.File;
      const result = service.getFilePath(mockFile);
      expect(result).toBe('uploads/exercises/image.jpg');
    });
  });

  describe('cleanupFile', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    const mockPath = 'uploads/test.jpg';
    it('You should delete the file if it exists.', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      service.cleanupFile(mockPath);
      expect(fs.existsSync).toHaveBeenCalledWith(`./${mockPath}`);
      expect(fs.unlinkSync).toHaveBeenCalledWith(`./${mockPath}`);
    });
    it('Do nothing if the path is empty or the file does not exist.', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      service.cleanupFile('');
      service.cleanupFile(null);
      service.cleanupFile('not-found.jpg');
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
    it('Throw InternalServerErrorException if unlinkSync fails.', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('Disk error');
      });
      expect(() => service.cleanupFile(mockPath)).toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('cloneFile', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
    const oldPath = 'uploads/original.jpg';
    it('File copying was successful and the new path was returned.', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.copyFileSync as jest.Mock).mockReturnValue(undefined);
      const result = service.cloneFile(oldPath);
      expect(result).toMatch(/^uploads\/original-clone-\d+\.jpg$/);
      expect(fs.copyFileSync).toHaveBeenCalled();
    });
    it('Returns null if the file does not exist.', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = service.cloneFile(oldPath);
      expect(result).toBeNull();
      expect(fs.copyFileSync).not.toHaveBeenCalled();
    });
    it('Throw InternalServerErrorException if copyFileSync fails.', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.copyFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });
      expect(() => service.cloneFile(oldPath)).toThrow(
        InternalServerErrorException,
      );
    });
  });
});
