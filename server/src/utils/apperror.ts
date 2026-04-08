// AppError: Custom error class to streamline operational error handling with HTTP status codes
export class AppError extends Error {
    public statusCode: number;
    public status: string;
  
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
      Error.captureStackTrace(this, this.constructor);
    }
  }
  