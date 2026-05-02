import { Request, Response } from "express";
import {
  createPaymentDetailsService,
  getAllActivePaymentDetailsService,
  getPaymentDetailByIdService,
  getActivePaymentDetailsService,
  deletePaymentDetailsService,
} from "../../services/wallet/payment-details.service";
import { createPaymentDetailsSchema } from "../../validators/wallet.validator";
import { uploadToSupabasePath, deleteFromSupabase, getPublicUrlForPath, downloadFromSupabase } from "../../utils/file-upload";

function resolveQrUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  return getPublicUrlForPath(raw);
}

// getPaymentDetails: Returns ALL active payment methods as an array
export const getPaymentDetails = async (req: Request, res: Response) => {
  try {
    const all = await getAllActivePaymentDetailsService();
    const data = all.map((d) => ({
      id: d.id,
      companyName: d.companyName,
      bankName: d.bankName,
      accountName: d.accountName,
      accountNumber: d.accountNumber,
      branch: d.branch,
      paymentId: d.paymentId,
      qrImageUrl: resolveQrUrl(d.qrImageUrl),
      note: d.note,
    }));

    res.setHeader("Cache-Control", "private, max-age=60");
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// getQrImage: Proxy endpoint — accepts optional ?id= param to select which QR to serve
export const getQrImage = async (req: Request, res: Response) => {
  try {
    const id = req.query.id as string | undefined;
    const details = id
      ? await getPaymentDetailByIdService(id)
      : await getActivePaymentDetailsService();

    if (!details?.qrImageUrl) return res.status(404).end();

    const qrPath = details.qrImageUrl;
    if (qrPath.startsWith("http")) return res.redirect(302, qrPath);

    const { buffer, mimeType } = await downloadFromSupabase(qrPath);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    return res.send(buffer);
  } catch (error) {
    console.error("Error proxying QR image:", error);
    return res.status(500).end();
  }
};

// createPaymentDetails: Admin-only — adds a new payment method
export const createPaymentDetails = async (req: Request, res: Response) => {
  try {
    const body = { ...req.body };

    if (req.file) {
      try {
        const { path: qrPath } = await uploadToSupabasePath(req.file, "qr-codes");
        body.qrImageUrl = qrPath;
      } catch (uploadError: any) {
        return res.status(500).json({ success: false, message: "QR image upload failed", error: uploadError.message });
      }
    }

    const validated = createPaymentDetailsSchema.safeParse(body);
    if (!validated.success) {
      const fieldErrors = validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return res.status(400).json({ success: false, message: `Validation failed: ${fieldErrors}`, errors: validated.error.issues });
    }

    const adminId = (req as any).user.id;
    const details = await createPaymentDetailsService({ ...validated.data, adminId });

    res.status(201).json({ success: true, message: "Payment method added successfully", data: details });
  } catch (error) {
    console.error("Error creating payment details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// deletePaymentDetails: Admin-only — deactivates a payment method by id
export const deletePaymentDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "id required" });

    const detail = await getPaymentDetailByIdService(id);
    if (!detail) return res.status(404).json({ success: false, message: "Payment method not found" });

    // Delete the stored QR image if it's a path (not legacy URL)
    if (detail.qrImageUrl && !detail.qrImageUrl.startsWith("http")) {
      await deleteFromSupabase(detail.qrImageUrl).catch(() => {});
    }

    await deletePaymentDetailsService(id);
    res.status(200).json({ success: true, message: "Payment method removed" });
  } catch (error) {
    console.error("Error deleting payment details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
