import { Request, Response, NextFunction } from "express";
import prisma from "../../connect";
import { AppError } from "../../utils/apperror";
import { normalizePanVatNoForStorage } from "../../utils/pan-vat";


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

// updateProfile: Allows a client to update their business information (names, email, address, tax id)
export const updateProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { business_name, owner_name, email, address, pan_vat_no, pan_vat_type } = req.body;
    const hasPanVatNo = Object.prototype.hasOwnProperty.call(req.body, "pan_vat_no");
    const hasPanVatType = Object.prototype.hasOwnProperty.call(req.body, "pan_vat_type");

    let nextPanVatNo: string | null | undefined = undefined;
    if (hasPanVatNo || hasPanVatType) {
      const currentClient = await prisma.client.findUnique({
        where: { id: req.user.id },
        select: { pan_vat_no: true },
      });
      if (!currentClient) throw new AppError("Profile not found", 404);
      nextPanVatNo = normalizePanVatNoForStorage(
        hasPanVatNo ? pan_vat_no : currentClient.pan_vat_no,
        hasPanVatType ? pan_vat_type : undefined
      );
      if (!nextPanVatNo) throw new AppError("PAN/VAT number is required", 400);
    }

    const data: Record<string, unknown> = {};
    if (business_name !== undefined) data.business_name = business_name;
    if (owner_name !== undefined) data.owner_name = owner_name;
    if (email !== undefined) data.email = email;
    if (address !== undefined) data.address = address;
    if (nextPanVatNo !== undefined) data.pan_vat_no = nextPanVatNo;

    const updated = await prisma.client.update({
      where: { id: req.user.id },
      data,
    });

    res.status(200).json({
      message: "Profile updated successfully",
      data: updated
    });
  } catch (error: any) {
    next(error);
  }
};
