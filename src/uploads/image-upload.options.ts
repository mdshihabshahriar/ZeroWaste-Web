import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
 

export const imageUploadOptions: MulterOptions = {
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      return cb(new BadRequestException('Only JPG, PNG or WEBP images are allowed'), false);
    }
    cb(null, true);
  },
};