import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "../utils/apperror";

// validate middleware: Validates the request body against a provided Zod schema
export const validate =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result: any = await schema.parseAsync(req.body);
      
      req.body = result;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err: any) => err.message).join(", ");
         return next(new AppError(`Validation failed: ${errorMessages}`, 400));
      }
      next(error);
    }
  };