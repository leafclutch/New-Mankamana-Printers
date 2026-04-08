"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FolderPlus, Image as ImageIcon } from "lucide-react";

const mockTemplates = [
  {
    id: "TPL-1001",
    name: "School ID Card Template",
    category: "ID Cards",
    file: "School_ID_Card.psd",
  },
  {
    id: "TPL-1002",
    name: "Business Card Front",
    category: "Visiting Cards",
    file: "Business_Card_Front.pdf",
  },
];

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0061FF]">
          Template Library
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          Manage Design Templates
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Create categories and upload approved templates for client use.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Create Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input placeholder="e.g. ID Cards" />
            </div>
            <Button className="gap-2">
              <FolderPlus className="h-4 w-4" />
              Add Category
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Upload Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input placeholder="School ID Card Template" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input placeholder="Select category" />
            </div>
            <div className="space-y-2">
              <Label>Upload File</Label>
              <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-500 dark:border-slate-800">
                <span>Drag file or browse</span>
                <UploadCloud className="h-4 w-4" />
              </div>
            </div>
            <Button className="gap-2">
              <UploadCloud className="h-4 w-4" />
              Publish Template
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold">Template Library</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Template</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">File</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mockTemplates.map((template) => (
                  <tr key={template.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {template.name}
                      </div>
                      <div className="text-xs text-slate-500">{template.id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {template.category}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        {template.file}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm">
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
