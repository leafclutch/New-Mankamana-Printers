import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  pricingIdParamSchema,
  updatePricingBodySchema,
  variantIdParamSchema,
} from "../../validators/catalog.validator";
import { ApiError } from "../../utils/api-error";
import {
  listAdminPricingByVariantService,
  updateAdminPricingService,
} from "../../services/catalog/catalog-pricing.service";

const sendErrorResponse = (res: Response, error: unknown, context: string) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error.issues.map((issue) => issue.message).join(", "),
      },
    });
  }

  console.error(`${context}:`, error);
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    },
  });
};

// getVariantPricingMatrix: Returns every pricing row for a variant for admin review
export const getVariantPricingMatrix = async (req: Request, res: Response) => {
  try {
    const params = variantIdParamSchema.parse(req.params);
    const pricing = await listAdminPricingByVariantService(params.variantId);

    return res.status(200).json({
      success: true,
      variant_id: pricing.variant_id,
      variant_code: pricing.variant_code,
      data: pricing.data,
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Admin pricing lookup failed");
  }
};

// updatePricingRow: Updates the price and/or fixed discount for a single pricing row
export const updatePricingRow = async (req: Request, res: Response) => {
  try {
    const params = pricingIdParamSchema.parse(req.params);
    const body = updatePricingBodySchema.parse(req.body);
    const updatedPricing = await updateAdminPricingService(params.pricingId, body);

    return res.status(200).json({
      success: true,
      data: updatedPricing,
    });
  } catch (error) {
    return sendErrorResponse(res, error, "Admin pricing update failed");
  }
};
