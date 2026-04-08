import { Request, Response } from "express";
import { getBalanceService } from "../../services/wallet/wallet-account.service";
import { validateCheckoutSchema } from "../../validators/wallet.validator";
import { getOrCreateWalletService } from "../../services/wallet/wallet-account.service";

// getWalletBalance: Retrieves the live available balance for the authenticated client's wallet
export const getWalletBalance = async (req: Request, res: Response) => {
  try {
    const clientId = (req as any).user.id;
    const data = await getBalanceService(clientId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// validateCheckout: Pre-verification to ensure the client has sufficient funds before allowing an order placement
export const validateCheckout = async (req: Request, res: Response) => {
  try {
    const validated = validateCheckoutSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validated.error.issues });
    }

    const clientId = (req as any).user.id;
    const balance = await getBalanceService(clientId);
    const orderAmount = validated.data.orderAmount;
    const sufficient = balance.availableBalance >= orderAmount;

    res.status(200).json({
      success: true,
      data: {
        currency: balance.currency,
        availableBalance: balance.availableBalance,
        orderAmount,
        sufficient,
        shortfall: sufficient ? 0 : orderAmount - balance.availableBalance,
      },
    });
  } catch (error) {
    console.error("Error validating checkout:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
