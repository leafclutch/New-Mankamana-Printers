"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthHeaders } from "@/store/authStore";
import { fetchJsonCached, registerFocusRevalidation, startBackgroundRefresh } from "@/utils/requestCache";
import { normalizeImageUrl } from "@/utils/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";

interface ProductGroup {
    id: string;
    group_code: string;
    name: string;
    description: string | null;
    image_url: string | null;
    product_count: number;
    type: "group";
}

interface StandaloneProduct {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    production_days: number;
    product_code: string;
    type: "product";
}

interface FlatProduct {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    production_days: number;
    product_code: string;
}

type CatalogItem = ProductGroup | StandaloneProduct;

function CatalogPreviewImage({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
    const [failed, setFailed] = useState(false);
    const safeUrl = normalizeImageUrl(imageUrl);

    if (!safeUrl || failed) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-3 text-center">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    No preview available
                </p>
            </div>
        );
    }

    return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
            src={safeUrl}
            alt={alt}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setFailed(true)}
        />
    );
}

function SkeletonCard() {
    return (
        <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
            <div className="aspect-[4/3] bg-slate-100" />
            <div className="p-5 space-y-3">
                <div className="h-5 bg-slate-100 rounded-lg w-3/5" />
                <div className="h-3.5 bg-slate-50 rounded-lg w-4/5" />
                <div className="h-3.5 bg-slate-50 rounded-lg w-2/5" />
                <div className="h-10 bg-slate-100 rounded-xl mt-4" />
            </div>
        </div>
    );
}

function GroupCard({ item }: { item: ProductGroup }) {
    return (
        <Link
            href={`/services/group/${item.id}`}
            className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
        >
            <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
                <CatalogPreviewImage imageUrl={item.image_url} alt={item.name} />
                <span className="absolute top-3 left-3 bg-amber-400 text-[#0f172a] text-[0.62rem] font-black tracking-[0.1em] uppercase px-2 py-0.5 rounded-md shadow-sm">
                    B2B
                </span>
                <span className="absolute top-3 right-3 bg-slate-900/70 text-white text-[0.62rem] font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm">
                    {item.product_count} {item.product_count === 1 ? "style" : "styles"}
                </span>
            </div>
            <div className="flex flex-col flex-1 p-5">
                <h3 className="font-bold text-[1rem] text-slate-900 leading-snug mb-1.5 group-hover:text-[#1a56db] transition-colors">
                    {item.name}
                </h3>
                {item.description && (
                    <p className="text-[0.82rem] text-slate-400 leading-relaxed line-clamp-2 mb-3">
                        {item.description}
                    </p>
                )}
                <div className="mt-auto flex items-center justify-end pt-3 border-t border-slate-50">
                    <span className="flex items-center gap-1 text-blue-600 text-[0.8rem] font-semibold group-hover:gap-2 transition-all">
                        View options
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
}

function ProductCard({ item }: { item: StandaloneProduct }) {
    return (
        <Link
            href={`/services/${item.id}`}
            className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
        >
            <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
                <CatalogPreviewImage imageUrl={item.image_url} alt={item.name} />
                <span className="absolute top-3 left-3 bg-amber-400 text-[#0f172a] text-[0.62rem] font-black tracking-[0.1em] uppercase px-2 py-0.5 rounded-md shadow-sm">
                    B2B
                </span>
            </div>
            <div className="flex flex-col flex-1 p-5">
                <h3 className="font-bold text-[1rem] text-slate-900 leading-snug mb-1.5 group-hover:text-[#1a56db] transition-colors">
                    {item.name}
                </h3>
                {item.description && (
                    <p className="text-[0.82rem] text-slate-400 leading-relaxed line-clamp-2 mb-3">
                        {item.description}
                    </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[0.75rem]">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{item.production_days} day{item.production_days !== 1 ? "s" : ""}</span>
                    </div>
                    <span className="flex items-center gap-1 text-blue-600 text-[0.8rem] font-semibold group-hover:gap-2 transition-all">
                        Order now
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
}

type CatalogResponse = { success: boolean; data?: { groups: ProductGroup[]; products: StandaloneProduct[] } };

export default function ServicesPage() {
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [allProducts, setAllProducts] = useState<FlatProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const CATALOG_KEY = "catalog-browse";
        const CATALOG_URL = `${API_BASE}/catalog`;
        const init = { headers: getAuthHeaders() };
        let lastResponse: CatalogResponse | null = null;

        const applyData = (d: CatalogResponse) => {
            if (!d.success || !d.data) return;
            lastResponse = d;
            setItems([...d.data.groups, ...d.data.products]);
            d.data.products.forEach((p) => {
                fetchJsonCached<unknown>(`catalog-product-${p.id}`, `${API_BASE}/products/${p.id}`, init, 60_000).catch(() => {});
                fetchJsonCached<unknown>(`catalog-variants-${p.id}`, `${API_BASE}/products/${p.id}/variants`, init, 60_000).catch(() => {});
            });
        };

        fetchJsonCached<CatalogResponse>(CATALOG_KEY, CATALOG_URL, init, 60_000)
            .then(applyData)
            .catch(() => {})
            .finally(() => setLoading(false));

        // Fetch ALL products (flat) for deep search across group contents
        fetchJsonCached<{ success: boolean; data?: FlatProduct[] }>(
            "all-products-flat", `${API_BASE}/products`, init, 60_000
        )
            .then((d) => { if (d.success && d.data) setAllProducts(d.data); })
            .catch(() => {});

        const deregister = registerFocusRevalidation<CatalogResponse>(
            CATALOG_KEY, CATALOG_URL, init, 60_000, applyData
        );
        const stopBg = startBackgroundRefresh<CatalogResponse>(
            CATALOG_KEY, CATALOG_URL, init, 60_000,
            () => lastResponse as CatalogResponse,
            applyData
        );
        return () => { deregister(); stopBg(); };
    }, []);

    return (
        <div className="min-h-[calc(100vh-72px)] bg-[#f8f7f4]">
            {/* Hero header */}
            <div className="relative overflow-hidden bg-[#0f172a] px-6 py-14 sm:px-10 sm:py-20">
                <div className="hero-grid-overlay pointer-events-none absolute inset-0" />
                <div className="relative max-w-4xl mx-auto text-center">
                    <span className="inline-block mb-4 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[0.72rem] font-bold tracking-[0.15em] uppercase">
                        B2B Wholesale Rates
                    </span>
                    <h1 className="font-serif text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.1]">
                        Printing Services
                    </h1>
                    <p className="mt-4 text-slate-400 text-[0.95rem] max-w-xl mx-auto leading-relaxed">
                        Premium quality, trade pricing. Select a service to configure your order.
                    </p>
                </div>
            </div>

            {/* Catalog grid */}
            <div className="w-full px-5 sm:px-8 xl:px-12 py-10">
                {/* Search bar */}
                <div className="mb-7 relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products…"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 transition-all shadow-sm"
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
                    </div>
                ) : (() => {
                    const q = search.trim().toLowerCase();

                    if (!q) {
                        if (items.length === 0) return (
                            <div className="text-center py-24">
                                <p className="text-slate-500 font-medium">No services available at the moment.</p>
                            </div>
                        );
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {items.map((item) =>
                                    item.type === "group" ? (
                                        <GroupCard key={item.id} item={item} />
                                    ) : (
                                        <ProductCard key={item.id} item={item} />
                                    )
                                )}
                            </div>
                        );
                    }

                    // Deep search: match catalog items AND individual products inside groups
                    const matchedCatalog = items.filter((item) => item.name.toLowerCase().includes(q));
                    const standaloneIds = new Set(items.filter((i) => i.type === "product").map((i) => i.id));
                    // Products inside groups that aren't already shown as top-level items
                    const matchedDeep = allProducts.filter(
                        (p) => !standaloneIds.has(p.id) && p.name.toLowerCase().includes(q)
                    );

                    if (matchedCatalog.length === 0 && matchedDeep.length === 0) return (
                        <div className="text-center py-24">
                            <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
                            <p className="text-slate-500 font-medium">No results for &ldquo;{search}&rdquo;</p>
                            <button type="button" onClick={() => setSearch("")} className="mt-3 text-sm text-blue-600 hover:underline">Clear search</button>
                        </div>
                    );

                    return (
                        <div>
                            {matchedCatalog.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {matchedCatalog.map((item) =>
                                        item.type === "group" ? (
                                            <GroupCard key={item.id} item={item} />
                                        ) : (
                                            <ProductCard key={item.id} item={item} />
                                        )
                                    )}
                                </div>
                            )}
                            {matchedDeep.length > 0 && (
                                <>
                                    {matchedCatalog.length > 0 && (
                                        <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-slate-400 mt-8 mb-4">Also inside groups</p>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {matchedDeep.map((p) => (
                                            <Link
                                                key={p.id}
                                                href={`/services/${p.id}`}
                                                className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                                            >
                                                <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
                                                    <CatalogPreviewImage imageUrl={p.image_url} alt={p.name} />
                                                    <span className="absolute top-3 left-3 bg-amber-400 text-[#0f172a] text-[0.62rem] font-black tracking-[0.1em] uppercase px-2 py-0.5 rounded-md shadow-sm">B2B</span>
                                                </div>
                                                <div className="flex flex-col flex-1 p-5">
                                                    <h3 className="font-bold text-[1rem] text-slate-900 leading-snug mb-1.5 group-hover:text-[#1a56db] transition-colors">{p.name}</h3>
                                                    {p.description && (
                                                        <p className="text-[0.82rem] text-slate-400 leading-relaxed line-clamp-2 mb-3">{p.description}</p>
                                                    )}
                                                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-50">
                                                        <div className="flex items-center gap-1.5 text-slate-400 text-[0.75rem]">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            <span>{p.production_days} day{p.production_days !== 1 ? "s" : ""}</span>
                                                        </div>
                                                        <span className="flex items-center gap-1 text-blue-600 text-[0.8rem] font-semibold group-hover:gap-2 transition-all">
                                                            Order now
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
