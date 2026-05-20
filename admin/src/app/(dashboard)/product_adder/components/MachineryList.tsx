"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Settings2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { machineryAutoCode, createGroup, createMachineryProduct, deleteMachineryProduct } from "../machinery-service";
import type { MachineryGroup, MachineryProduct } from "../machinery-types";

interface Props {
  products: MachineryProduct[];
  groups: MachineryGroup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreated: (p: MachineryProduct) => void;
  onDeleted: (id: string) => void;
  onGroupCreated: (g: MachineryGroup) => void;
}

type PanelMode = "none" | "product" | "group";

export function MachineryList({ products, groups, selectedId, onSelect, onCreated, onDeleted, onGroupCreated }: Props) {
  const { toast } = useToast();
  const [mode, setMode] = useState<PanelMode>("none");

  // product form
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [savingProd, setSavingProd] = useState(false);

  // group form
  const [grpName, setGrpName] = useState("");
  const [grpDesc, setGrpDesc] = useState("");
  const [savingGrp, setSavingGrp] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openPanel(m: PanelMode) {
    setMode(prev => prev === m ? "none" : m);
    if (m === "product" && !groupId && groups[0]) setGroupId(groups[0].id);
  }

  async function handleCreateProduct() {
    if (!prodName.trim()) return toast({ title: "Enter a product name", variant: "destructive" });
    if (!groupId) return toast({ title: "Select a group first", variant: "destructive" });
    setSavingProd(true);
    try {
      const p = await createMachineryProduct(groupId, { product_code: machineryAutoCode(prodName), name: prodName.trim(), description: prodDesc.trim() || undefined });
      onCreated(p);
      setProdName(""); setProdDesc(""); setMode("none");
      toast({ title: `"${p.name}" created` });
    } catch (e) {
      toast({ title: "Failed", description: (e as Error).message, variant: "destructive" });
    } finally { setSavingProd(false); }
  }

  async function handleCreateGroup() {
    if (!grpName.trim()) return toast({ title: "Enter a group name", variant: "destructive" });
    setSavingGrp(true);
    try {
      const g = await createGroup({ name: grpName.trim(), description: grpDesc.trim() || undefined });
      onGroupCreated(g);
      setGrpName(""); setGrpDesc(""); setMode("none");
      toast({ title: `Group "${g.name}" created` });
    } catch (e) {
      toast({ title: "Failed", description: (e as Error).message, variant: "destructive" });
    } finally { setSavingGrp(false); }
  }

  async function handleDelete(p: MachineryProduct, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Remove "${p.name}"?`)) return;
    setDeletingId(p.id);
    try {
      await deleteMachineryProduct(p.id);
      onDeleted(p.id);
    } catch (e) {
      toast({ title: "Failed", description: (e as Error).message, variant: "destructive" });
    } finally { setDeletingId(null); }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">All Machinery</span>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => openPanel("group")}>
            <FolderPlus className="h-3.5 w-3.5" /> Group
          </Button>
          <Button size="sm" className="h-8 gap-1" onClick={() => openPanel("product")}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </div>

      {/* New product form */}
      {mode === "product" && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900 space-y-2">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">New Product</p>
          {groups.length === 0 ? (
            <p className="text-xs text-slate-500">Create a group first before adding products.</p>
          ) : (
            <>
              {groups.length > 1 && (
                <select
                  className="w-full h-8 rounded-md border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={groupId}
                  onChange={e => setGroupId(e.target.value)}
                >
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              )}
              <Input placeholder="Product name *" value={prodName} onChange={e => setProdName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateProduct()} className="h-8 text-sm" autoFocus />
              <Input placeholder="Short description (optional)" value={prodDesc} onChange={e => setProdDesc(e.target.value)} className="h-8 text-sm" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateProduct} disabled={savingProd} className="h-7 gap-1">
                  {savingProd ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Create
                </Button>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => setMode("none")}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* New group form */}
      {mode === "group" && (
        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900 space-y-2">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">New Group</p>
          <Input placeholder="Group name *" value={grpName} onChange={e => setGrpName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreateGroup()} className="h-8 text-sm" autoFocus />
          <Input placeholder="Description (optional)" value={grpDesc} onChange={e => setGrpDesc(e.target.value)} className="h-8 text-sm" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateGroup} disabled={savingGrp} className="h-7 gap-1">
              {savingGrp ? <Loader2 className="h-3 w-3 animate-spin" /> : <FolderPlus className="h-3 w-3" />} Create
            </Button>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => setMode("none")}>Cancel</Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-slate-400 text-sm text-center">
            <Settings2 className="h-8 w-8 opacity-30" />
            <p>No machinery products yet.</p>
            <p className="text-xs">Create a group, then add products.</p>
          </div>
        ) : groups.map(g => {
          const groupProducts = products.filter(p => p.group_id === g.id);
          if (groupProducts.length === 0) return null;
          return (
            <div key={g.id}>
              <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{g.name}</span>
              </div>
              {groupProducts.map(p => (
                <button key={p.id} type="button" onClick={() => onSelect(p.id)}
                  className={`group w-full flex items-center justify-between px-4 py-3 text-left border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40
                    ${selectedId === p.id ? "bg-blue-50 dark:bg-blue-950/20 border-l-2 border-l-[#0061FF]" : ""}`}>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{p.name}</div>
                    {p.description && <div className="truncate text-xs text-slate-400 mt-0.5">{p.description}</div>}
                  </div>
                  <button type="button" onClick={e => handleDelete(p, e)} disabled={deletingId === p.id}
                    className="ml-2 shrink-0 p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100">
                    {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </button>
              ))}
            </div>
          );
        })}
        {/* Products without a matching group */}
        {products.filter(p => !groups.find(g => g.id === p.group_id)).map(p => (
          <button key={p.id} type="button" onClick={() => onSelect(p.id)}
            className={`group w-full flex items-center justify-between px-4 py-3 text-left border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40
              ${selectedId === p.id ? "bg-blue-50 dark:bg-blue-950/20 border-l-2 border-l-[#0061FF]" : ""}`}>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{p.name}</div>
            </div>
            <button type="button" onClick={e => handleDelete(p, e)} disabled={deletingId === p.id}
              className="ml-2 shrink-0 p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100">
              {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
