"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, UserPlus, Palette, RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface RegistrationItem {
  id: string;
  business_name: string;
  owner_name: string;
  phone_number: string;
  email: string;
  status: string;
  createdAt: string;
}

interface DesignItem {
  submissionId: string;
  title: string | null;
  status: string;
  client: { id: string; name: string; phone: string } | null;
  submittedAt: string;
  fileUrl?: string;
}

type NotifItem =
  | { kind: "registration"; data: RegistrationItem }
  | { kind: "design"; data: DesignItem };

export default function NotificationsPage() {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [regRes, designRes] = await Promise.all([
        fetch("/api/admin/registration-requests", { cache: "no-store" }),
        fetch("/api/admin/designs/submissions", { cache: "no-store" }),
      ]);

      const regJson = regRes.ok ? await regRes.json() : null;
      const designJson = designRes.ok ? await designRes.json() : null;

      const registrations: RegistrationItem[] = (
        Array.isArray(regJson?.data) ? regJson.data : []
      ).filter((r: RegistrationItem) => r.status === "PENDING");

      const designs: DesignItem[] = (
        Array.isArray(designJson?.data?.items) ? designJson.data.items : []
      ).filter((d: DesignItem) => d.status === "PENDING_REVIEW");

      const combined: NotifItem[] = [
        ...registrations.map((r): NotifItem => ({ kind: "registration", data: r })),
        ...designs.map((d): NotifItem => ({ kind: "design", data: d })),
      ].sort((a, b) => {
        const aDate = a.kind === "registration" ? a.data.createdAt : a.data.submittedAt;
        const bDate = b.kind === "registration" ? b.data.createdAt : b.data.submittedAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      setItems(combined);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const regCount = items.filter((i) => i.kind === "registration").length;
  const designCount = items.filter((i) => i.kind === "design").length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0061FF]">Pending Actions</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          All items awaiting your review — registrations and design submissions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Total Pending", value: items.length, icon: Bell, color: "text-[#0061FF]" },
          { label: "Registrations", value: regCount, icon: UserPlus, color: "text-amber-500" },
          { label: "Design Reviews", value: designCount, icon: Palette, color: "text-purple-500" },
        ].map((stat) => (
          <Card key={stat.label} className="border-slate-200/80 shadow-sm dark:border-slate-800">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{loading ? "—" : stat.value}</p>
              </div>
              <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notification list */}
      <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Pending Items</CardTitle>
            <Button type="button" variant="outline" size="icon" onClick={fetchAll} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Loading notifications…</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <CheckCircle className="h-12 w-12 text-emerald-400" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">All caught up!</p>
              <p className="text-sm">No pending registrations or design submissions.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, idx) => {
                if (item.kind === "registration") {
                  const r = item.data;
                  return (
                    <li key={`reg-${r.id}`} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <UserPlus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{r.business_name}</p>
                          <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                            New Registration
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{r.owner_name} · {r.phone_number} · {r.email}</p>
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {new Date(r.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <Link href="/registration-requests">
                        <Button type="button" size="sm" className="shrink-0 bg-[#0061FF] hover:bg-[#0050d5] text-white text-xs">
                          Review
                        </Button>
                      </Link>
                    </li>
                  );
                } else {
                  const d = item.data;
                  return (
                    <li key={`design-${d.submissionId}`} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">
                            {d.title || "Untitled Design"}
                          </p>
                          <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">
                            Design Submission
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {d.client?.name || "Unknown client"} · {d.client?.phone || ""}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {new Date(d.submittedAt).toLocaleString()}
                        </div>
                      </div>
                      <Link href="/design-approval">
                        <Button type="button" size="sm" className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white text-xs">
                          Review
                        </Button>
                      </Link>
                    </li>
                  );
                }
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
