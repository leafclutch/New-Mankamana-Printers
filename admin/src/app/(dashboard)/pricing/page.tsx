"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, Check, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAdminPricingRows,
  fetchAdminProductById,
  updateAdminPricingRow,
  type AdminProduct,
  type AdminProductField,
  type AdminService,
  type DiscountType,
  type PricingRow,
} from "@/services/catalogAdminService";
import { cachedJsonFetch } from "@/lib/requestCache";

// ── Types ─────────────────────────────────────────────────────────────────────

type RowEdit = {
  unit_price: string;
  discount_type: DiscountType;
  discount_value: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

type Tab = "printing" | "machinery";

interface MachineryGroup {
  id: string;
  name: string;
  description?: string | null;
}

interface MachineryProduct {
  id: string;
  name: string;
  product_code: string;
  group_id: string;
}

interface MachineryPricingRow {
  id: string;
  unit_price?: number | null;
  discount_type?: DiscountType;
  discount_value?: number | null;
  selected_options?: Array<{ field_id: string; value: string; display_value?: string }>;
  combination?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const selectCls =
  "flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800 dark:focus-visible:ring-slate-300";

const safeJson = async (r: Response) => {
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { message: text }; }
};

function unwrapArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "data" in payload) {
    const d = (payload as { data: unknown }).data;
    if (Array.isArray(d)) return d as T[];
  }
  return [];
}

function renderMachineryCombo(row: MachineryPricingRow): string {
  if (row.combination) return row.combination;
  if (!row.selected_options || row.selected_options.length === 0) return "—";
  return row.selected_options.map((o) => o.display_value || o.value).join(" · ");
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PricingPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("printing");

  // ── Printing Services state ────────────────────────────────────────────────
  const [services, setServices] = useState<AdminService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [pricingFields, setPricingFields] = useState<AdminProductField[]>([]);
  const [pricingRows, setPricingRows] = useState<PricingRow[]>([]);
  const [isPrintingLoading, setIsPrintingLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [printingRowEdits, setPrintingRowEdits] = useState<Record<string, RowEdit>>({});
  const printingRowEditsRef = useRef<Record<string, RowEdit>>({});
  const [printingSaveStates, setPrintingSaveStates] = useState<Record<string, SaveState>>({});
  const printingDebounce = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Machinery state ────────────────────────────────────────────────────────
  const [machineryGroups, setMachineryGroups] = useState<MachineryGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [machineryProducts, setMachineryProducts] = useState<MachineryProduct[]>([]);
  const [selectedMachineryProductId, setSelectedMachineryProductId] = useState("");
  const [machineryRows, setMachineryRows] = useState<MachineryPricingRow[]>([]);
  const [isMachineryLoading, setIsMachineryLoading] = useState(false);
  const [machineryRowEdits, setMachineryRowEdits] = useState<Record<string, RowEdit>>({});
  const machineryRowEditsRef = useRef<Record<string, RowEdit>>({});
  const [machinerySaveStates, setMachinerySaveStates] = useState<Record<string, SaveState>>({});
  const machineryDebounce = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Cleanup timers on unmount
  useEffect(() => () => {
    Object.values(printingDebounce.current).forEach(clearTimeout);
    Object.values(machineryDebounce.current).forEach(clearTimeout);
  }, []);

  // ── Row edit helpers ───────────────────────────────────────────────────────

  const initRowEdits = (rows: Array<{ id: string; unit_price?: number | null; discount_type?: DiscountType; discount_value?: number | null }>) => {
    const edits: Record<string, RowEdit> = {};
    for (const row of rows) {
      edits[row.id] = {
        unit_price: row.unit_price?.toString() ?? "",
        discount_type: row.discount_type ?? null,
        discount_value: row.discount_value != null ? String(row.discount_value) : "",
      };
    }
    return edits;
  };

  // ── Printing Services logic ────────────────────────────────────────────────

  const unwrap = <T,>(resp: { data?: T } | T): T =>
    (Array.isArray(resp) ? resp : (resp as { data?: T }).data) as T;

  const loadServices = useCallback(async () => {
    try {
      const resp = await cachedJsonFetch<{ data?: AdminService[] } | AdminService[]>("admin-pricing-services", "/api/admin/services", 60_000);
      const data = unwrap<AdminService[]>(resp) ?? [];
      setServices(data);
      if (data.length > 0) setSelectedServiceId(data[0].id);
    } catch {
      // Non-critical — service filter degrades gracefully
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setIsPrintingLoading(true);
    try {
      const resp = await cachedJsonFetch<{ data?: AdminProduct[] } | AdminProduct[]>("admin-pricing-products", "/api/admin/products", 60_000);
      setProducts(unwrap<AdminProduct[]>(resp) ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load products.";
      toast({ title: "Load Failed", description: message, variant: "destructive" });
    } finally {
      setIsPrintingLoading(false);
    }
  }, [toast]);

  const loadPricingData = useCallback(async (productId: string) => {
    if (!productId) return;
    setIsPrintingLoading(true);
    try {
      const [product, rows] = await Promise.all([
        fetchAdminProductById(productId),
        fetchAdminPricingRows(productId),
      ]);
      const pricingFieldsOnly = (product.fields || []).filter((f) => f.is_pricing_field);
      setPricingFields(pricingFieldsOnly);
      setPricingRows(rows);
      setSelectedOptions({});
      const edits = initRowEdits(rows);
      printingRowEditsRef.current = edits;
      setPrintingRowEdits(edits);
      setPrintingSaveStates({});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load pricing rows.";
      toast({ title: "Load Failed", description: message, variant: "destructive" });
    } finally {
      setIsPrintingLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadServices(); }, [loadServices]);
  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { if (selectedProductId) loadPricingData(selectedProductId); }, [selectedProductId, loadPricingData]);

  const filteredProducts = selectedServiceId
    ? products.filter((p) => p.service_id === selectedServiceId)
    : products;

  useEffect(() => {
    if (filteredProducts.length > 0) {
      setSelectedProductId((prev) => {
        const stillValid = filteredProducts.some((p) => p.id === prev);
        return stillValid ? prev : filteredProducts[0].id;
      });
    } else {
      setSelectedProductId("");
    }
  }, [selectedServiceId, filteredProducts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const savePrintingRow = async (rowId: string) => {
    const edit = printingRowEditsRef.current[rowId];
    if (!edit) return;
    setPrintingSaveStates((prev) => ({ ...prev, [rowId]: "saving" }));
    try {
      const updated = await updateAdminPricingRow(rowId, {
        unit_price: edit.unit_price ? Number(edit.unit_price) : undefined,
        discount_type: edit.discount_type || null,
        discount_value: edit.discount_value ? Number(edit.discount_value) : undefined,
      });
      setPricingRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...updated } : r)));
      setPrintingSaveStates((prev) => ({ ...prev, [rowId]: "saved" }));
      setTimeout(() => setPrintingSaveStates((prev) => (prev[rowId] === "saved" ? { ...prev, [rowId]: "idle" } : prev)), 2000);
    } catch {
      setPrintingSaveStates((prev) => ({ ...prev, [rowId]: "error" }));
      toast({ title: "Save Failed", description: "Could not save pricing row.", variant: "destructive" });
    }
  };

  const handlePrintingFieldChange = (rowId: string, field: keyof RowEdit, value: string) => {
    const current = printingRowEditsRef.current[rowId] ?? { unit_price: "", discount_type: null, discount_value: "" };
    const newEdit: RowEdit = { ...current, [field]: value as DiscountType };
    if (field === "discount_type" && !value) newEdit.discount_value = "";
    printingRowEditsRef.current[rowId] = newEdit;
    setPrintingRowEdits((prev) => ({ ...prev, [rowId]: newEdit }));
    setPrintingSaveStates((prev) => ({ ...prev, [rowId]: "idle" }));
    clearTimeout(printingDebounce.current[rowId]);
    printingDebounce.current[rowId] = setTimeout(() => void savePrintingRow(rowId), 800);
  };

  const renderPrintingCombo = (row: PricingRow) => {
    if (!row.selected_options || row.selected_options.length === 0) return "";
    return row.selected_options.map((o) => o.display_value || o.value).join(" · ");
  };

  // ── Machinery logic ────────────────────────────────────────────────────────

  const loadMachineryGroups = useCallback(async () => {
    try {
      const r = await fetch("/product_adder/api/machinery/groups", { cache: "no-store" });
      const d = await safeJson(r);
      if (!r.ok) return;
      const groups = unwrapArray<MachineryGroup>(d);
      setMachineryGroups(groups);
      if (groups.length > 0) setSelectedGroupId(groups[0].id);
    } catch {
      // non-critical
    }
  }, []);

  const loadMachineryProducts = useCallback(async () => {
    try {
      const r = await fetch("/product_adder/api/machinery/products", { cache: "no-store" });
      const d = await safeJson(r);
      if (!r.ok) return;
      setMachineryProducts(unwrapArray<MachineryProduct>(d));
    } catch {
      // non-critical
    }
  }, []);

  const loadMachineryPricing = useCallback(async (productId: string) => {
    if (!productId) return;
    setIsMachineryLoading(true);
    try {
      const r = await fetch(`/product_adder/api/machinery/products/${productId}/pricing`, { cache: "no-store" });
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d?.message || "Failed to load machinery pricing.");
      const rows = unwrapArray<MachineryPricingRow>(d);
      setMachineryRows(rows);
      const edits = initRowEdits(rows);
      machineryRowEditsRef.current = edits;
      setMachineryRowEdits(edits);
      setMachinerySaveStates({});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load machinery pricing.";
      toast({ title: "Load Failed", description: message, variant: "destructive" });
    } finally {
      setIsMachineryLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (tab === "machinery" && machineryGroups.length === 0) {
      loadMachineryGroups();
      loadMachineryProducts();
    }
  }, [tab, machineryGroups.length, loadMachineryGroups, loadMachineryProducts]);

  useEffect(() => { if (selectedMachineryProductId) loadMachineryPricing(selectedMachineryProductId); }, [selectedMachineryProductId, loadMachineryPricing]);

  const filteredMachineryProducts = selectedGroupId
    ? machineryProducts.filter((p) => p.group_id === selectedGroupId)
    : machineryProducts;

  useEffect(() => {
    if (filteredMachineryProducts.length > 0) {
      setSelectedMachineryProductId((prev) => {
        const stillValid = filteredMachineryProducts.some((p) => p.id === prev);
        return stillValid ? prev : filteredMachineryProducts[0].id;
      });
    } else {
      setSelectedMachineryProductId("");
    }
  }, [selectedGroupId, filteredMachineryProducts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMachineryRow = async (rowId: string) => {
    const edit = machineryRowEditsRef.current[rowId];
    if (!edit) return;
    setMachinerySaveStates((prev) => ({ ...prev, [rowId]: "saving" }));
    try {
      const r = await fetch(`/product_adder/api/machinery/pricing/${rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_price: edit.unit_price ? Number(edit.unit_price) : undefined,
          discount_type: edit.discount_type || null,
          discount_value: edit.discount_value ? Number(edit.discount_value) : undefined,
        }),
      });
      if (!r.ok) throw new Error("Save failed");
      setMachinerySaveStates((prev) => ({ ...prev, [rowId]: "saved" }));
      setTimeout(() => setMachinerySaveStates((prev) => (prev[rowId] === "saved" ? { ...prev, [rowId]: "idle" } : prev)), 2000);
    } catch {
      setMachinerySaveStates((prev) => ({ ...prev, [rowId]: "error" }));
      toast({ title: "Save Failed", description: "Could not save pricing row.", variant: "destructive" });
    }
  };

  const handleMachineryFieldChange = (rowId: string, field: keyof RowEdit, value: string) => {
    const current = machineryRowEditsRef.current[rowId] ?? { unit_price: "", discount_type: null, discount_value: "" };
    const newEdit: RowEdit = { ...current, [field]: value as DiscountType };
    if (field === "discount_type" && !value) newEdit.discount_value = "";
    machineryRowEditsRef.current[rowId] = newEdit;
    setMachineryRowEdits((prev) => ({ ...prev, [rowId]: newEdit }));
    setMachinerySaveStates((prev) => ({ ...prev, [rowId]: "idle" }));
    clearTimeout(machineryDebounce.current[rowId]);
    machineryDebounce.current[rowId] = setTimeout(() => void saveMachineryRow(rowId), 800);
  };

  // ── Save state icon ────────────────────────────────────────────────────────

  const renderSaveState = (state: SaveState | undefined) => {
    if (state === "saving") return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />;
    if (state === "saved") return <Check className="h-4 w-4 text-emerald-500" />;
    if (state === "error") return <AlertCircle className="h-4 w-4 text-red-500" />;
    return null;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0061FF]">
          Pricing Rules
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          Product Pricing Matrix
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Edit prices inline. Changes save automatically.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900 w-fit">
        <button
          type="button"
          onClick={() => setTab("printing")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "printing" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
        >
          Printing Services
        </button>
        <button
          type="button"
          onClick={() => setTab("machinery")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "machinery" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
        >
          Machinery
        </button>
      </div>

      {/* ── Printing Services Tab ────────────────────────────────────────────── */}
      {tab === "printing" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="border-slate-200/80 shadow-sm dark:border-slate-800 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Select Product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {services.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="select-service">Service</Label>
                  <select
                    id="select-service"
                    aria-label="Select service"
                    className={selectCls}
                    value={selectedServiceId}
                    onChange={(e) => {
                      setSelectedServiceId(e.target.value);
                      setSelectedProductId("");
                    }}
                  >
                    <option value="">All Services</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="select-product">Product</Label>
                <select
                  id="select-product"
                  aria-label="Select product"
                  className={selectCls}
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  {filteredProducts.length === 0 && (
                    <option value="" disabled>No products for this service</option>
                  )}
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {pricingFields.map((field) => (
                <div className="space-y-2" key={field.id}>
                  <Label htmlFor={`field-${field.id}`}>{field.label}</Label>
                  <select
                    id={`field-${field.id}`}
                    aria-label={field.label}
                    className={selectCls}
                    value={selectedOptions[field.id] || ""}
                    onChange={(e) =>
                      setSelectedOptions((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                  >
                    <option value="">Select option</option>
                    {(field.options || []).map((opt) => (
                      <option key={opt.id} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}

              <Button
                className="gap-2"
                variant="outline"
                onClick={() => selectedProductId && loadPricingData(selectedProductId)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Refresh Pricing
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm dark:border-slate-800 lg:col-span-2">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-semibold">Pricing Matrix</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-4 font-semibold">Configuration</th>
                      <th className="px-4 py-4 font-semibold">Unit Price (NPR)</th>
                      <th className="px-4 py-4 font-semibold">Discount</th>
                      <th className="px-4 py-4 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isPrintingLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">Loading pricing rows...</td>
                      </tr>
                    ) : pricingRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">No pricing rows found.</td>
                      </tr>
                    ) : (
                      pricingRows.map((row) => {
                        const edit = printingRowEdits[row.id] ?? {
                          unit_price: row.unit_price?.toString() ?? "",
                          discount_type: row.discount_type ?? null,
                          discount_value: row.discount_value != null ? String(row.discount_value) : "",
                        };
                        return (
                          <tr key={row.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900 dark:text-white">{renderPrintingCombo(row)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <Input type="number" min={0} value={edit.unit_price}
                                onChange={(e) => handlePrintingFieldChange(row.id, "unit_price", e.target.value)}
                                className="h-8 w-32 text-sm" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <select aria-label="Discount type" className={`${selectCls} w-28`}
                                  value={edit.discount_type || ""}
                                  onChange={(e) => handlePrintingFieldChange(row.id, "discount_type", e.target.value)}>
                                  <option value="">None</option>
                                  <option value="percentage">%</option>
                                  <option value="fixed">NPR</option>
                                </select>
                                <Input type="number" min={0} value={edit.discount_value}
                                  disabled={!edit.discount_type}
                                  onChange={(e) => handlePrintingFieldChange(row.id, "discount_value", e.target.value)}
                                  className="h-8 w-20 text-sm disabled:opacity-40" placeholder="0" />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {renderSaveState(printingSaveStates[row.id])}
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
        </div>
      )}

      {/* ── Machinery Tab ────────────────────────────────────────────────────── */}
      {tab === "machinery" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="border-slate-200/80 shadow-sm dark:border-slate-800 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Select Product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="select-mgroup">Group</Label>
                <select
                  id="select-mgroup"
                  aria-label="Select machinery group"
                  className={selectCls}
                  value={selectedGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value);
                    setSelectedMachineryProductId("");
                  }}
                >
                  <option value="">All Groups</option>
                  {machineryGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="select-mproduct">Product</Label>
                <select
                  id="select-mproduct"
                  aria-label="Select machinery product"
                  className={selectCls}
                  value={selectedMachineryProductId}
                  onChange={(e) => setSelectedMachineryProductId(e.target.value)}
                >
                  {filteredMachineryProducts.length === 0 && (
                    <option value="" disabled>No products in this group</option>
                  )}
                  {filteredMachineryProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <Button
                className="gap-2"
                variant="outline"
                onClick={() => selectedMachineryProductId && loadMachineryPricing(selectedMachineryProductId)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Refresh Pricing
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm dark:border-slate-800 lg:col-span-2">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-semibold">Pricing Matrix</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-4 font-semibold">Configuration</th>
                      <th className="px-4 py-4 font-semibold">Unit Price (NPR)</th>
                      <th className="px-4 py-4 font-semibold">Discount</th>
                      <th className="px-4 py-4 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isMachineryLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">Loading pricing rows...</td>
                      </tr>
                    ) : machineryRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                          {selectedMachineryProductId ? "No pricing rows found. Generate combinations in Machinery Adder first." : "Select a product to view pricing."}
                        </td>
                      </tr>
                    ) : (
                      machineryRows.map((row) => {
                        const edit = machineryRowEdits[row.id] ?? {
                          unit_price: row.unit_price?.toString() ?? "",
                          discount_type: row.discount_type ?? null,
                          discount_value: row.discount_value != null ? String(row.discount_value) : "",
                        };
                        return (
                          <tr key={row.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900 dark:text-white">{renderMachineryCombo(row)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <Input type="number" min={0} value={edit.unit_price}
                                onChange={(e) => handleMachineryFieldChange(row.id, "unit_price", e.target.value)}
                                className="h-8 w-32 text-sm" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <select aria-label="Discount type" className={`${selectCls} w-28`}
                                  value={edit.discount_type || ""}
                                  onChange={(e) => handleMachineryFieldChange(row.id, "discount_type", e.target.value)}>
                                  <option value="">None</option>
                                  <option value="percentage">%</option>
                                  <option value="fixed">NPR</option>
                                </select>
                                <Input type="number" min={0} value={edit.discount_value}
                                  disabled={!edit.discount_type}
                                  onChange={(e) => handleMachineryFieldChange(row.id, "discount_value", e.target.value)}
                                  className="h-8 w-20 text-sm disabled:opacity-40" placeholder="0" />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {renderSaveState(machinerySaveStates[row.id])}
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
        </div>
      )}
    </div>
  );
}
