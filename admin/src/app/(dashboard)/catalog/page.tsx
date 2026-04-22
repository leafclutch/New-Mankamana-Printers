"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, PlusCircle, FolderOpen, X, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubProduct {
  id: string;
  name: string;
  product_code: string;
}

interface ProductGroup {
  id: string;
  group_code: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  products: SubProduct[];
}

interface Product {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  group_id: string | null;
}

// ── API helpers ───────────────────────────────────────────────────────────────

const safeJson = async (r: Response) => {
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { message: text }; }
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const { toast } = useToast();

  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // New group form
  const [newGroupCode, setNewGroupCode] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Assign product to group
  const [assignProductId, setAssignProductId] = useState("");
  const [assignGroupId, setAssignGroupId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Toggle group active state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const r = await fetch("/api/admin/product-groups", { cache: "no-store" });
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d?.message || "Failed to load groups");
      const raw = d?.data ?? d;
      setGroups(Array.isArray(raw) ? raw : []);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoadingGroups(false);
    }
  }, [toast]);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const r = await fetch("/api/admin/products", { cache: "no-store" });
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d?.message || "Failed to load products");
      const raw = d?.data ?? d;
      setProducts(Array.isArray(raw) ? raw : []);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoadingProducts(false);
    }
  }, [toast]);

  useEffect(() => { loadGroups(); loadProducts(); }, [loadGroups, loadProducts]);

  const handleCreateGroup = async () => {
    if (!newGroupCode.trim() || !newGroupName.trim()) {
      toast({ title: "Required", description: "Group code and name are required.", variant: "destructive" });
      return;
    }
    setCreatingGroup(true);
    try {
      const r = await fetch("/api/admin/product-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_code: newGroupCode.trim(), name: newGroupName.trim(), description: newGroupDesc.trim() || undefined }),
      });
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d?.message || "Failed to create group");
      toast({ title: "Group created", description: `"${newGroupName}" has been added.` });
      setNewGroupCode(""); setNewGroupName(""); setNewGroupDesc("");
      await loadGroups();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleAssign = async () => {
    if (!assignProductId) {
      toast({ title: "Required", description: "Select a product first.", variant: "destructive" });
      return;
    }
    setAssigning(true);
    try {
      const r = await fetch(`/api/admin/products/${assignProductId}/group`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: assignGroupId || null }),
      });
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d?.message || "Failed to assign product");
      toast({ title: "Saved", description: assignGroupId ? "Product assigned to group." : "Product removed from group." });
      setAssignProductId(""); setAssignGroupId("");
      await Promise.all([loadGroups(), loadProducts()]);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  const handleToggleActive = async (group: ProductGroup) => {
    setTogglingId(group.id);
    try {
      const r = await fetch(`/api/admin/product-groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !group.is_active }),
      });
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d?.message || "Failed to update");
      await loadGroups();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const ungroupedProducts = products.filter((p) => !p.group_id);
  const selectCls = "flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0061FF]">Product Catalog</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Product Hierarchy</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage product groups (3-layer) and standalone products (2-layer). Products in a group appear under a parent selection step on the client.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Create group */}
        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-[#0061FF]" />
              New Product Group
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="group-code">Group Code</Label>
                <Input id="group-code" placeholder="CHD-001" value={newGroupCode} onChange={(e) => setNewGroupCode(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="group-name">Group Name</Label>
                <Input id="group-name" placeholder="Card Holder" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="group-desc">Description (optional)</Label>
              <Input id="group-desc" placeholder="Various card holder styles" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
            </div>
            <Button className="gap-2" onClick={handleCreateGroup} disabled={creatingGroup}>
              {creatingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              Create Group
            </Button>
          </CardContent>
        </Card>

        {/* Assign product to group */}
        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#0061FF]" />
              Assign Product to Group
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="assign-product">Product</Label>
              <select
                id="assign-product"
                aria-label="Select product to assign"
                className={selectCls}
                value={assignProductId}
                onChange={(e) => setAssignProductId(e.target.value)}
              >
                <option value="">— select product —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.product_code}){p.group_id ? " ✓ in group" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assign-group">Group</Label>
              <select
                id="assign-group"
                aria-label="Select group"
                className={selectCls}
                value={assignGroupId}
                onChange={(e) => setAssignGroupId(e.target.value)}
              >
                <option value="">— standalone (no group) —</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} ({g.group_code})</option>
                ))}
              </select>
            </div>
            <Button variant="outline" className="gap-2" onClick={handleAssign} disabled={assigning || !assignProductId}>
              {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save Assignment
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Groups table */}
      <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold">Product Groups</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Group</th>
                  <th className="px-6 py-4 font-semibold">Sub-products</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingGroups ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">Loading groups…</td>
                  </tr>
                ) : groups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">No product groups yet.</td>
                  </tr>
                ) : (
                  groups.map((group) => (
                    <tr key={group.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{group.name}</div>
                        <div className="text-xs text-slate-400">{group.group_code}</div>
                        {group.description && <div className="text-xs text-slate-400 mt-0.5">{group.description}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {group.products.length === 0 ? (
                          <span className="text-slate-400 text-xs">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {group.products.map((p) => (
                              <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300">
                                {p.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${group.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                          {group.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleToggleActive(group)}
                          disabled={togglingId === group.id}
                        >
                          {togglingId === group.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : group.is_active ? (
                            <X className="h-3.5 w-3.5" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          {group.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Standalone products table */}
      <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold">
            Standalone Products
            <span className="ml-2 text-xs font-normal text-slate-400">(no group — appear directly on the services page)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingProducts ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-10 text-center text-slate-500">Loading products…</td>
                  </tr>
                ) : ungroupedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-10 text-center text-slate-500">All products are assigned to groups.</td>
                  </tr>
                ) : (
                  ungroupedProducts.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{p.name}</div>
                        {p.description && <div className="text-xs text-slate-400 mt-0.5">{p.description}</div>}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{p.product_code}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
