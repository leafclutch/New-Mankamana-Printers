import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Client: List all my approved designs
// getMyApprovedDesignsService: Returns all ACTIVE approved designs for the logged-in client
export const getMyApprovedDesignsService = async (clientId: string) => {
  return await prisma.approvedDesign.findMany({
    where: { clientId, status: "ACTIVE" },
    include: {
      submission: {
        select: {
          title: true,
          template: { select: { category: { select: { name: true, slug: true } } } },
        },
      },
    },
    orderBy: { approvedAt: "desc" },
  });
};

// Client: Get my design
// getMyDesignByIdService: Fetches a single approved design record for the owning client
export const getMyDesignByIdService = async (designCode: string, clientId: string) => {
  return await prisma.approvedDesign.findFirst({
    where: { designCode, clientId },
  });
};

// Client: Verify Design ID
// verifyDesignIdService: Public-facing logic to check if a design code is active and valid
export const verifyDesignIdService = async (designCode: string, clientId: string) => {
  const design = await prisma.approvedDesign.findUnique({
    where: { designCode },
  });

  if (!design || design.status !== "ACTIVE") {
    return {
      valid: false,
      designId: designCode,
      status: design?.status || null,
      belongsToCurrentClient: false,
    };
  }

  return {
    valid: true,
    designId: design.designCode,
    status: design.status,
    belongsToCurrentClient: design.clientId === clientId,
  };
};

// Admin: Get all designs
// getAdminDesignsService: Paginated query for all approved designs, filterable by status and client
export const getAdminDesignsService = async (options: {
  status?: "ACTIVE" | "ARCHIVED";
  clientId?: string;
  search?: string;
  page: number;
  limit: number;
}) => {
  const { status, clientId, search, page, limit } = options;

  const where: any = {};
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;
  if (search) where.designCode = { contains: search, mode: "insensitive" };

  const [items, totalItems] = await Promise.all([
    prisma.approvedDesign.findMany({
      where,
      include: {
        client: { select: { id: true, business_name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { approvedAt: "desc" },
    }),
    prisma.approvedDesign.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return { items, pagination: { page, limit, totalItems, totalPages } };
};

// Admin: Get design detail
// getAdminDesignByIdService: Comprehensive data retrieval for a specific approved design for admin view
export const getAdminDesignByIdService = async (designCode: string) => {
  return await prisma.approvedDesign.findUnique({
    where: { designCode },
    include: {
      client: { select: { id: true, business_name: true, phone_number: true } },
      approvedBy: { select: { id: true, name: true } },
    },
  });
};

// Admin: Archive design
// archiveDesignService: Atomic transition of a design to ARCHIVED status with associated metadata
export const archiveDesignService = async (designCode: string, adminId: string, reason?: string) => {
  return await prisma.$transaction(async (tx) => {
    const design = await tx.approvedDesign.findUnique({ where: { designCode } });
    if (!design) throw new Error("Design not found");
    if (design.status === "ARCHIVED") return design; // idempotent

    const archivedDesign = await tx.approvedDesign.update({
      where: { designCode },
      data: {
        status: "ARCHIVED",
        archivedBy_id: adminId,
        archivedAt: new Date(),
        archiveReason: reason,
      },
    });

    return archivedDesign;
  });
};
