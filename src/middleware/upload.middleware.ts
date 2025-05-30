import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Define the file interface explicitly
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function with proper typing
const fileFilter = (
  req: Request, 
  file: MulterFile, 
  cb: FileFilterCallback
): void => {
  // Check if the file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Create multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

export default upload;