"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Layers, PlusCircle, TicketPercent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createAdminProduct,
  fetchAdminProducts,
  fetchAdminServices,
  type AdminProduct,
  type AdminService,
  type DiscountType,
} from "@/services/catalogAdminService";

export default function ProductsPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<AdminService[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [serviceId, setServiceId] = useState("");
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [servicesData, productsData] = await Promise.all([
        fetchAdminServices(),
        fetchAdminProducts(),
      ]);
      setServices(servicesData);
      setProducts(productsData);
      if (!serviceId && servicesData.length > 0) {
        setServiceId(servicesData[0].id);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load catalog data.";
      toast({ title: "Load Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const serviceLookup = useMemo(() => {
    const map = new Map<string, string>();
    services.forEach((service) => map.set(service.id, service.name));
    return map;
  }, [services]);

  const handleCreate = async () => {
    if (!serviceId || !productName.trim() || !productCode.trim()) return;
    setIsSubmitting(true);
    try {
      const normalizedDiscountType =
        discountValue && discountType ? discountType : null;
      const payload = {
        product_code: productCode.trim(),
        name: productName.trim(),
        description: description.trim() || undefined,
        base_price: basePrice ? Number(basePrice) : undefined,
        discount_type: normalizedDiscountType,
        discount_value: normalizedDiscountType ? Number(discountValue) : undefined,
      };
      const created = await createAdminProduct(serviceId, payload);
      setProducts((prev) => [created, ...prev]);
      setProductCode("");
      setProductName("");
      setDescription("");
      setBasePrice("");
      setDiscountValue("");
      toast({
        title: "Product Created",
        description: `${created.name} is now live.`,
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create product.";
      toast({ title: "Create Failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0061FF]">
          Dynamic Catalog
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          Products
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Create products under services with pricing and discount rules.
        </p>
      </div>

      <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Create Product</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Service</Label>
              <select
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800 dark:focus-visible:ring-slate-300"
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Product Code</Label>
              <Input
                placeholder="A4-BILL-BOOK"
                value={productCode}
                onChange={(event) => setProductCode(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input
                placeholder="A4 Bill Book"
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="A4 bill book with duplicate pages"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Base Price</Label>
              <Input
                type="number"
                placeholder="120"
                value={basePrice}
                onChange={(event) => setBasePrice(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <select
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800 dark:focus-visible:ring-slate-300"
                value={discountType || ""}
                onChange={(event) =>
                  setDiscountType(event.target.value as DiscountType)
                }
              >
                <option value="">None</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Discount Value</Label>
              <Input
                type="number"
                placeholder="10"
                value={discountValue}
                onChange={(event) => setDiscountValue(event.target.value)}
                disabled={!discountType}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
            <Button
              className="gap-2"
              onClick={handleCreate}
              disabled={
                isSubmitting ||
                !serviceId ||
                !productCode.trim() ||
                !productName.trim()
              }
            >
              <PlusCircle className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Add Product"}
            </Button>
          </div>
        </CardContent>
      </Card>

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
                  <th className="px-6 py-4 font-semibold">Service</th>
                  <th className="px-6 py-4 font-semibold">Base Price</th>
                  <th className="px-6 py-4 font-semibold">Discount</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                      No products created yet.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {product.name}
                        </div>
                        <div className="text-xs text-slate-500">{product.product_code}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {serviceLookup.get(product.service_id) || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        NPR {product.base_price ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="gap-1">
                          <TicketPercent className="h-3 w-3" />
                          {product.discount_type
                            ? `${product.discount_value ?? 0}${product.discount_type === "percentage" ? "%" : " NPR"}`
                            : "No discount"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            toast({
                              title: "Manage Fields",
                              description: "Open the Product Fields section for this product.",
                            })
                          }
                        >
                          <Layers className="h-3.5 w-3.5" />
                          Manage Fields
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
    </div>
  );
}
