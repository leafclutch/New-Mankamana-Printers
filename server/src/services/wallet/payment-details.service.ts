import prisma from "../../connect";

export const createPaymentDetailsService = async (data: {
  companyName: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  paymentId?: string;
  qrImageUrl?: string;
  note?: string;
  adminId: string;
}) => {
  return prisma.companyPaymentDetail.create({
    data: {
      companyName: data.companyName,
      bankName: data.bankName,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      branch: data.branch,
      paymentId: data.paymentId,
      qrImageUrl: data.qrImageUrl,
      note: data.note,
      isActive: true,
      createdById: data.adminId,
    },
  });
};

export const getAllActivePaymentDetailsService = async () => {
  return prisma.companyPaymentDetail.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
};

// Kept for backward compat (used by getQrImage when no id provided)
export const getActivePaymentDetailsService = async () => {
  return prisma.companyPaymentDetail.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
};

export const getPaymentDetailByIdService = async (id: string) => {
  return prisma.companyPaymentDetail.findFirst({ where: { id, isActive: true } });
};

export const updatePaymentDetailsService = async (
  id: string,
  data: {
    companyName: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch?: string | null;
    paymentId?: string | null;
    qrImageUrl?: string | null;
    note?: string | null;
  }
) => {
  return prisma.companyPaymentDetail.update({
    where: { id },
    data: {
      companyName: data.companyName,
      bankName: data.bankName,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      branch: data.branch ?? null,
      paymentId: data.paymentId ?? null,
      qrImageUrl: data.qrImageUrl ?? null,
      note: data.note ?? null,
    },
  });
};

export const deletePaymentDetailsService = async (id: string) => {
  return prisma.companyPaymentDetail.update({
    where: { id },
    data: { isActive: false },
  });
};
