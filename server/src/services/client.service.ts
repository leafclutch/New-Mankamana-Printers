import prisma from "../connect";
import { AppError } from "../utils/apperror";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const loginUserService = async ({
  client_id,
  password,
}: {
  client_id: string;
  password: string;
}) => {
  if (!client_id || !password) {
    throw new AppError("Client ID and password required", 400);
  }

  const user = await prisma.user.findUnique({
    where: { clientId: client_id },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" }
  );

  return {
    message: "Login successful",
    token,
    user: {
      id: user.id,
      client_id: user.clientId,
      role: user.role,
    },
  };
};

export const logoutUserService = async () => {
  return {
    message: "Logout successful",
  };
};

export const getCurrentUserService = async (req: any) => {
  const user = req.user;

  if (!user) {
    throw new AppError("Unauthorized", 401);
  }

  return {
    message: "User fetched",
    user,
  };
};



export const getUserProfileService = async (userId: string) => {
  const profile = await prisma.client.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          clientId: true,
          role: true,
          createdAt: true
        }
      }
    }
  });

  if (!profile) {
    throw new AppError("Profile not found", 404);
  }

  return {
    message: "Profile retrieved successfully",
    data: profile
  };
};

export const updateUserProfileService = async (
  userId: string,
  data: { phone?: string; address?: string }
) => {
  const profile = await prisma.client.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new AppError("Profile not found", 404);
  }

  const updatedProfile = await prisma.client.update({
    where: { userId },
    data: {
      phone: data.phone ?? profile.phone,
      address: data.address ?? profile.address,
    },
  });

  if (data.phone && profile.phone !== data.phone) {
    await prisma.user.update({
      where: { id: userId },
      data: { clientId: data.phone }
    });
  }

  return {
    message: "Profile updated successfully",
    data: updatedProfile
  };
};


export const getTemplateCategoriesService = async () => {
  const categories = await prisma.template.findMany({
    select: { category: true },
    distinct: ["category"],
  });

  return {
    message: "Template categories fetched successfully",
    data: categories.map((c: any) => c.category),
  };
};

export const getTemplatesService = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [templates, total] = await Promise.all([
    prisma.template.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.template.count(),
  ]);

  return {
    message: "Templates fetched successfully",
    data: {
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
};

export const getTemplateByIdService = async (template_id: string) => {
  const template = await prisma.template.findUnique({
    where: { id: template_id },
  });

  if (!template) throw new AppError("Template not found", 404);

  return {
    message: "Template fetched successfully",
    data: template,
  };
};

export const getTemplatesByCategoryService = async (category: string) => {
  const templates = await prisma.template.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
  });

  return {
    message: `Templates for category ${category} fetched successfully`,
    data: templates,
  };
};


export const submitDesignService = async (userId: string, fileUrl: string) => {
  const client = await prisma.client.findUnique({
    where: { userId },
  });

  if (!client) {
    throw new AppError("Client profile not found", 404);
  }

  const design = await prisma.design.create({
    data: {
      designCode: `PENDING-${client.id.substring(0, 8)}-${Date.now()}`, // Temporary pending code
      clientId: client.id,
      fileUrl,
      status: "PENDING",
    },
  });


  return {
    message: "Design submitted successfully. Awaiting admin review.",
    data: design,
  };
};

export const getMyDesignSubmissionsService = async (userId: string) => {
  const client = await prisma.client.findUnique({
    where: { userId },
  });

  if (!client) throw new AppError("Client profile not found", 404);

  const submissions = await prisma.design.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  });

  return {
    message: "Design submissions fetched successfully",
    data: submissions,
  };
};

export const getApprovedDesignByIdService = async (userId: string, design_id: string) => {
  const client = await prisma.client.findUnique({
    where: { userId },
  });

  if (!client) throw new AppError("Client profile not found", 404);

  const design = await prisma.design.findUnique({
    where: { id: design_id, clientId: client.id, status: "APPROVED" },
  });

  if (!design) throw new AppError("Approved design not found", 404);

  return {
    message: "Design fetched successfully",
    data: design,
  };
};

export const verifyDesignIdService = async (designCode: string) => {
  const design = await prisma.design.findUnique({
    where: { designCode },
  });

  if (!design) throw new AppError("Design ID not found", 404);
  if (design.status !== "APPROVED") {
    throw new AppError("Design is not approved yet", 400);
  }

  return {
    message: "Design ID is valid and approved",
    data: {
      id: design.id,
      designCode: design.designCode,
      previewUrl: design.previewUrl,
    },
  };
};
