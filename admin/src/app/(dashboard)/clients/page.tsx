"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, Users, Phone, Mail, Building2, RefreshCw, KeyRound, MapPin, User, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  client_code?: string | null;
  business_name: string;
  owner_name: string;
  phone_number: string;
  email: string;
  address?: string | null;
  status: string;
  createdAt?: string;
}

interface ResetResult {
  phone_number: string;
  new_password: string;
}

export default function ClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleResetPassword = async (client: Client) => {
    setResettingId(client.id);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/reset-password`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Reset failed");
      setResetResult(json.credentials);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setResettingId(null);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clients", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load clients");
      const data = Array.isArray(json) ? json : json.data ?? [];
      setClients(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.business_name.toLowerCase().includes(q) ||
      c.phone_number.includes(q) ||
      (c.client_code ?? "").toLowerCase().includes(q)
    );
  });

  const activeCount = clients.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0061FF]">Client Operations</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Clients Directory</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track approved businesses, review profiles, and monitor engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Total Clients", value: clients.length, icon: Users },
          { label: "Active", value: activeCount, icon: Building2 },
          { label: "Inactive", value: clients.length - activeCount, icon: Phone },
        ].map((stat) => (
          <Card key={stat.label} className="border-slate-200/80 shadow-sm dark:border-slate-800">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
              <div className="rounded-full bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-lg font-semibold">Client List</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-[#0061FF] focus:ring-1 focus:ring-[#0061FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="Search by client or phone"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" size="icon" onClick={fetchClients} title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Loading clients...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Client</th>
                    <th className="px-6 py-4 font-semibold">Contact</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 text-right font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        {loading ? "Loading..." : "No clients found."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((client) => (
                      <tr
                        key={client.id}
                        className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        onClick={() => setSelectedClient(client)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {client.business_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {client.client_code ?? client.id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone className="h-3.5 w-3.5" />
                            {client.phone_number}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <Mail className="h-3.5 w-3.5" />
                            {client.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={client.status === "active" ? "default" : "secondary"}>
                            {client.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-slate-400">
                              {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : "—"}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}
                              className="gap-1 text-xs"
                              title="View Details"
                            >
                              <Eye className="h-3 w-3" />
                              Details
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={resettingId === client.id}
                              onClick={(e) => { e.stopPropagation(); handleResetPassword(client); }}
                              className="gap-1 text-xs"
                            >
                              <KeyRound className="h-3 w-3" />
                              {resettingId === client.id ? "Resetting..." : "Reset"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Reset password result dialog */}
      <Dialog open={!!resetResult} onOpenChange={() => setResetResult(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Credentials Generated</DialogTitle>
            <DialogDescription>
              The password has been reset and emailed to the client. Copy it below before closing.
            </DialogDescription>
          </DialogHeader>
          {resetResult && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3 dark:border-slate-700 dark:bg-slate-800">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Login ID (Phone)</p>
                <p className="font-mono font-semibold text-slate-900 dark:text-white">{resetResult.phone_number}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">New Password</p>
                <p className="font-mono text-xl font-bold tracking-widest text-[#0061FF]">{resetResult.new_password}</p>
              </div>
            </div>
          )}
          <Button type="button" onClick={() => setResetResult(null)} className="w-full bg-[#0061FF] hover:bg-[#0050d5]">
            Done
          </Button>
        </DialogContent>
      </Dialog>

      {/* Client detail dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#0061FF]" />
              {selectedClient?.business_name}
            </DialogTitle>
            <DialogDescription>
              Client profile and account details
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Client Code</p>
                  <p className="mt-1 font-mono text-sm font-bold text-[#0061FF]">
                    {selectedClient.client_code ?? selectedClient.id.slice(0, 8)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</p>
                  <p className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${selectedClient.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                      {selectedClient.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Owner</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedClient.owner_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Phone</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedClient.phone_number}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Email</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedClient.email}</p>
                  </div>
                </div>
                {selectedClient.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Address</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedClient.address}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Joined</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {selectedClient.createdAt ? new Date(selectedClient.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setSelectedClient(null)}
            >
              Close
            </Button>
            <Button
              type="button"
              className="flex-1 gap-2 bg-[#0061FF] hover:bg-[#0050d5]"
              disabled={resettingId === selectedClient?.id}
              onClick={() => { if (selectedClient) handleResetPassword(selectedClient); setSelectedClient(null); }}
            >
              <KeyRound className="h-4 w-4" />
              Reset Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
