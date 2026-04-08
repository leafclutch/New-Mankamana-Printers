import { Request, Response, NextFunction } from "express";
import prisma from "../../connect";
import { AppError } from "../../utils/apperror";


// getProfile: Retrieves the detailed profile information for the currently logged-in client
export const getProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.user.id }
    });

    if (!client) throw new AppError("Profile not found", 404);

    res.status(200).json({
      message: "Profile fetched",
      data: client
    });
  } catch (error: any) {
    next(error);
  }
};

// updateProfile: Allows a client to update their business information (names, email, address)
export const updateProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { business_name, owner_name, email, address } = req.body;

    const updated = await prisma.client.update({
      where: { id: req.user.id },
      data: {
        business_name,
        owner_name,
        email,
        address
      }
    });

    res.status(200).json({
      message: "Profile updated successfully",
      data: updated
    });
  } catch (error: any) {
    next(error);
  }
};
