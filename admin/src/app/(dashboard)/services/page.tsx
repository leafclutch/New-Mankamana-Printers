"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createAdminService,
  fetchAdminServices,
  type AdminService,
} from "@/services/catalogAdminService";

export default function ServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<AdminService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminServices();
      setServices(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load services.";
      toast({ title: "Load Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await createAdminService({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setServices((prev) => [created, ...prev]);
      setName("");
      setDescription("");
      toast({
        title: "Service Created",
        description: `${created.name} added to the catalog.`,
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create service.";
      toast({ title: "Create Failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0061FF]">
          Printing Services
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          Manage Service Catalog
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add or update the general services shown to clients.
        </p>
      </div>

      <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Create Service</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Service Name</Label>
            <Input
              placeholder="Visiting Cards"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="Describe the service"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button className="gap-2" onClick={handleCreate} disabled={isSubmitting || !name.trim()}>
              <PlusCircle className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Add Service"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold">Service List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Service</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-500">
                      Loading services...
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-500">
                      No services created yet.
                    </td>
                  </tr>
                ) : (
                  services.map((service) => (
                    <tr key={service.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {service.name}
                        </div>
                        <div className="text-xs text-slate-500">{service.id}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {service.description || "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            toast({
                              title: "Edit Service",
                              description: "Editing services is coming next.",
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
  );
}
