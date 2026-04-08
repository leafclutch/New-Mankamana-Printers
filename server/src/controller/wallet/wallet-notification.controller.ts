import { Request, Response } from "express";
import { getNotificationsService, markNotificationAsReadService, getClientWalletSummaryService } from "../../services/wallet/wallet-notification.service";
import { notificationQuerySchema } from "../../validators/wallet.validator";

// getClientNotifications: Fetches unread and historical alerts for the currently logged-in client
export const getClientNotifications = async (req: Request, res: Response) => {
  try {
    const validated = notificationQuerySchema.safeParse(req.query);
    if (!validated.success) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validated.error.issues });
    }

    const clientId = (req as any).user.id;
    const data = await getNotificationsService({
      recipientRole: "CLIENT",
      recipientId: clientId,
      isRead: validated.data.isRead,
      page: validated.data.page,
      limit: validated.data.limit,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// markClientNotificationRead: Updates a specific client notification status to READ
export const markClientNotificationRead = async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.notificationId as string;
    const clientId = (req as any).user.id;

    await markNotificationAsReadService(notificationId, "CLIENT", clientId);
    res.status(200).json({ success: true, message: "Notification marked as read" });
  } catch (error: any) {
    console.error("Error marking notification:", error);
    res.status(400).json({ success: false, message: error.message || "Failed" });
  }
};

// getAdminNotifications: Fetches system alerts and pending task notifications for administrators
export const getAdminNotifications = async (req: Request, res: Response) => {
  try {
    const validated = notificationQuerySchema.safeParse(req.query);
    if (!validated.success) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validated.error.issues });
    }

    const adminId = (req as any).user.id;
    const data = await getNotificationsService({
      recipientRole: "ADMIN",
      recipientId: adminId,
      isRead: validated.data.isRead,
      page: validated.data.page,
      limit: validated.data.limit,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// markAdminNotificationRead: Updates a specific administrative alert status to READ
export const markAdminNotificationRead = async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.notificationId as string;
    const adminId = (req as any).user.id;

    await markNotificationAsReadService(notificationId, "ADMIN", adminId);
    res.status(200).json({ success: true, message: "Notification marked as read" });
  } catch (error: any) {
    console.error("Error marking notification:", error);
    res.status(400).json({ success: false, message: error.message || "Failed" });
  }
};

// getAdminClientWalletSummary: Provides an admin with a quick overview of a client's total balance and transactions
export const getAdminClientWalletSummary = async (req: Request, res: Response) => {
  try {
    const clientId = req.params.clientId as string;
    const data = await getClientWalletSummaryService(clientId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching client wallet summary:", error);
    res.status(400).json({ success: false, message: error.message || "Failed" });
  }
};
