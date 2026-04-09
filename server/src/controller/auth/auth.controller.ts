import { Request, Response, NextFunction } from "express";
import * as authService from "../../services/auth/auth.service";
import { AppError } from "../../utils/apperror";

// loginClient: Authenticates a client using phone number and password and returns a JWT
export const loginClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.loginClientService(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};

// loginAdmin: Special authentication for administrative staff using email and password
export const loginAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.loginAdminService(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};

// logout: Placeholder for session termination logic
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.logoutService();
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};

// getMe: Returns the identity of the currently authenticated user session
export const getMe = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    // req.user already has password stripped by auth middleware; expose only known-safe fields
    const { id, role, name, email, client_code, phone_number, business_name, owner_name, status } = req.user;
    res.status(200).json({
      message: "Current user fetched",
      user: { id, role, name, email, client_code, phone_number, business_name, owner_name, status },
    });
  } catch (error: any) {
    next(error);
  }
};