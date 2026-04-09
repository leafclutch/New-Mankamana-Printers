import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../connect";
import { AppError } from "../utils/apperror";

// Protect middleware: Verifies the JWT token from the authorization header and attaches the user to the request
export const protect = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("You are not logged in. Please login to get access.", 401));
    }

    // 1. Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    // 2. Check if user still exists (could be Admin or Client)
    let currentUser = null;

    if (decoded.role === "CLIENT") {
      currentUser = await prisma.client.findUnique({
        where: { id: decoded.id },
      });
    } else {
      currentUser = await prisma.adminUser.findUnique({
        where: { id: decoded.id },
      });
    }

    if (!currentUser) {
      return next(new AppError("The user belonging to this token no longer exists.", 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE — strip password before attaching to request
    const { password: _pw, ...safeUser } = currentUser as any;
    req.user = { ...safeUser, role: decoded.role };
    next();
  } catch (error: any) {
    next(new AppError("Invalid token or session expired", 401));
  }
};

// restrictTo middleware: Restricts access to specified roles (e.g., 'ADMIN')
export const restrictTo = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};
