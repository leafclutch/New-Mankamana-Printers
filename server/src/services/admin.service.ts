import prisma from "../connect";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/apperror";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getRegistrationRequestsService = async () => {
  const data = await prisma.registrationRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return {
    message: "Registration requests fetched successfully",
    data,
  };
};

export const createRegistrationRequestService = async (data: {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  message?: string;
}) => {
  const newRequest = await prisma.registrationRequest.create({
    data,
  });

  return {
    message: "Registration request submitted successfully",
    data: newRequest,
  };
};

export const getRegistrationRequestByIdService = async (
  request_id: string
) => {
  const data = await prisma.registrationRequest.findUnique({
    where: { id: request_id },
  });

  if (!data) throw new AppError("Request not found", 404);

  return {
    message: "Registration request fetched",
    data,
  };
};

export const approveRegistrationRequestService = async (
  request_id: string
) => {
  const request = await prisma.registrationRequest.findUnique({
    where: { id: request_id },
  });

  if (!request) {
    throw new AppError("Registration request not found", 404);
  }

  if (request.status !== "PENDING") {
    throw new AppError("Request has already been reviewed", 400);
  }

  const clientId = request.phone;
  const rawPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  // Create the user and link the registration request in a transaction
  const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const newUser = await tx.user.create({
      data: {
        clientId,
        password: hashedPassword,
        role: "CLIENT",
      },
    });

    await tx.registrationRequest.update({
      where: { id: request_id },
      data: {
        status: "APPROVED",
        userId: newUser.id,
        reviewedAt: new Date(),
      },
    });

    // Create the client profile
    await tx.client.create({
      data: {
        userId: newUser.id,
        companyName: request.companyName,
        email: request.email,
        phone: request.phone,
        address: request.address ?? undefined,
      },
    });

    return newUser;
  });

  return {
    message: "Client approved successfully",
    credentials: {
      client_id: clientId,
      password: rawPassword,
    },
  };
};

export const rejectRegistrationRequestService = async (
  request_id: string,
  reason?: string
) => {
  const request = await prisma.registrationRequest.findUnique({
    where: { id: request_id },
  });

  if (!request) throw new AppError("Request not found", 404);

  if (request.status !== "PENDING") {
    throw new AppError("Request has already been reviewed", 400);
  }

  await prisma.registrationRequest.update({
    where: { id: request_id },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      reviewedAt: new Date(),
    },
  });

  return {
    message: "Registration request rejected",
  };
};


export const getPendingDesignSubmissionsService = async () => {
  const submissions = await prisma.design.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      client: {
        select: { companyName: true, email: true },
      },
    },
  });

  return {
    message: "Pending design submissions fetched successfully",
    data: submissions,
  };
};

export const getDesignSubmissionByIdService = async (submission_id: string) => {
  const submission = await prisma.design.findUnique({
    where: { id: submission_id },
    include: {
      client: {
        select: { companyName: true, email: true, phone: true },
      },
    },
  });

  if (!submission) throw new AppError("Design submission not found", 404);

  return {
    message: "Design submission fetched successfully",
    data: submission,
  };
};

export const approveDesignSubmissionService = async (
  adminId: string,
  submission_id: string,
  previewUrl: string
) => {
  const submission = await prisma.design.findUnique({
    where: { id: submission_id },
  });

  if (!submission) throw new AppError("Design submission not found", 404);
  if (submission.status !== "PENDING") {
    throw new AppError("Submission is already reviewed", 400);
  }

  const uniqueDesignCode = `DSGN-${uuidv4().substring(0, 8).toUpperCase()}`;

  const approvedDesign = await prisma.design.update({
    where: { id: submission_id },
    data: {
      status: "APPROVED",
      designCode: uniqueDesignCode,
      previewUrl,
      reviewedById: adminId,
      reviewedAt: new Date(),
    },
  });


  return {
    message: "Design approved successfully",
    data: approvedDesign,
  };
};

export const rejectDesignSubmissionService = async (
  adminId: string,
  submission_id: string,
  reason: string
) => {
  const submission = await prisma.design.findUnique({
    where: { id: submission_id },
  });

  if (!submission) throw new AppError("Design submission not found", 404);
  if (submission.status !== "PENDING") {
    throw new AppError("Submission is already reviewed", 400);
  }

  const rejectedDesign = await prisma.design.update({
    where: { id: submission_id },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      reviewedById: adminId,
      reviewedAt: new Date(),
    },
  });


  return {
    message: "Design rejected successfully",
    data: rejectedDesign,
  };
};

export const getApprovedDesignsService = async () => {
  const designs = await prisma.design.findMany({
    where: { status: "APPROVED" },
    orderBy: { reviewedAt: "desc" },
    include: {
      client: {
        select: { companyName: true },
      },
    },
  });

  return {
    message: "Approved designs fetched successfully",
    data: designs,
  };
};

export const getApprovedDesignByIdAdminService = async (design_id: string) => {
  const design = await prisma.design.findUnique({
    where: { id: design_id, status: "APPROVED" },
    include: {
      client: {
        select: { companyName: true, email: true, phone: true },
      },
      reviewedBy: {
        select: { clientId: true },
      },
    },
  });

  if (!design) throw new AppError("Approved design not found", 404);

  return {
    message: "Approved design fetched successfully",
    data: design,
  };
};

export const deleteApprovedDesignService = async (design_id: string) => {
  const design = await prisma.design.findUnique({
    where: { id: design_id },
  });

  if (!design) throw new AppError("Design not found", 404);

  await prisma.design.delete({
    where: { id: design_id },
  });

  return {
    message: "Design record deleted successfully",
  };
};

export const loginAdminService = async ({
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

  if (user.role !== "ADMIN") {
    throw new AppError("Access denied. Admin privileges required.", 403);
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
    message: "Admin login successful",
    token,
    user: {
      id: user.id,
      client_id: user.clientId,
      role: user.role,
    },
  };
};

export const logoutAdminService = async () => {
  return {
    message: "Admin logout successful",
  };
};