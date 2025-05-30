declare namespace Express {
  export interface Request {
    userId?: string;
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  }
}

// Extend the global Express namespace
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      file?: Express.Multer.File;
      files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
    }
  }
}

export {};