export type RegistrationRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface RegistrationRequestApi {
  id: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone_number?: string | null;
  business_address?: string | null;
  notes?: string | null;
  rejection_reason?: string | null;
  status: RegistrationRequestStatus;
  createdAt: string;
  reviewedAt?: string | null;
}

export interface RegistrationRequestUi {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
  type: string;
  address?: string;
  message?: string;
  rejectionReason?: string;
  createdAt?: string;
}

export interface ApproveResponse {
  message: string;
  credentials?: {
    client_id: string;
    password: string;
  };
}

interface ApproveBackendResponse {
  success: boolean;
  message: string;
  data?: {
    clientId: string;
    generatedPassword: string;
    clientUuid: string;
  };
}

const STATUS_MAP: Record<
  RegistrationRequestStatus,
  RegistrationRequestUi["status"]
> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toISOString().split("T")[0];
};

import { cachedJsonFetch, invalidateCacheKey } from "@/lib/requestCache";

const REQUESTS_CACHE_KEY = "admin-registration-requests";

const safeJson = async (response: Response) => {
  const raw = await response.text();
  if (!raw || raw.trim().length === 0) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
};

const mapRequest = (req: RegistrationRequestApi): RegistrationRequestUi => ({
  id: req.id,
  companyName: req.business_name,
  contactPerson: req.owner_name,
  email: req.email,
  phone: req.phone_number || "—",
  date: formatDate(req.createdAt),
  status: STATUS_MAP[req.status],
  type: "Business",
  address: req.business_address ?? undefined,
  message: req.notes ?? undefined,
  rejectionReason: req.rejection_reason ?? undefined,
  createdAt: req.createdAt,
});

export const fetchRegistrationRequests = async (): Promise<
  RegistrationRequestUi[]
> => {
  const data = await cachedJsonFetch<{ success?: boolean; data?: RegistrationRequestApi[]; message?: string }>(REQUESTS_CACHE_KEY, "/api/admin/registration-requests", 20_000);
  if (!data?.success && !data?.data) {
    throw new Error(data?.message || "Failed to load registration requests.");
  }
  return (data?.data || []).map(mapRequest);
};

export const fetchRegistrationRequestById = async (
  requestId: string
): Promise<RegistrationRequestUi> => {
  const response = await fetch(`/api/admin/registration-requests/${requestId}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load registration request.");
  }

  return mapRequest(data.data as RegistrationRequestApi);
};

export const approveRegistrationRequest = async (
  requestId: string
): Promise<ApproveResponse> => {
  const response = await fetch(
    `/api/admin/registration-requests/${requestId}/approve`,
    {
      method: "POST",
    }
  );

  const data = await safeJson(response) as ApproveBackendResponse;
  if (!response.ok) {
    throw new Error(data?.message || "Failed to approve request.");
  }

  invalidateCacheKey(REQUESTS_CACHE_KEY);
  return {
    message: data.message,
    credentials: data.data
      ? { client_id: data.data.clientId, password: data.data.generatedPassword }
      : undefined,
  };
};

export const rejectRegistrationRequest = async (
  requestId: string,
  reason?: string
) => {
  const response = await fetch(
    `/api/admin/registration-requests/${requestId}/reject`,
    {
      method: "PATCH",
      headers: reason ? { "Content-Type": "application/json" } : undefined,
      body: reason ? JSON.stringify({ reason }) : undefined,
    }
  );

  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to reject request.");
  }

  invalidateCacheKey(REQUESTS_CACHE_KEY);
  return data as { message: string };
};
