import prisma from "../../connect";

// getNotificationsService: Fetches filtered, paginated alerts for either clients or administrators
export const getNotificationsService = async (params: {
  recipientRole: string;
  recipientId: string;
  isRead?: boolean;
  page: number;
  limit: number;
}) => {
  const where: any = {
    recipientRole: params.recipientRole,
  };

  // For admin, show all admin notifications
  if (params.recipientRole === "ADMIN") {
    where.recipientRole = "ADMIN";
  } else {
    where.recipientId = params.recipientId;
  }

  if (params.isRead !== undefined) where.isRead = params.isRead;

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    items: items.map((n) => ({
      notificationId: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      referenceId: n.referenceId,
      isRead: n.isRead,
      createdAt: n.createdAt,
    })),
    pagination: {
      page: params.page,
      limit: params.limit,
      totalItems: total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
};

// markNotificationAsReadService: Logic to transition a single alert to READ status
export const markNotificationAsReadService = async (
  notificationId: string,
  recipientRole: string,
  recipientId: string
) => {
  const where: any = { id: notificationId, recipientRole };
  if (recipientRole === "CLIENT") {
    where.recipientId = recipientId;
  }

  const notification = await prisma.notification.findFirst({ where });
  if (!notification) throw new Error("Notification not found");

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
};

// getClientWalletSummaryService: Advanced admin view providing a financial profile and transaction summary for a client
export const getClientWalletSummaryService = async (clientId: string) => {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, business_name: true, phone_number: true },
  });
  if (!client) throw new Error("Client not found");

  const wallet = await prisma.walletAccount.findUnique({
    where: { clientId },
  });

  const totalCredits = await prisma.walletTransaction.aggregate({
    where: { clientId, type: "CREDIT" },
    _sum: { amount: true },
  });

  const totalDebits = await prisma.walletTransaction.aggregate({
    where: { clientId, type: "DEBIT" },
    _sum: { amount: true },
  });

  return {
    client: { id: client.id, name: client.business_name, phone: client.phone_number },
    currency: wallet?.currency || "NPR",
    availableBalance: wallet ? Number(wallet.availableBalance) : 0,
    totalCredits: Number(totalCredits._sum.amount || 0),
    totalDebits: Number(totalDebits._sum.amount || 0),
  };
};
