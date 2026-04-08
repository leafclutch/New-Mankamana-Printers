"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IdCard, PackageSearch, ClipboardList } from "lucide-react";

const mockIdcardProducts = [
  { id: "IDC-3001", name: "School ID Card", material: "PVC", status: "Active" },
  { id: "IDC-3002", name: "Employee ID Card", material: "PVC", status: "Active" },
];

const mockIdcardOrders = [
  { id: "IDC-ORD-001", client: "ABC Public School", qty: 200, status: "ORDER_PLACED" },
  { id: "IDC-ORD-002", client: "City College", qty: 150, status: "ORDER_PROCESSING" },
];

export default function IdCardsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0061FF]">
          ID Card Line
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          ID Card Products and Orders
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Dedicated view for ID card catalog and order tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Create ID Card Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input placeholder="School ID Card" />
            </div>
            <div className="space-y-2">
              <Label>Material</Label>
              <Input placeholder="PVC" />
            </div>
            <Button className="gap-2">
              <IdCard className="h-4 w-4" />
              Add ID Card Product
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold">ID Card Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockIdcardProducts.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.id} | {item.material}</div>
                </div>
                <Button size="sm" variant="outline">Edit</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold">ID Card Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Client</th>
                  <th className="px-6 py-4 font-semibold">Quantity</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mockIdcardOrders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {order.client}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {order.qty}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {order.status}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="outline">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        View
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
