import prisma from "../../connect";

// createPaymentDetailsService: Logic to create new platform payment details and automatically deactivate older active records
export const createPaymentDetailsService = async (data: {
  companyName: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  paymentId?: string;
  qrImageUrl?: string;
  note?: string;
  isActive?: boolean;
  adminId: string;
}) => {
  // If isActive, deactivate all existing active records
  if (data.isActive !== false) {
    await prisma.companyPaymentDetail.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }

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
      isActive: data.isActive !== false,
      createdById: data.adminId,
    },
  });
};

// getActivePaymentDetailsService: Retrieves the currently active bank and QR info for the platform
export const getActivePaymentDetailsService = async () => {
  return prisma.companyPaymentDetail.findFirst({
    where: { isActive: true },
  });
};
