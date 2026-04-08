"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ListChecks, PlusCircle, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createAdminFieldOption,
  createAdminProductField,
  fetchAdminProductById,
  fetchAdminProducts,
  type AdminProduct,
  type AdminProductField,
  type AdminProductFieldOption,
} from "@/services/catalogAdminService";

const FIELD_TYPE_OPTIONS = [
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "DROPDOWN", label: "Dropdown" },
  { value: "FILE", label: "File Upload" },
];

export default function ProductFieldsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [fields, setFields] = useState<AdminProductField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fieldKey, setFieldKey] = useState("");
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("DROPDOWN");
  const [optionsText, setOptionsText] = useState("");
  const [isRequired, setIsRequired] = useState("true");
  const [isPricingField, setIsPricingField] = useState("false");

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminProducts();
      setProducts(data);
      if (!selectedProductId && data.length > 0) {
        setSelectedProductId(data[0].id);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load products.";
      toast({ title: "Load Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFields = async (productId: string) => {
    if (!productId) return;
    setIsLoading(true);
    try {
      const product = await fetchAdminProductById(productId);
      setFields(product.fields || []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load fields.";
      toast({ title: "Load Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadFields(selectedProductId);
    }
  }, [selectedProductId]);

  useEffect(() => {
    if (fieldType !== "DROPDOWN") {
      setIsPricingField("false");
      setOptionsText("");
    }
  }, [fieldType]);

  const resetForm = () => {
    setFieldKey("");
    setLabel("");
    setFieldType("DROPDOWN");
    setOptionsText("");
    setIsRequired("true");
    setIsPricingField("false");
  };

  const parsedOptions = useMemo(() => {
    if (!optionsText.trim()) return [];
    return optionsText
      .split(",")
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((option, index) => {
        const [value, labelValue] = option.includes(":")
          ? option.split(":").map((part) => part.trim())
          : [option, option];
        return {
          value,
          label: labelValue,
          display_order: index,
        };
      });
  }, [optionsText]);

  const handleCreateField = async () => {
    if (!selectedProductId || !label.trim() || !fieldKey.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await createAdminProductField(selectedProductId, {
        field_key: fieldKey.trim(),
        label: label.trim(),
        type: fieldType,
        is_required: isRequired === "true",
        is_pricing_field: fieldType === "DROPDOWN" && isPricingField === "true",
        display_order: fields.length + 1,
      });

      let newOptions: AdminProductFieldOption[] = [];
      if (fieldType === "DROPDOWN" && parsedOptions.length > 0) {
        const createdOptions = await Promise.all(
          parsedOptions.map((option) =>
            createAdminFieldOption(created.id, option)
          )
        );
        newOptions = createdOptions;
      }

      const nextField: AdminProductField = {
        ...created,
        options: created.options?.length ? created.options : newOptions,
      };
      setFields((prev) => [...prev, nextField]);
      resetForm();
      toast({
        title: "Field Added",
        description: `${created.label} is now part of this product.`,
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add field.";
      toast({ title: "Create Failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0061FF]">
          Configuration Builder
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          Product Fields
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Define input fields and options clients must fill when ordering a product.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Field Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <select
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800 dark:focus-visible:ring-slate-300"
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Field Key</Label>
              <Input
                placeholder="paper_quality"
                value={fieldKey}
                onChange={(event) => setFieldKey(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Field Label</Label>
              <Input
                placeholder="Paper Quality"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Field Type</Label>
              <select
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800 dark:focus-visible:ring-slate-300"
              value={fieldType}
              onChange={(event) => setFieldType(event.target.value)}
            >
                {FIELD_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Options</Label>
              <Input
                placeholder="Matte 300 GSM, Glossy 350 GSM"
                value={optionsText}
                onChange={(event) => setOptionsText(event.target.value)}
                disabled={fieldType !== "DROPDOWN"}
              />
              <p className="text-xs text-slate-500">
                Provide comma-separated options for dropdown fields. Use
                <span className="font-semibold"> value:label</span> to set
                display labels.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Required</Label>
              <select
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800 dark:focus-visible:ring-slate-300"
                value={isRequired}
                onChange={(event) => setIsRequired(event.target.value)}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Pricing Field</Label>
              <select
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800 dark:focus-visible:ring-slate-300"
                value={isPricingField}
                onChange={(event) => setIsPricingField(event.target.value)}
                disabled={fieldType !== "DROPDOWN"}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
              <p className="text-xs text-slate-500">
                Pricing fields must be dropdowns.
              </p>
            </div>
            <Button
              className="w-full gap-2"
              onClick={handleCreateField}
              disabled={
                isSubmitting ||
                !selectedProductId ||
                !fieldKey.trim() ||
                !label.trim()
              }
            >
              <PlusCircle className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Add Field"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-base font-semibold">Configured Fields</CardTitle>
              <p className="text-xs text-slate-500">
                Keep the fields ordered in the same sequence clients should see.
              </p>
            </div>
            <Button size="sm" variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Reorder
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Field</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Options</th>
                    <th className="px-6 py-4 font-semibold">Required</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                        Loading fields...
                      </td>
                    </tr>
                  ) : fields.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                        No fields configured yet.
                      </td>
                    </tr>
                  ) : (
                    fields.map((field) => (
                      <tr key={field.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {field.label}
                          </div>
                          <div className="text-xs text-slate-500">{field.field_key}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {field.type}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {field.options && field.options.length ? (
                            <div className="flex flex-wrap gap-2">
                              {field.options.map((option) => (
                                <Badge key={option.id} variant="secondary" className="gap-1">
                                  <ListChecks className="h-3 w-3" />
                                  {option.label}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No options</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={field.is_required ? "default" : "secondary"}>
                            {field.is_required ? "Yes" : "No"}
                          </Badge>
                          {field.is_pricing_field ? (
                            <Badge variant="outline" className="ml-2">
                              Pricing
                            </Badge>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toast({
                                title: "Edit Field",
                                description: "Field updates are coming next.",
                              })
                            }
                          >
                            Edit
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
    </div>
  );
}
