"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAuthHeaders } from "@/store/authStore";
import { fetchJsonCached } from "@/utils/requestCache";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";

type ModuleKey = "PRINTING" | "MACHINERY";

type Row = {
    id: string;
    name: string;
    description: string | null;
    product_code: string;
    module?: ModuleKey;
    group: string | null;
    minPrice: number | null;
};

type ModuleTab = {
    key: ModuleKey;
    label: string;
    rows: Row[];
    productCount: number;
    pricedCount: number;
};

type PricelistPayload = {
    rows?: Row[];
    moduleTabs?: ModuleTab[];
    computedAt?: number;
    refreshHours?: number;
};

type PricelistResponse = {
    success: boolean;
    data?: PricelistPayload;
};

const normalizeModule = (value: unknown): ModuleKey => (value === "MACHINERY" ? "MACHINERY" : "PRINTING");

const buildModuleTab = (key: ModuleKey, label: string, rows: Row[]): ModuleTab => {
    const filtered = rows.filter((row) => row.module === key);
    return {
        key,
        label,
        rows: filtered,
        productCount: filtered.length,
        pricedCount: filtered.filter((row) => row.minPrice !== null && row.minPrice > 0).length,
    };
};

const normalizePayload = (payload?: PricelistPayload): Required<Pick<PricelistPayload, "rows" | "moduleTabs">> & { computedAt: number | null; refreshHours: number | null } => {
    const rows = (payload?.rows ?? []).map((row) => ({
        ...row,
        module: normalizeModule(row.module),
    }));

    const tabsFromServer = (payload?.moduleTabs ?? []).map((tab) => ({
        ...tab,
        key: normalizeModule(tab.key),
        rows: (tab.rows ?? []).map((row) => ({ ...row, module: normalizeModule(row.module ?? tab.key) })),
    }));

    const hasPrinting = tabsFromServer.some((tab) => tab.key === "PRINTING");
    const hasMachinery = tabsFromServer.some((tab) => tab.key === "MACHINERY");

    const fallbackTabs = [
        buildModuleTab("PRINTING", "Printing Services", rows),
        buildModuleTab("MACHINERY", "Machinery", rows),
    ];

    const moduleTabs =
        tabsFromServer.length > 0
            ? [
                  ...(hasPrinting ? tabsFromServer.filter((tab) => tab.key === "PRINTING") : [fallbackTabs[0]]),
                  ...(hasMachinery ? tabsFromServer.filter((tab) => tab.key === "MACHINERY") : [fallbackTabs[1]]),
              ]
            : fallbackTabs;

    return {
        rows,
        moduleTabs,
        computedAt: typeof payload?.computedAt === "number" ? payload.computedAt : null,
        refreshHours: typeof payload?.refreshHours === "number" ? payload.refreshHours : null,
    };
};

export default function PriceListPage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [moduleTabs, setModuleTabs] = useState<ModuleTab[]>([]);
    const [activeTab, setActiveTab] = useState<ModuleKey>("PRINTING");
    const [computedAt, setComputedAt] = useState<number | null>(null);
    const [refreshHours, setRefreshHours] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const key = "client-pricelist-v2";
        const url = `${API_BASE}/pricelist`;
        const init = { headers: getAuthHeaders() };

        const applyData = (json: PricelistResponse) => {
            if (!json?.success) return;
            const normalized = normalizePayload(json.data);
            setRows(normalized.rows);
            setModuleTabs(normalized.moduleTabs);
            setComputedAt(normalized.computedAt);
            setRefreshHours(normalized.refreshHours);
        };

        fetchJsonCached<PricelistResponse>(key, url, init, 3 * 60 * 60 * 1000)
            .then(applyData)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (moduleTabs.length === 0) return;
        const hasActive = moduleTabs.some((tab) => tab.key === activeTab);
        if (!hasActive) setActiveTab(moduleTabs[0].key);
    }, [moduleTabs, activeTab]);

    const q = search.trim().toLowerCase();
    const activeRows = useMemo(() => {
        const tabRows = moduleTabs.find((tab) => tab.key === activeTab)?.rows ?? [];
        if (!q) return tabRows;
        return tabRows.filter(
            (row) =>
                row.name.toLowerCase().includes(q) ||
                (row.group?.toLowerCase().includes(q) ?? false) ||
                row.product_code.toLowerCase().includes(q)
        );
    }, [moduleTabs, activeTab, q]);

    const sections = useMemo(() => {
        const grouped = new Map<string, Row[]>();
        for (const row of activeRows) {
            const key = row.group ?? "__standalone__";
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(row);
        }
        return Array.from(grouped.entries()).map(([key, sectionRows]) => ({
            label: key === "__standalone__" ? "Other Products" : key,
            rows: sectionRows,
        }));
    }, [activeRows]);

    const activeTabMeta = moduleTabs.find((tab) => tab.key === activeTab) ?? null;

    return (
        <div className="min-h-[calc(100vh-68px)] bg-[#f8f7f4]">
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
                        One shared server-generated list for all clients. Updated every {refreshHours ?? "3-5"} hours.
                    </p>
                    {computedAt && (
                        <p className="mt-1 text-[0.7rem] text-slate-500">
                            Last updated: {new Date(computedAt).toLocaleString("en-NP")}
                        </p>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-4 flex gap-2 flex-wrap">
                    {moduleTabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                                activeTab === tab.key
                                    ? "bg-[#0f172a] text-white border-[#0f172a]"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            {tab.label}
                            <span className="ml-2 text-[0.72rem] opacity-80">
                                {tab.productCount}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="mb-6 relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by product name, group or code..."
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
                ) : activeRows.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                        <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                        </svg>
                        <p className="font-semibold text-slate-500">{q ? `No products matching "${search}"` : "No products available in this tab."}</p>
                        {q && <button type="button" onClick={() => setSearch("")} className="mt-3 text-sm text-blue-600 hover:underline">Clear search</button>}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-[minmax(0,2fr)_auto] gap-3 px-5 py-3 bg-[#0f172a] text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400 sm:grid-cols-[2fr_1fr_auto] sm:gap-4">
                            <span>Product</span>
                            <span className="hidden sm:block">Group</span>
                            <span className="text-right">Price</span>
                        </div>

                        {sections.map(({ label, rows: sectionRows }) => (
                            <div key={label}>
                                <div className="px-5 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <span className="text-[0.72rem] font-bold text-slate-600">{label}</span>
                                    <span className="text-[0.68rem] text-slate-400 ml-1">{sectionRows.length} product{sectionRows.length !== 1 ? "s" : ""}</span>
                                </div>

                                {sectionRows.map((row) => (
                                    <Link
                                        key={row.id}
                                        href={row.module === "MACHINERY" ? `/machinery/${row.id}` : `/services/${row.id}`}
                                        className="grid grid-cols-[minmax(0,2fr)_auto] gap-3 px-5 py-3.5 items-center border-t border-slate-50 transition-colors hover:bg-amber-50/40 sm:grid-cols-[2fr_1fr_auto] sm:gap-4"
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
                                {activeRows.length} product{activeRows.length !== 1 ? "s" : ""}{q ? ` matching "${search}"` : ""}
                                {activeTabMeta ? ` in ${activeTabMeta.label}` : ""}
                            </span>
                            <span className="text-[0.72rem] text-slate-400 ml-3">
                                Total list: {rows.length} product{rows.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
