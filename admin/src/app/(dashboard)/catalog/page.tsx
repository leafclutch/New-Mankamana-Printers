"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, Boxes, PlusCircle, ListTree } from "lucide-react";

const mockProducts = [
  { id: "PRD-1201", name: "School ID Card", category: "ID Cards" },
  { id: "PRD-1202", name: "Business Cards", category: "Visiting Cards" },
];

export default function CatalogPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0061FF]">
          Product Catalog
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          Build Products and Variants
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configure products, variants, option groups, and option values.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Create Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input placeholder="ID Cards" />
            </div>
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input placeholder="School ID Card" />
            </div>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Product
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Add Variant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Input placeholder="Select product" />
            </div>
            <div className="space-y-2">
              <Label>Variant Name</Label>
              <Input placeholder="PVC Standard" />
            </div>
            <Button className="gap-2" variant="outline">
              <Layers className="h-4 w-4" />
              Create Variant
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Options Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Option Group</Label>
              <Input placeholder="Printing Side" />
            </div>
            <div className="space-y-2">
              <Label>Option Values</Label>
              <Input placeholder="Single Side, Double Side" />
            </div>
            <Button className="gap-2" variant="outline">
              <ListTree className="h-4 w-4" />
              Add Option Group
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold">Product Library</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mockProducts.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {product.name}
                      </div>
                      <div className="text-xs text-slate-500">{product.id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm">
                        Manage Variants
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
