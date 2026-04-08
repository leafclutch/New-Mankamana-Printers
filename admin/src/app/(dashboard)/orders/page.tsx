"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  Package,
  Clock,
  CheckCircle2,
  Printer,
  Truck,
  RefreshCw,
} from "lucide-react";

type OrderStatus =
  | "ORDER_PLACED"
  | "ORDER_PROCESSING"
  | "ORDER_PREPARED"
  | "ORDER_DISPATCHED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED";

interface Order {
  id: string;
  status: OrderStatus;
  final_amount: number;
  quantity: number;
  payment_status: string;
  created_at: string;
  client?: {
    business_name: string;
    client_code?: string;
  };
  variant?: {
    variant_name: string;
    product?: { name: string };
  };
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  ORDER_PLACED: "Placed",
  ORDER_PROCESSING: "Processing",
  ORDER_PREPARED: "Prepared",
  ORDER_DISPATCHED: "Dispatched",
  ORDER_DELIVERED: "Delivered",
  ORDER_CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  ORDER_PLACED: "bg-slate-100 text-slate-700",
  ORDER_PROCESSING: "bg-blue-100 text-blue-700",
  ORDER_PREPARED: "bg-indigo-100 text-indigo-700",
  ORDER_DISPATCHED: "bg-amber-100 text-amber-700",
  ORDER_DELIVERED: "bg-emerald-100 text-emerald-700",
  ORDER_CANCELLED: "bg-red-100 text-red-700",
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  ORDER_PLACED: "ORDER_PROCESSING",
  ORDER_PROCESSING: "ORDER_PREPARED",
  ORDER_PREPARED: "ORDER_DISPATCHED",
  ORDER_DISPATCHED: "ORDER_DELIVERED",
};

export default function OrderManagementPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load orders");
      const data = Array.isArray(json) ? json : json.data ?? [];
      setOrders(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleAdvanceStatus = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdatingId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update status");
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: next } : o))
      );
      toast({ title: "Status Updated", description: `Order moved to ${STATUS_LABELS[next]}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const clientName = order.client?.business_name ?? "";
    const productName = order.variant?.product?.name ?? order.variant?.variant_name ?? "";
    const matchesSearch =
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeStatuses: OrderStatus[] = ["ORDER_PLACED", "ORDER_PROCESSING", "ORDER_PREPARED", "ORDER_DISPATCHED"];
  const stats = {
    total: orders.length,
    active: orders.filter((o) => activeStatuses.includes(o.status)).length,
    prepared: orders.filter((o) => o.status === "ORDER_PREPARED").length,
    delivered: orders.filter((o) => o.status === "ORDER_DELIVERED").length,
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0061FF]">Fulfillment</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Order Management</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track and manage print orders from placement to delivery.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Orders", value: stats.total, icon: Package, color: "bg-slate-100 text-slate-600" },
          { label: "In Production", value: stats.active, icon: Printer, color: "bg-blue-100 text-blue-600" },
          { label: "Ready / Prepared", value: stats.prepared, icon: Truck, color: "bg-indigo-100 text-indigo-600" },
          { label: "Completed", value: stats.delivered, icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
                </div>
                <div className={`rounded-full p-3 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Orders</CardTitle>
              <div className="flex gap-1 rounded-lg border border-slate-200 p-1 dark:border-slate-800">
                {["All", "ORDER_PLACED", "ORDER_PROCESSING", "ORDER_DELIVERED"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                      statusFilter === s
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    {s === "All" ? "All" : STATUS_LABELS[s as OrderStatus]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-[#0061FF] focus:ring-1 focus:ring-[#0061FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" size="icon" onClick={fetchOrders} title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Loading orders...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Order ID</th>
                    <th className="px-6 py-4 font-semibold">Client</th>
                    <th className="px-6 py-4 font-semibold">Product</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 font-mono text-xs font-medium text-slate-900 dark:text-white">
                          {order.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {order.client?.business_name ?? "—"}
                          </div>
                          <div className="text-xs text-slate-500">{order.client?.client_code ?? ""}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {order.variant?.product?.name ?? order.variant?.variant_name ?? "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          NPR {Number(order.final_amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {NEXT_STATUS[order.status] ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingId === order.id}
                              onClick={() => handleAdvanceStatus(order)}
                              className="text-xs"
                            >
                              {updatingId === order.id
                                ? "Updating..."
                                : `Mark ${STATUS_LABELS[NEXT_STATUS[order.status]!]}`}
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
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
    </div>
  );
}
