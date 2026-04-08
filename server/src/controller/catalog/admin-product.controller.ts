import { Request, Response } from "express";
import * as adminProductService from "../../services/catalog/admin-product.service";

// createProduct: Adds a new base product to the catalog
export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = await adminProductService.createProductService(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// getAllProducts: Lists all products available in the system
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await adminProductService.getAllProductsService();
    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// createVariant: Creates a specific version (variant) of a product
export const createVariant = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const variant = await adminProductService.createVariantService(productId as string, req.body);
    res.status(201).json({ success: true, data: variant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// createOptionGroup: Adds a group of options (e.g., 'Size', 'Color') to a variant
export const createOptionGroup = async (req: Request, res: Response) => {
  try {
    const { variantId } = req.params;
    const group = await adminProductService.createOptionGroupService(variantId as string, req.body);
    res.status(201).json({ success: true, data: group });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// createOptionValue: Adds specific values (e.g., 'Large', 'Red') to an option group
export const createOptionValue = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const value = await adminProductService.createOptionValueService(groupId as string, req.body);
    res.status(201).json({ success: true, data: value });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// createVariantPricing: Defines the price for a specific combination of options for a variant
export const createVariantPricing = async (req: Request, res: Response) => {
  try {
    const { variantId } = req.params;
    const pricing = await adminProductService.createVariantPricingService(variantId as string, req.body);
    res.status(201).json({ success: true, data: pricing });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// getVariantFullDetails: Fetches comprehensive data for a variant including all options and pricing
export const getVariantFullDetails = async (req: Request, res: Response) => {
  try {
    const { variantId } = req.params;
    const details = await adminProductService.getVariantDetailsWithPricingInfo(variantId as string);
    if (!details) return res.status(404).json({ success: false, message: "Variant not found" });
    res.status(200).json({ success: true, data: details });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
