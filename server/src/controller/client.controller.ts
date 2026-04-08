import { Request, Response, NextFunction } from "express";
import * as authService from "../services/client.service";
import { AppError } from "../utils/apperror";
import * as userService from "../services/client.service";


export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.loginUserService(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.logoutUserService();
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.getCurrentUserService(req);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};


export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const result = await userService.getUserProfileService(userId);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const result = await userService.updateUserProfileService(userId, req.body);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};


export const getTemplateCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.getTemplateCategoriesService();
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};

export const getTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await authService.getTemplatesService(page, limit);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};

export const getTemplateById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { template_id } = req.params;
    const result = await authService.getTemplateByIdService(template_id as string);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};

export const getTemplatesByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.params;
    const result = await authService.getTemplatesByCategoryService(category as string);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};


export const submitDesign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { fileUrl } = req.body;
    
    if (!fileUrl) throw new AppError("File URL is required", 400);

    const result = await authService.submitDesignService(userId, fileUrl);
    res.status(201).json(result);
  } catch (error: any) {
    next(error);
  }
};

export const getMyDesignSubmissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const result = await authService.getMyDesignSubmissionsService(userId);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};

export const getApprovedDesignById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { design_id } = req.params;
    const result = await authService.getApprovedDesignByIdService(userId, design_id as string);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};

export const verifyDesignId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { designCode } = req.body;
    if (!designCode) throw new AppError("Design code is required for validation", 400);
    
    const result = await authService.verifyDesignIdService(designCode);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};
