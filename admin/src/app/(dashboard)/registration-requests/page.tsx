"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Building2,
  Mail,
  Phone,
  Calendar,
  User,
} from "lucide-react";
import {
  approveRegistrationRequest,
  fetchRegistrationRequests,
  rejectRegistrationRequest,
  type RegistrationRequestUi,
} from "@/services/registrationRequestsService";

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  Approved: {
    badge:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  Rejected: {
    badge:
      "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-400",
    dot: "bg-red-500",
  },
  Pending: {
    badge:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
    dot: "bg-amber-500",
  },
};

export default function RegistrationRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RegistrationRequestUi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequestUi | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [credentialsById, setCredentialsById] = useState<
    Record<string, { client_id: string; password: string }>
  >({});
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin:registration-credentials");
      if (saved) {
        setCredentialsById(JSON.parse(saved));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchRegistrationRequests();
      setRequests(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load registration requests.";
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const result = await approveRegistrationRequest(id);
      setRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, status: "Approved" } : req))
      );
      toast({
        title: "Request Approved",
        description: "Registration approved.",
        variant: "success",
      });
      if (result.credentials) {
        const creds = result.credentials;
        setCredentialsById((prev) => {
          const next: Record<string, { client_id: string; password: string }> = {
            ...prev,
            [id]: creds,
          };
          try {
            localStorage.setItem(
              "admin:registration-credentials",
              JSON.stringify(next)
            );
          } catch {
            // ignore storage errors
          }
          return next;
        });
      }
      setIsViewOpen(false);
      window.dispatchEvent(new Event("stats-updated"));
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : "Failed to approve request.";
      const message =
        rawMessage.includes("ClientID") || rawMessage.includes("ClientId")
          ? "Approval failed: this phone/Client ID is already used. Please update the client's phone number or ask the backend to resolve the duplicate."
          : rawMessage;
      toast({
        title: "Approval Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setActionId(id);
    try {
      await rejectRegistrationRequest(id, reason);
      setRequests((prev) =>
        prev.map((req) =>
          req.id === id
            ? { ...req, status: "Rejected", rejectionReason: reason }
            : req
        )
      );
      toast({
        title: "Request Rejected",
        description: `Registration ${id} rejected.`,
        variant: "destructive",
      });
      setIsViewOpen(false);
      setIsRejectOpen(false);
      window.dispatchEvent(new Event("stats-updated"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reject request.";
      toast({
        title: "Rejection Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionId(null);
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectTargetId(id);
    setRejectReason("");
    setIsRejectOpen(true);
  };

  const openReviewDialog = (req: RegistrationRequestUi) => {
    setSelectedRequest(req);
    setIsViewOpen(true);
  };

  const normalizedSearch = searchTerm.toLowerCase();
  const filteredRequests = requests.filter((req) => {
    const company = (req.companyName || "").toLowerCase();
    const contact = (req.contactPerson || "").toLowerCase();
    const email = (req.email || "").toLowerCase();
    return (
      company.includes(normalizedSearch) ||
      contact.includes(normalizedSearch) ||
      email.includes(normalizedSearch)
    );
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      Pending: 0,
      Approved: 1,
      Rejected: 2,
    };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Registration Requests
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Manage and review new client registration applications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              toast({ title: "Filter", description: "Advanced filters coming soon." })
            }
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button className="gap-2">Export List</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Requests",
            value: requests.length,
            icon: Building2,
            bg: "bg-blue-50 dark:bg-blue-900/20",
            color: "text-blue-600 dark:text-blue-400",
          },
          {
            label: "Pending Review",
            value: requests.filter((r) => r.status === "Pending").length,
            icon: Calendar,
            bg: "bg-amber-50 dark:bg-amber-900/20",
            color: "text-amber-600 dark:text-amber-400",
          },
          {
            label: "Approved",
            value: requests.filter((r) => r.status === "Approved").length,
            icon: CheckCircle,
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            color: "text-emerald-600 dark:text-emerald-400",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {s.label}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    {s.value}
                  </h3>
                </div>
                <div className={`rounded-xl p-2.5 ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loadError ? (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-start gap-2 p-4 text-sm text-red-700">
            <span>{loadError}</span>
            <Button size="sm" variant="outline" onClick={loadRequests}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle className="text-base font-semibold">
              Recent Applications
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by company or contact..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition-all focus:border-[#0061FF] focus:bg-white focus:ring-2 focus:ring-[#0061FF]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800">
                <tr className="bg-slate-50/80 dark:bg-slate-800/40">
                  {[
                    "Request ID",
                    "Company",
                    "Contact Info",
                    "Date",
                    "Status",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${
                        i === 5 ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <p className="text-sm text-slate-500">
                        Loading requests...
                      </p>
                    </td>
                  </tr>
                ) : sortedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Building2 className="h-8 w-8 opacity-40" />
                        <p className="font-medium text-slate-500">
                          No requests found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedRequests.map((req) => {
                    const s = STATUS_STYLES[req.status];
                    return (
                      <tr
                        key={req.id}
                        className="group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        onClick={() => openReviewDialog(req)}
                      >
                        <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {req.id}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {req.companyName}
                            </span>
                            <span className="text-xs text-slate-500">
                              {req.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{req.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 shrink-0" />
                              {req.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                          {req.date}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.badge}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${s.dot}`}
                            />
                            {req.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {req.status === "Pending" && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(req.id);
                                  }}
                                  title="Approve"
                                  disabled={actionId === req.id}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openRejectDialog(req.id);
                                  }}
                                  title="Reject"
                                  disabled={actionId === req.id}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg md:max-w-2xl max-h-[90vh] md:max-h-none overflow-hidden md:overflow-visible flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Review Registration</DialogTitle>
            <DialogDescription>
              Details for request ID: {selectedRequest?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4 overflow-y-auto md:overflow-visible pr-1 flex-1">
              <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {selectedRequest.companyName}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedRequest.type}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <User className="mr-3 h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Contact Person:
                  </span>
                  <span className="ml-auto font-semibold text-slate-900 dark:text-white">
                    {selectedRequest.contactPerson}
                  </span>
                </div>
                <div className="flex items-center">
                  <Mail className="mr-3 h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Email:
                  </span>
                  <span className="ml-auto font-semibold text-slate-900 dark:text-white">
                    {selectedRequest.email}
                  </span>
                </div>
                <div className="flex items-center">
                  <Phone className="mr-3 h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Phone:
                  </span>
                  <span className="ml-auto font-semibold text-slate-900 dark:text-white">
                    {selectedRequest.phone}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-3 h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Request Date:
                  </span>
                  <span className="ml-auto font-semibold text-slate-900 dark:text-white">
                    {selectedRequest.date}
                  </span>
                </div>
                {selectedRequest.address ? (
                  <div className="flex items-center">
                    <Building2 className="mr-3 h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      Address:
                    </span>
                    <span className="ml-auto font-semibold text-slate-900 dark:text-white">
                      {selectedRequest.address}
                    </span>
                  </div>
                ) : null}
                {selectedRequest.message ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Message:{" "}
                    </span>
                    {selectedRequest.message}
                  </div>
                ) : null}
                {selectedRequest.status === "Rejected" &&
                selectedRequest.rejectionReason ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                    <span className="font-semibold">Rejection Reason: </span>
                    {selectedRequest.rejectionReason}
                  </div>
                ) : null}
                {credentialsById[selectedRequest.id] ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">Credentials</div>
                        <div>
                          Client ID:{" "}
                          {credentialsById[selectedRequest.id].client_id}
                        </div>
                        <div>
                          Password:{" "}
                          {credentialsById[selectedRequest.id].password}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
                        onClick={() => {
                          const creds = credentialsById[selectedRequest.id];
                          const text = `Client ID: ${creds.client_id}\nPassword: ${creds.password}`;
                          navigator.clipboard.writeText(text);
                          toast({
                            title: "Copied",
                            description: "Credentials copied to clipboard.",
                            variant: "success",
                          });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-center">
                  <div
                    className={`mr-3 h-4 w-4 text-slate-400 ${
                      STATUS_STYLES[selectedRequest.status]?.dot
                    }`}
                  />
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Status:
                  </span>
                  <span
                    className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_STYLES[selectedRequest.status]?.badge
                    }`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            {selectedRequest?.status === "Pending" && (
              <>
                <Button
                  variant="destructive"
                  className="gap-2 bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                  onClick={() =>
                    selectedRequest && openRejectDialog(selectedRequest.id)
                  }
                  disabled={actionId === selectedRequest.id}
                >
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
                <Button
                  className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                  onClick={() =>
                    selectedRequest && handleApprove(selectedRequest.id)
                  }
                  disabled={actionId === selectedRequest.id}
                >
                  <CheckCircle className="h-4 w-4" /> Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>
              Add a short reason. The client will be notified by the admin team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={4}
              placeholder="Provide a clear reason for rejection..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-red-500 dark:focus:ring-red-900/40"
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                rejectTargetId &&
                handleReject(rejectTargetId, rejectReason.trim())
              }
              disabled={
                !rejectTargetId ||
                rejectReason.trim().length === 0 ||
                actionId === rejectTargetId
              }
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
