"use client";

import { useState, useEffect } from "react";
import { getAuthHeaders } from "@/store/authStore";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";

type Row = {
    id: string;
    name: string;
    description: string | null;
    product_code: string;
    group: string | null;
    minPrice: number | null;
};

export default function PriceListPage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        let cancelled = false;

        fetch(`${API_BASE}/pricelist`, { headers: getAuthHeaders() })
            .then((res) => res.json())
            .then((json: { success: boolean; data?: { rows: Row[] } }) => {
                if (!cancelled && json.success && json.data) {
                    setRows(json.data.rows);
                }
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, []);

    const q = search.trim().toLowerCase();
    const filtered = q
        ? rows.filter(
              (r) =>
                  r.name.toLowerCase().includes(q) ||
                  (r.group?.toLowerCase().includes(q) ?? false) ||
                  r.product_code.toLowerCase().includes(q)
          )
        : rows;

    // Group into sections
    const sections: { label: string; rows: Row[] }[] = [];
    const seen = new Map<string, Row[]>();
    for (const r of filtered) {
        const key = r.group ?? "__standalone__";
        if (!seen.has(key)) seen.set(key, []);
        seen.get(key)!.push(r);
    }
    for (const [key, sRows] of seen) {
        sections.push({ label: key === "__standalone__" ? "Other Products" : key, rows: sRows });
    }

    return (
        <div className="min-h-[calc(100vh-68px)] bg-[#f8f7f4]">
            {/* Hero */}
            <div className="relative overflow-hidden bg-[#0f172a] px-6 py-10 sm:py-12">
                <div className="hero-grid-overlay pointer-events-none absolute inset-0" />
                <div className="relative max-w-5xl mx-auto">
                    <span className="inline-block mb-2 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[0.68rem] font-bold tracking-[0.12em] uppercase">
                        B2B Rates
                    </span>
                    <h1 className="font-serif text-3xl sm:text-4xl font-black text-white leading-tight">
                        Price List
                    </h1>
                    <p className="mt-1.5 text-slate-400 text-sm max-w-xl">
                        All available products with B2B pricing. Click any product to configure and place your order.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* Search */}
                <div className="mb-6 relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by product name, category or code…"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 transition-all shadow-sm"
                    />
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
                        <div className="h-10 bg-slate-100" />
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-14 border-t border-slate-50 flex items-center px-5 gap-4">
                                <div className="h-3 w-40 bg-slate-100 rounded" />
                                <div className="h-3 w-20 bg-slate-100 rounded ml-auto" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                        <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                        </svg>
                        <p className="font-semibold text-slate-500">{q ? `No products matching "${search}"` : "No products available."}</p>
                        {q && <button type="button" onClick={() => setSearch("")} className="mt-3 text-sm text-blue-600 hover:underline">Clear search</button>}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-[2fr_1fr_auto] gap-4 px-5 py-3 bg-[#0f172a] text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                            <span>Product</span>
                            <span className="hidden sm:block">Category</span>
                            <span className="text-right">Price</span>
                        </div>

                        {sections.map(({ label, rows: sRows }) => (
                            <div key={label}>
                                <div className="px-5 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <span className="text-[0.72rem] font-bold text-slate-600">{label}</span>
                                    <span className="text-[0.68rem] text-slate-400 ml-1">{sRows.length} product{sRows.length !== 1 ? "s" : ""}</span>
                                </div>

                                {sRows.map((row) => (
                                    <Link
                                        key={row.id}
                                        href={`/services/${row.id}`}
                                        className="grid grid-cols-[2fr_1fr_auto] gap-4 px-5 py-3.5 items-center border-t border-slate-50 hover:bg-amber-50/40 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-[#0f172a] leading-tight truncate">{row.name}</p>
                                            <p className="text-[0.68rem] text-slate-400 font-mono mt-0.5">{row.product_code}</p>
                                        </div>

                                        <div className="hidden sm:block">
                                            {row.group && (
                                                <span className="text-[0.72rem] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate block max-w-[120px]">
                                                    {row.group}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex justify-end">
                                            {row.minPrice !== null && row.minPrice > 0 ? (
                                                <div className="text-right">
                                                    <p className="text-[0.65rem] text-slate-400 leading-tight">from</p>
                                                    <p className="text-sm font-bold text-[#0f172a]">
                                                        NPR {row.minPrice.toLocaleString("en-NP", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-[0.72rem] font-medium text-slate-400 italic">On request</span>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ))}

                        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60">
                            <span className="text-[0.72rem] text-slate-400">
                                {filtered.length} product{filtered.length !== 1 ? "s" : ""}{q ? ` matching "${search}"` : " total"}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
