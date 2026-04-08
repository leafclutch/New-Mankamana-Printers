import { Request, Response } from "express";
import { recordPageViewService, getVisitorStatsService } from "../../services/analytics/analytics.service";

// PUBLIC — no auth required; fire-and-forget from the client website
export const trackPageView = async (req: Request, res: Response) => {
  try {
    const { path, sessionId } = req.body;
    if (path && sessionId) {
      await recordPageViewService(String(path).slice(0, 500), String(sessionId).slice(0, 100));
    }
  } catch {
    // intentionally swallow — never block visitors
  }
  res.status(200).json({ success: true });
};

// ADMIN — requires ADMIN JWT
export const getVisitorStats = async (_req: Request, res: Response) => {
  try {
    const stats = await getVisitorStatsService();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch visitor stats" });
  }
};
