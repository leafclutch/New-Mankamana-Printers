import { Request, Response, NextFunction } from "express";
import { getPricelist } from "../../services/catalog/pricelist.service";

export const getPricelistController = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { rows, moduleTabs, computedAt, refreshHours } = await getPricelist();
    res.json({ success: true, data: { rows, moduleTabs, computedAt, refreshHours } });
  } catch (err) {
    next(err);
  }
};
