"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2, Wand2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { listMachineryPricing, createMachineryPricingRow, deleteMachineryPricingRow } from "../machinery-service";
import type { MachineryPriceRow, MachineryOption } from "../machinery-types";

function cartesian<T>(arrays: T[][]): T[][] {
  if (!arrays.length) return [[]];
  const [first, ...rest] = arrays;
  return first.flatMap(item => cartesian(rest).map(combo => [item, ...combo]));
}

interface Props {
  productId: string;
  options: MachineryOption[];
}

export function MachineryPricingSection({ productId, options }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<MachineryPriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMachineryPricing(productId);
      setRows(data);
    } catch (e) {
      toast({ title: "Could not load pricing rows", description: (e as Error).message, variant: "destructive" });
    } finally { setLoading(false); }
  }, [productId, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { load(); }, [options, load]);

  async function handleGenerate() {
    const pricingOpts = options.filter(o => o.is_pricing_field && o.choices.length > 0);
    if (!pricingOpts.length) {
      toast({ title: "No pricing options", description: "Add an option marked 'affects price' with at least one choice first.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    let created = 0;
    try {
      const existingKeys = new Set(rows.map(r =>
        r.selectedOptions.slice().sort((a, b) => a.fieldKey.localeCompare(b.fieldKey))
          .map(o => `${o.fieldKey}:${o.value}`).join("|")
      ));
      const choiceArrays = pricingOpts.map(o => o.choices.map(c => ({ fieldId: o.id, fk: o.field_key, value: c.value })));
      for (const combo of cartesian(choiceArrays)) {
        const key = combo.slice().sort((a, b) => a.fk.localeCompare(b.fk)).map(x => `${x.fk}:${x.value}`).join("|");
        if (!existingKeys.has(key)) {
          try {
            await createMachineryPricingRow(productId, combo.map(x => ({ fieldId: x.fieldId, value: x.value })), 0);
            created++;
          } catch { /* skip duplicate */ }
        }
      }
      toast({ title: created > 0 ? `${created} pricing row${created > 1 ? "s" : ""} created` : "All combinations already exist" });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      await load();
      setGenerating(false);
    }
  }

  async function handleDelete(rowId: string) {
    setDeletingId(rowId);
    try {
      await deleteMachineryPricingRow(rowId);
      setRows(r => r.filter(x => x.id !== rowId));
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally { setDeletingId(null); }
  }

  const hasOptions = options.some(o => o.choices.length > 0);

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Pricing Combinations</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {hasOptions
              ? 'Generate all option combinations. Set prices and discounts from the Pricing page.'
              : "Add options with choices above first, then generate pricing rows here."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasOptions && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Generate
            </Button>
          )}
          {rows.length > 0 && (
            <a href="/pricing?tab=machinery" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-[#0061FF] hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
              Set Prices
            </a>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex gap-2 items-center text-slate-400 text-sm py-4">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400 italic">
          {hasOptions ? "No pricing rows yet. Click Generate to create all option combinations." : "No pricing rows yet."}
        </p>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase text-slate-500 tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Configuration</th>
                  <th className="px-4 py-3 text-left font-semibold">Price (NPR)</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.combination}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-sm">
                      {row.price != null ? `NPR ${row.price.toLocaleString()}` : <span className="italic text-slate-400">Not set</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button type="button" onClick={() => handleDelete(row.id)} disabled={deletingId === row.id}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        {deletingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <ExternalLink className="h-3 w-3" />
            Go to <a href="/pricing?tab=machinery" target="_blank" rel="noopener noreferrer" className="text-[#0061FF] hover:underline font-medium">Pricing page</a> to set prices and discounts.
          </p>
        </>
      )}
    </section>
  );
}
