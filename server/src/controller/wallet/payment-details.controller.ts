import { Request, Response } from "express";
import {
  createPaymentDetailsService,
  getAllActivePaymentDetailsService,
  getPaymentDetailByIdService,
  getActivePaymentDetailsService,
  updatePaymentDetailsService,
  deletePaymentDetailsService,
} from "../../services/wallet/payment-details.service";
import { createPaymentDetailsSchema, updatePaymentDetailsSchema } from "../../validators/wallet.validator";
import { uploadToSupabasePath, deleteFromSupabase, getPublicUrlForPath, downloadFromSupabase } from "../../utils/file-upload";

function resolveQrUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (value.includes("..") || value.toLowerCase() === "invalid") return null;
  if (value.startsWith("http")) return value;
  return getPublicUrlForPath(value);
}

function paymentDetailsToApi(d: {
  id: string;
  companyName: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string | null;
  paymentId: string | null;
  qrImageUrl: string | null;
  note: string | null;
}) {
  return {
    id: d.id,
    companyName: d.companyName,
    bankName: d.bankName,
    accountName: d.accountName,
    accountNumber: d.accountNumber,
    branch: d.branch,
    paymentId: d.paymentId,
    qrImageUrl: resolveQrUrl(d.qrImageUrl),
    note: d.note,
  };
}

// getPaymentDetails: Returns all active payment methods as an array
export const getPaymentDetails = async (_req: Request, res: Response) => {
  try {
    const all = await getAllActivePaymentDetailsService();
    const data = all.map(paymentDetailsToApi);

    res.setHeader("Cache-Control", "private, max-age=60");
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// getPaymentDetailsById: Admin-only detail fetch for edit/update flows
export const getPaymentDetailsById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ success: false, message: "id required" });

    const details = await getPaymentDetailByIdService(id);
    if (!details) return res.status(404).json({ success: false, message: "Payment method not found" });

    res.setHeader("Cache-Control", "private, max-age=60");
    return res.status(200).json({ success: true, data: paymentDetailsToApi(details) });
  } catch (error) {
    console.error("Error fetching payment detail:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// getQrImage: Proxy endpoint, accepts optional ?id= to select which QR to serve
export const getQrImage = async (req: Request, res: Response) => {
  try {
    const id = typeof req.query.id === "string" ? req.query.id.trim() : undefined;
    const details = id
      ? await getPaymentDetailByIdService(id)
      : await getActivePaymentDetailsService();

    const qrPath = details?.qrImageUrl?.trim();
    if (!qrPath) return res.status(404).json({ success: false, message: "QR image not found" });

    if (qrPath.startsWith("http")) return res.redirect(302, qrPath);
    if (qrPath.includes("..") || qrPath.toLowerCase() === "invalid") {
      return res.status(404).json({ success: false, message: "QR image not found" });
    }

    try {
      const { buffer, mimeType } = await downloadFromSupabase(qrPath);
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
      return res.send(buffer);
    } catch (downloadError) {
      console.warn("QR image not available:", { id: details?.id, qrPath, downloadError });
      return res.status(404).json({ success: false, message: "QR image not found" });
    }
  } catch (error) {
    console.error("Error proxying QR image:", error);
    return res.status(500).json({ success: false, message: "Unable to load QR image" });
  }
};

// createPaymentDetails: Admin-only, adds a new payment method
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

    return res.status(201).json({ success: true, message: "Payment method added successfully", data: details });
  } catch (error) {
    console.error("Error creating payment details:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// updatePaymentDetails: Admin-only, updates an existing payment method by id
export const updatePaymentDetails = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "id required" });

    const existing = await getPaymentDetailByIdService(id);
    if (!existing) return res.status(404).json({ success: false, message: "Payment method not found" });

    const body = { ...req.body };

    if (req.file) {
      try {
        const { path: qrPath } = await uploadToSupabasePath(req.file, "qr-codes");
        body.qrImageUrl = qrPath;
      } catch (uploadError: any) {
        return res.status(500).json({ success: false, message: "QR image upload failed", error: uploadError.message });
      }
    }

    const validated = updatePaymentDetailsSchema.safeParse(body);
    if (!validated.success) {
      const fieldErrors = validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return res.status(400).json({ success: false, message: `Validation failed: ${fieldErrors}`, errors: validated.error.issues });
    }

    const shouldRemoveQr = validated.data.removeQrImage === true;
    const oldQrPath = existing.qrImageUrl;
    const hasUploadedNewQr = typeof validated.data.qrImageUrl === "string" && validated.data.qrImageUrl.length > 0;
    const nextQrImageUrl = hasUploadedNewQr
      ? validated.data.qrImageUrl!
      : shouldRemoveQr
        ? null
        : existing.qrImageUrl ?? null;

    const updated = await updatePaymentDetailsService(id, {
      companyName: validated.data.companyName,
      bankName: validated.data.bankName,
      accountName: validated.data.accountName,
      accountNumber: validated.data.accountNumber,
      branch: validated.data.branch ?? null,
      paymentId: validated.data.paymentId ?? null,
      qrImageUrl: nextQrImageUrl,
      note: validated.data.note ?? null,
    });

    if (
      oldQrPath &&
      !oldQrPath.startsWith("http") &&
      oldQrPath !== nextQrImageUrl &&
      (hasUploadedNewQr || shouldRemoveQr)
    ) {
      await deleteFromSupabase(oldQrPath).catch(() => {});
    }

    return res.status(200).json({ success: true, message: "Payment method updated successfully", data: updated });
  } catch (error) {
    console.error("Error updating payment details:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// deletePaymentDetails: Admin-only, deactivates a payment method by id
export const deletePaymentDetails = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "id required" });

    const detail = await getPaymentDetailByIdService(id);
    if (!detail) return res.status(404).json({ success: false, message: "Payment method not found" });

    // Delete the stored QR image if it is a path (not legacy URL).
    if (detail.qrImageUrl && !detail.qrImageUrl.startsWith("http")) {
      await deleteFromSupabase(detail.qrImageUrl).catch(() => {});
    }

    await deletePaymentDetailsService(id);
    return res.status(200).json({ success: true, message: "Payment method removed" });
  } catch (error) {
    console.error("Error deleting payment details:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
