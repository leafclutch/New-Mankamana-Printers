import { Request, Response } from "express";
import * as serviceLogic from "../services/printing-service.service";
import { z } from "zod";

const createServiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  basePrice: z.number().positive(),
});

// getServices: Fetches all listed printing services for public view
export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await serviceLogic.getPrintingServicesService();
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// createService: Admin-only function to add a new printing service with a base price
export const createService = async (req: Request, res: Response) => {
  try {
    const validated = createServiceSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, errors: validated.error.issues });
    }

    const service = await serviceLogic.createPrintingServiceService(validated.data);
    res.status(201).json({ success: true, message: "Service created successfully", data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// getServiceById: Returns the specifics of a single printing service
export const getServiceById = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const service = await serviceLogic.getPrintingServiceByIdService(serviceId as string);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
