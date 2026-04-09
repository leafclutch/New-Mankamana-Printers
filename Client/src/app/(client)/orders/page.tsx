"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAuthHeaders } from "@/store/authStore";
import { getStatusColor, getStatusLabel, formatDate, formatCurrency } from "@/utils/helpers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";

const STATUS_FILTERS = [
    { label: "All Orders", value: "ALL" },
    { label: "Placed", value: "ORDER_PLACED" },
    { label: "Processing", value: "ORDER_PROCESSING" },
    { label: "Prepared", value: "ORDER_PREPARED" },
    { label: "Dispatched", value: "ORDER_DISPATCHED" },
    { label: "Delivered", value: "ORDER_DELIVERED" },
    { label: "Cancelled", value: "ORDER_CANCELLED" },
];

// Status flow for the progress indicator
const STATUS_FLOW = [
    "ORDER_PLACED",
    "ORDER_PROCESSING",
    "ORDER_PREPARED",
    "ORDER_DISPATCHED",
    "ORDER_DELIVERED",
];

const STATUS_STEP_LABELS: Record<string, string> = {
    ORDER_PLACED: "Placed",
    ORDER_PROCESSING: "Processing",
    ORDER_PREPARED: "Prepared",
    ORDER_DISPATCHED: "Dispatched",
    ORDER_DELIVERED: "Delivered",
};

interface ApiOrder {
    id: string;
    quantity: number;
    unit_price: string | number;
    final_amount: string | number;
    status: string;
    payment_status: string;
    notes?: string;
    created_at: string;
    expected_delivery_date?: string | null;
    variant: {
        variant_name: string;
        product: { name: string };
    };
    approvedDesign?: { designCode: string } | null;
}

function OrderStatusTracker({ status }: { status: string }) {
    if (status === "ORDER_CANCELLED") {
        return (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-[0.78rem] font-medium text-red-600">
                <span className="text-base">✕</span> Order Cancelled
            </div>
        );
    }
    const currentIdx = STATUS_FLOW.indexOf(status);
    return (
        <div className="flex items-center gap-1">
            {STATUS_FLOW.map((s, idx) => (
                <div key={s} className="flex items-center">
                    <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-colors ${
                            idx < currentIdx
                                ? "bg-[#1a56db] text-white"
                                : idx === currentIdx
                                ? "bg-[#1a56db] text-white ring-2 ring-[#1a56db]/30"
                                : "bg-[#e2e8f0] text-[#94a3b8]"
                        }`}
                        title={STATUS_STEP_LABELS[s]}
                    >
                        {idx < currentIdx ? "✓" : idx + 1}
                    </div>
                    {idx < STATUS_FLOW.length - 1 && (
                        <div
                            className={`h-0.5 w-5 transition-colors ${
                                idx < currentIdx ? "bg-[#1a56db]" : "bg-[#e2e8f0]"
                            }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<ApiOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch(`${API_BASE}/orders`, {
                    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    setError(data.message || "Failed to load orders");
                    return;
                }
                setOrders(data.data || []);
            } catch {
                setError("Network error. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const filtered = orders.filter((o) => {
        const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
        const matchSearch =
            search === "" ||
            o.id.toLowerCase().includes(search.toLowerCase()) ||
            o.variant.product.name.toLowerCase().includes(search.toLowerCase()) ||
            o.variant.variant_name.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    return (
        <div className="p-3 sm:p-6 md:p-10 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-7 gap-3 sm:gap-4 flex-wrap">
                <div>
                    <h1 className="text-[1.3rem] sm:text-[1.5rem] font-extrabold text-[#0f172a]">Order History</h1>
                    <p className="text-[#64748b] text-[0.9rem] mt-1">
                        Track all your printing orders and their current status.
                    </p>
                </div>
                <Link href="/orders/create" className="btn-primary w-full sm:w-auto text-center">
                    + New Order
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap mb-5 items-stretch sm:items-center">
                <div className="relative mb-2 sm:mb-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[0.9rem]">🔍</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search orders…"
                        aria-label="Search orders"
                        className="form-input w-full sm:w-[220px] pl-9 py-2 pr-3.5"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.value}
                            type="button"
                            onClick={() => setStatusFilter(f.value)}
                            className={`py-1.5 px-3.5 rounded-[50px] font-semibold text-[0.8rem] cursor-pointer whitespace-nowrap transition ${
                                statusFilter === f.value
                                    ? "border-none bg-gradient-to-r from-[#1a56db] to-[#2563eb] text-white"
                                    : "border-[1.5px] border-[#e2e8f0] bg-white text-[#475569] hover:bg-gray-50"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cancel notice */}
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <span className="mt-0.5 text-amber-500">ℹ</span>
                <p className="text-[0.82rem] text-amber-800">
                    To cancel an order, please contact{" "}
                    <strong>New Mankamana Printers</strong> directly. Clients cannot cancel orders online.
                </p>
            </div>

            {/* Loading / Error */}
            {loading && (
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center text-[#94a3b8]">
                    Loading orders…
                </div>
            )}
            {error && !loading && (
                <div className="bg-white rounded-2xl border border-red-200 p-8 text-center text-red-500">
                    {error}
                </div>
            )}

            {/* Table — md+ */}
            {!loading && !error && (
                <>
                    <div className="hidden md:block">
                        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-x-auto">
                            <table className="w-full border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] text-left text-[0.78rem] uppercase tracking-[0.04em]">
                                        <th className="p-4 font-bold">Order</th>
                                        <th className="p-4 font-bold">Product</th>
                                        <th className="p-4 font-bold">Qty</th>
                                        <th className="p-4 font-bold">Amount</th>
                                        <th className="p-4 font-bold">Payment</th>
                                        <th className="p-4 font-bold">Status</th>
                                        <th className="p-4 font-bold">Est. Delivery</th>
                                        <th className="p-4 font-bold">Placed On</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e2e8f0]">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center p-12 text-[#94a3b8]">
                                                No orders found
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((order) => (
                                            <tr key={order.id} className="hover:bg-[#f8fafc] transition-colors">
                                                <td className="p-4">
                                                    <p className="text-[#1a56db] font-mono font-bold text-[0.75rem]">
                                                        #{order.id.slice(0, 8)}
                                                    </p>
                                                    <div className="mt-1.5">
                                                        <OrderStatusTracker status={order.status} />
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <p className="font-semibold text-[#0f172a] text-[0.88rem]">
                                                        {order.variant.product.name}
                                                    </p>
                                                    <p className="text-[#475569] text-[0.78rem]">
                                                        {order.variant.variant_name}
                                                    </p>
                                                    {order.approvedDesign && (
                                                        <p className="text-[0.72rem] text-[#64748b] mt-0.5">
                                                            Design: <span className="font-mono font-semibold">{order.approvedDesign.designCode}</span>
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="p-4 text-[#475569]">
                                                    {order.quantity.toLocaleString()}
                                                </td>
                                                <td className="p-4 text-[#0f172a] font-semibold text-[0.85rem]">
                                                    {formatCurrency(order.final_amount)}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-0.5 rounded text-[0.72rem] font-semibold ${
                                                        order.payment_status === "PROOF_SUBMITTED"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : order.payment_status === "CONFIRMED"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-100 text-gray-600"
                                                    }`}>
                                                        {order.payment_status.replace(/_/g, " ")}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[0.75rem] font-semibold ${getStatusColor(order.status)}`}>
                                                        {getStatusLabel(order.status)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-[0.82rem]">
                                                    {order.expected_delivery_date ? (
                                                        <span className="text-[#0f172a] font-medium">
                                                            {new Date(order.expected_delivery_date).toLocaleDateString("en-NP", {
                                                                day: "numeric", month: "short", year: "numeric"
                                                            })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[#94a3b8]">—</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-[#64748b] text-[0.82rem]">
                                                    {formatDate(order.created_at)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Cards — mobile */}
                    <div className="md:hidden flex flex-col gap-3">
                        {filtered.length === 0 ? (
                            <div className="bg-white text-[#94a3b8] text-center p-8 rounded-2xl border border-[#e2e8f0]">
                                No orders found
                            </div>
                        ) : (
                            filtered.map((order) => (
                                <div
                                    key={order.id}
                                    className={`bg-white rounded-2xl border p-4 flex flex-col gap-3 shadow-sm ${
                                        order.status === "ORDER_CANCELLED"
                                            ? "border-red-100"
                                            : "border-[#e2e8f0]"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-[#1a56db] text-[0.8rem] font-bold">
                                            #{order.id.slice(0, 8)}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-full text-[0.75rem] font-semibold ${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>

                                    {/* Status tracker */}
                                    <OrderStatusTracker status={order.status} />

                                    <div className="font-extrabold text-[#0f172a] text-[1rem]">
                                        {order.variant.product.name}
                                    </div>
                                    <div className="text-[0.82rem] text-[#475569]">{order.variant.variant_name}</div>

                                    <div className="flex flex-wrap gap-4 text-[0.8rem] text-[#475569]">
                                        <div>
                                            <span className="block font-medium text-[0.72rem] text-[#94a3b8]">Qty</span>
                                            <span>{order.quantity.toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="block font-medium text-[0.72rem] text-[#94a3b8]">Amount</span>
                                            <span className="font-semibold">{formatCurrency(order.final_amount)}</span>
                                        </div>
                                        <div>
                                            <span className="block font-medium text-[0.72rem] text-[#94a3b8]">Payment</span>
                                            <span>{order.payment_status.replace(/_/g, " ")}</span>
                                        </div>
                                        {order.expected_delivery_date && (
                                            <div>
                                                <span className="block font-medium text-[0.72rem] text-[#94a3b8]">Est. Delivery</span>
                                                <span className="font-medium text-[#0f172a]">
                                                    {new Date(order.expected_delivery_date).toLocaleDateString("en-NP", {
                                                        day: "numeric", month: "short", year: "numeric"
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {order.approvedDesign && (
                                        <div className="text-[0.78rem] text-[#64748b]">
                                            Design: <span className="font-mono font-semibold">{order.approvedDesign.designCode}</span>
                                        </div>
                                    )}
                                    <div className="text-[0.78rem] text-[#94a3b8]">
                                        Placed: {formatDate(order.created_at)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <p className="text-right mt-4 text-[0.78rem] text-[#94a3b8]">
                        Showing {filtered.length} of {orders.length} orders
                    </p>
                </>
            )}
        </div>
    );
}
