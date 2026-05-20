"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, MousePointerClick, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { listProducts, listServices } from "./service";
import { listGroups, listMachineryProducts } from "./machinery-service";
import { ProductList } from "./components/ProductList";
import { ProductEditor } from "./components/ProductEditor";
import { MachineryList } from "./components/MachineryList";
import { MachineryEditor } from "./components/MachineryEditor";
import type { Product, Service } from "./types";
import type { MachineryGroup, MachineryProduct } from "./machinery-types";

type Tab = "printing" | "machinery";

function ProductAdderContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab: Tab = (searchParams.get("tab") as Tab) === "machinery" ? "machinery" : "printing";

  // ── Printing state ────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedPrintingId, setSelectedPrintingId] = useState<string | null>(null);
  const [loadingPrinting, setLoadingPrinting] = useState(true);

  // ── Machinery state ───────────────────────────────────────────────────────
  const [groups, setGroups] = useState<MachineryGroup[]>([]);
  const [machineryProducts, setMachineryProducts] = useState<MachineryProduct[]>([]);
  const [selectedMachineryId, setSelectedMachineryId] = useState<string | null>(null);
  const [loadingMachinery, setLoadingMachinery] = useState(true);

  // ── Load printing ─────────────────────────────────────────────────────────
  const loadPrinting = useCallback(async () => {
    setLoadingPrinting(true);
    try {
      const [prods, svcs] = await Promise.all([listProducts(), listServices()]);
      setProducts(prods);
      setServices(svcs);
      setSelectedPrintingId(prev => prev ?? prods[0]?.id ?? null);
    } catch (e) {
      toast({ title: "Failed to load printing products", description: (e as Error).message, variant: "destructive" });
    } finally { setLoadingPrinting(false); }
  }, [toast]);

  // ── Load machinery ────────────────────────────────────────────────────────
  const loadMachinery = useCallback(async () => {
    setLoadingMachinery(true);
    try {
      const [grps, mprods] = await Promise.all([listGroups(), listMachineryProducts()]);
      setGroups(grps);
      setMachineryProducts(mprods);
      setSelectedMachineryId(prev => prev ?? mprods[0]?.id ?? null);
    } catch (e) {
      toast({ title: "Failed to load machinery", description: (e as Error).message, variant: "destructive" });
    } finally { setLoadingMachinery(false); }
  }, [toast]);

  useEffect(() => { loadPrinting(); }, [loadPrinting]);
  useEffect(() => { loadMachinery(); }, [loadMachinery]);

  // ── Printing handlers ─────────────────────────────────────────────────────
  function handlePrintingCreated(p: Product) {
    setProducts(prev => [p, ...prev]);
    setSelectedPrintingId(p.id);
  }
  function handlePrintingDeleted(id: string) {
    const remaining = products.filter(p => p.id !== id);
    setProducts(remaining);
    setSelectedPrintingId(prev => prev === id ? (remaining[0]?.id ?? null) : prev);
  }
  function handlePrintingUpdated(updated: Product) {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  }

  // ── Machinery handlers ────────────────────────────────────────────────────
  function handleMachineryCreated(p: MachineryProduct) {
    setMachineryProducts(prev => [p, ...prev]);
    setSelectedMachineryId(p.id);
  }
  function handleMachineryDeleted(id: string) {
    const remaining = machineryProducts.filter(p => p.id !== id);
    setMachineryProducts(remaining);
    setSelectedMachineryId(prev => prev === id ? (remaining[0]?.id ?? null) : prev);
  }
  function handleMachineryUpdated(updated: MachineryProduct) {
    setMachineryProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  }
  function handleGroupCreated(g: MachineryGroup) {
    setGroups(prev => [...prev, g]);
  }

  const selectedPrinting = products.find(p => p.id === selectedPrintingId) ?? null;
  const selectedMachinery = machineryProducts.find(p => p.id === selectedMachineryId) ?? null;

  function switchTab(t: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    if (t === "printing") params.delete("tab");
    else params.set("tab", t);
    router.push(`/product_adder${params.toString() ? `?${params}` : ""}`);
  }

  const isLoading = tab === "printing" ? loadingPrinting : loadingMachinery;

  return (
    <div className="space-y-5 h-full">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0061FF]">Catalog</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Products</h1>
        <p className="mt-1 text-sm text-slate-500">
          {tab === "printing"
            ? "Create and manage printing products, options, and prices."
            : "Create and manage machinery products, options, and pricing combinations."}
        </p>

        {/* Tab switcher */}
        <div className="mt-4 flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 w-fit">
          <button
            type="button"
            onClick={() => switchTab("printing")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "printing"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Printing Services
          </button>
          <button
            type="button"
            onClick={() => switchTab("machinery")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "machinery"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Machinery
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : tab === "printing" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900 min-h-[560px]">
          <div className="border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            <ProductList
              products={products}
              services={services}
              selectedId={selectedPrintingId}
              onSelect={setSelectedPrintingId}
              onCreated={handlePrintingCreated}
              onDeleted={handlePrintingDeleted}
            />
          </div>
          <div>
            {selectedPrinting ? (
              <ProductEditor
                key={selectedPrinting.id}
                product={selectedPrinting}
                services={services}
                onUpdated={handlePrintingUpdated}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400 py-24">
                <MousePointerClick className="h-10 w-10 opacity-30" />
                <p className="text-sm">Select a product on the left, or create a new one.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900 min-h-[560px]">
          <div className="border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            <MachineryList
              products={machineryProducts}
              groups={groups}
              selectedId={selectedMachineryId}
              onSelect={setSelectedMachineryId}
              onCreated={handleMachineryCreated}
              onDeleted={handleMachineryDeleted}
              onGroupCreated={handleGroupCreated}
            />
          </div>
          <div>
            {selectedMachinery ? (
              <MachineryEditor
                key={selectedMachinery.id}
                product={selectedMachinery}
                groups={groups}
                onUpdated={handleMachineryUpdated}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400 py-24">
                <Settings2 className="h-10 w-10 opacity-30" />
                <p className="text-sm">Select a machinery product on the left, or create a new one.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductAdderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    }>
      <ProductAdderContent />
    </Suspense>
  );
}
