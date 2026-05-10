import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

function multerOptions() {
  const storage = multer.memoryStorage();
  const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new ApiError('Only Images allowed', 400));
    }
  };
  return multer({ storage, fileFilter });
}

export const uploadSingleImage = (fieldName: string) => multerOptions().single(fieldName);

export const uploadMixOfImages = (fields: multer.Field[]) => multerOptions().fields(fields);
