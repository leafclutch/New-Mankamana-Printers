import { Request, Response } from "express";
import { createPaymentDetailsService, getActivePaymentDetailsService } from "../../services/wallet/payment-details.service";
import { createPaymentDetailsSchema } from "../../validators/wallet.validator";
import { uploadToSupabase } from "../../utils/file-upload";

// getPaymentDetails: Returns the currently active bank and QR payment information for clients to perform top-ups
export const getPaymentDetails = async (req: Request, res: Response) => {
  try {
    const details = await getActivePaymentDetailsService();
    if (!details) {
      return res.status(404).json({ success: false, message: "No active payment details found" });
    }
    res.status(200).json({
      success: true,
      data: {
        companyName: details.companyName,
        bankName: details.bankName,
        accountName: details.accountName,
        accountNumber: details.accountNumber,
        branch: details.branch,
        paymentId: details.paymentId,
        qrImageUrl: details.qrImageUrl,
        note: details.note,
      },
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// createPaymentDetails: Admin-only function to update the platform's official payment collection details
export const createPaymentDetails = async (req: Request, res: Response) => {
  try {
    const body = { ...req.body };

    // If a QR image file was uploaded, store it in Supabase and use its URL
    if (req.file) {
      try {
        body.qrImageUrl = await uploadToSupabase(req.file, "qr-codes");
      } catch (uploadError: any) {
        return res.status(500).json({ success: false, message: "QR image upload failed", error: uploadError.message });
      }
    }

    const validated = createPaymentDetailsSchema.safeParse(body);
    if (!validated.success) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validated.error.issues });
    }

    const adminId = (req as any).user.id;
    const details = await createPaymentDetailsService({ ...validated.data, adminId });

    res.status(201).json({
      success: true,
      message: "Payment details saved successfully",
      data: details,
    });
  } catch (error) {
    console.error("Error creating payment details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
