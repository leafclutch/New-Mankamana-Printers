export type DesignStatusUi = "Pending" | "Approved" | "Rejected";

export interface DesignListItem {
  id: string;
  title: string;
  client: string;
  designer: string;
  submittedDate: string;
  status: DesignStatusUi;
  image: string;
  fileUrl?: string;
  previewUrl?: string;
  designCode?: string;
}

interface PendingDesignApi {
  submissionId: string;
  title: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  submittedAt: string;
  fileUrl?: string | null;
  fileType?: string | null;
  notes?: string | null;
  client?: {
    id?: string | null;
    name?: string | null;
    phone?: string | null;
  } | null;
}

interface ApprovedDesignApi {
  designId: string;
  status: "APPROVED" | "ARCHIVED";
  approvedAt?: string | null;
  submissionId?: string | null;
  client?: {
    id?: string | null;
    name?: string | null;
  } | null;
}

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toISOString().split("T")[0];
};

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

const mapPendingDesign = (design: PendingDesignApi): DesignListItem => ({
  id: design.submissionId,
  title: design.title || `Design Submission ${design.submissionId.slice(0, 6)}`,
  client: design.client?.name || "Unknown Client",
  designer: design.client?.name || "Client",
  submittedDate: formatDate(design.submittedAt),
  status: design.status === "PENDING_REVIEW" ? "Pending" : design.status === "APPROVED" ? "Approved" : "Rejected",
  image: design.fileUrl || "",
  fileUrl: design.fileUrl || undefined,
  designCode: undefined,
});

const mapApprovedDesign = (design: ApprovedDesignApi): DesignListItem => ({
  id: design.designId,
  title: design.designId || `Approved Design ${design.designId.slice(0, 6)}`,
  client: design.client?.name || "Unknown Client",
  designer: design.client?.name || "Client",
  submittedDate: formatDate(design.approvedAt || ""),
  status: "Approved",
  image: "",
  designCode: design.designId,
});

export const fetchPendingDesignSubmissions = async (): Promise<DesignListItem[]> => {
  const response = await fetch("/api/admin/designs/submissions", {
    method: "GET",
    cache: "no-store",
  });

  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load design submissions.");
  }

  return (data?.data?.items || []).map(mapPendingDesign);
};

export const fetchApprovedDesigns = async (): Promise<DesignListItem[]> => {
  const response = await fetch("/api/admin/designs", {
    method: "GET",
    cache: "no-store",
  });

  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load approved designs.");
  }

  return (data?.data?.items || []).map(mapApprovedDesign);
};

export const approveDesignSubmission = async (
  submissionId: string,
  note?: string
) => {
  const response = await fetch("/api/admin/designs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId, note }),
  });

  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to approve design.");
  }

  return data;
};

export const rejectDesignSubmission = async (
  submissionId: string,
  reason: string
) => {
  const response = await fetch(
    `/api/admin/designs/submissions/${submissionId}/reject`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackMessage: reason }),
    }
  );

  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to reject design.");
  }

  return data;
};
