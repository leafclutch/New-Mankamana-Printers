import prisma from "../connect";

// getPrintingServicesService: Retrieves all active printing services from the database
export const getPrintingServicesService = async () => {
  return await prisma.printingService.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
};

// createPrintingServiceService: Saves a new printing service with its base price to the database
export const createPrintingServiceService = async (data: {
  name: string;
  description?: string;
  basePrice: number;
}) => {
  return await prisma.printingService.create({
    data,
  });
};

// getPrintingServiceByIdService: Finds a specific printing service by its unique ID
export const getPrintingServiceByIdService = async (id: string) => {
  return await prisma.printingService.findUnique({
    where: { id },
  });
};
