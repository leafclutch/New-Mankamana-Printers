import { Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import {
  createGroupAdminService,
  getProductGroupService,
  listAllGroupsAdminService,
  listCatalogService,
  setProductGroupAdminService,
  updateGroupAdminService,
} from "../../services/catalog/product-group.service";

const handleError = (res: Response, error: unknown) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
  }
  console.error("ProductGroup error:", error);
  return res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
};

// Public: unified catalog for browse page (groups + standalone products)
export const getCatalogController = async (_req: Request, res: Response) => {
  try {
    const catalog = await listCatalogService();
    res.setHeader("Cache-Control", "private, max-age=60");
    return res.status(200).json({ success: true, data: catalog });
  } catch (error) {
    return handleError(res, error);
  }
};

// Public: get a group with its sub-products
export const getGroupController = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const group = await getProductGroupService(groupId);
    res.setHeader("Cache-Control", "private, max-age=60");
    return res.status(200).json({ success: true, data: group });
  } catch (error) {
    return handleError(res, error);
  }
};

// Admin: list all groups with products
export const adminListGroupsController = async (_req: Request, res: Response) => {
  try {
    const groups = await listAllGroupsAdminService();
    return res.status(200).json({ success: true, data: groups });
  } catch (error) {
    return handleError(res, error);
  }
};

// Admin: create a group
export const adminCreateGroupController = async (req: Request, res: Response) => {
  try {
    const { group_code, name, description, image_url, category_id } = req.body;
    if (!group_code || !name) {
      return res.status(400).json({ success: false, message: "group_code and name are required." });
    }
    const group = await createGroupAdminService({ group_code, name, description, image_url, category_id });
    return res.status(201).json({ success: true, data: group });
  } catch (error) {
    return handleError(res, error);
  }
};

// Admin: update a group
export const adminUpdateGroupController = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { name, description, image_url, is_active } = req.body;
    const group = await updateGroupAdminService(groupId, { name, description, image_url, is_active });
    return res.status(200).json({ success: true, data: group });
  } catch (error) {
    return handleError(res, error);
  }
};

// Admin: assign/remove a product from a group
export const adminSetProductGroupController = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { group_id } = req.body; // null to remove from group
    const product = await setProductGroupAdminService(productId, group_id ?? null);
    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    return handleError(res, error);
  }
};
