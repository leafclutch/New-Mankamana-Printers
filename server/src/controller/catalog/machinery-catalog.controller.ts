import { Request, Response, NextFunction } from "express";
import * as machineryService from "../../services/catalog/machinery-catalog.service";

export const getMachineryCatalogController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await machineryService.listMachineryCatalogService();
    // Keep top-level groups/products for backward compatibility,
    // while aligning with the common { success, data } response shape.
    res.json({ success: true, data, ...data });
  } catch (err) { next(err); }
};

export const getMachineryGroupController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await machineryService.getMachineryGroupService(req.params.groupId as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const listMachineryGroupsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await machineryService.listMachineryGroupsAdminService();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const createMachineryGroupController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await machineryService.createMachineryGroupService(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

export const updateMachineryGroupController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await machineryService.updateMachineryGroupService(req.params.groupId as string, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const listMachineryProductsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await machineryService.listMachineryProductsAdminService();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const createMachineryProductController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await machineryService.createMachineryProductService(req.params.groupId as string, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};
