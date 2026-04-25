"use client";

import { useCallback, useEffect, useRef, useState, Fragment } from "react";
import type { Product, Option, PriceRow, Service, Variant, Group } from "./types";
import {
  getServices, getProducts, getGroups, setProductGroup,
  addProduct, addService, removeService, removeProduct,
  addVariant, renameVariant, removeVariant,
  addField, removeField, addChoice, removeChoice,
  getOptionSuggestions,
  loadPricing, addPricing, savePrice, removePrice,
  listImages, uploadImage, deleteImage,
  cartesian,
} from "./service";

// ── helpers ───────────────────────────────────────────────────────────────────

function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

type BtnVariant = "primary" | "secondary" | "danger" | "ghost";
function Btn({ children, onClick, disabled, variant = "primary", small }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: BtnVariant; small?: boolean;
}) {
  const base = `inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-50 ${small ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm"}`;
  const map: Record<BtnVariant, string> = {
    primary:   "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
    danger:    "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    ghost:     "text-gray-500 hover:text-gray-800 hover:bg-gray-100",
  };
  return <button type="button" className={`${base} ${map[variant]}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

const inp = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

function useToast() {
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);
  const t = useRef<ReturnType<typeof setTimeout>>();
  function toast(text: string, type: "ok" | "err" = "ok") {
    clearTimeout(t.current);
    setMsg({ text, type });
    t.current = setTimeout(() => setMsg(null), 3500);
  }
  return { msg, toast };
}

function Toast({ msg }: { msg: { text: string; type: "ok" | "err" } | null }) {
  if (!msg) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 text-sm px-4 py-2.5 rounded-xl shadow-lg font-medium
      ${msg.type === "err" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
      {msg.text}
    </div>
  );
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-6 group">
      <span className="text-base leading-none group-hover:-translate-x-0.5 transition-transform">←</span>
      <span>{label}</span>
    </button>
  );
}

// ── Card grid ─────────────────────────────────────────────────────────────────

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{children}</div>;
}

function ItemCard({ title, sub, meta, onClick, onDelete, deleting }: {
  title: string; sub?: string; meta?: string;
  onClick: () => void; onDelete?: () => void; deleting?: boolean;
}) {
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={e => e.key === "Enter" && onClick()}
      className="group relative bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
      <p className="font-semibold text-gray-900 truncate pr-5 leading-snug">{title}</p>
      {sub  && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
      {meta && <p className="text-xs text-gray-400 font-mono mt-2">{meta}</p>}
      {onDelete && (
        <button type="button" onClick={e => { e.stopPropagation(); onDelete(); }} disabled={deleting}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
          {deleting ? <Spinner /> : "✕"}
        </button>
      )}
    </div>
  );
}

function NewCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="min-h-[90px] bg-white border-2 border-dashed border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:bg-blue-50/40 transition-all flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-blue-500">
      <span className="text-2xl leading-none font-light">+</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

// A collapsible inline create form shown as a card
function CreateCard({ title, fields, onSubmit, onCancel, saving }: {
  title: string;
  fields: { placeholder: string; value: string; onChange: (v: string) => void; optional?: boolean }[];
  onSubmit: () => void; onCancel: () => void; saving: boolean;
}) {
  const canSubmit = fields.filter(f => !f.optional).every(f => f.value.trim());
  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 space-y-3">
      <p className="text-sm font-semibold text-blue-800">{title}</p>
      {fields.map((f, i) => (
        <input key={i} className={inp} placeholder={f.placeholder} value={f.value}
          autoFocus={i === 0}
          onChange={e => f.onChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && canSubmit && onSubmit()} />
      ))}
      <div className="flex gap-2">
        <Btn onClick={onSubmit} disabled={saving || !canSubmit}>{saving ? <Spinner /> : null} Create</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({ crumbs }: { crumbs: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm flex-wrap min-w-0">
      {crumbs.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-gray-300 select-none">/</span>}
          {c.onClick
            ? <button type="button" onClick={c.onClick} className="text-blue-600 hover:text-blue-800 font-medium transition-colors max-w-[160px] truncate">{c.label}</button>
            : <span className="text-gray-900 font-bold truncate max-w-[200px]">{c.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}

// ── Level 1: Categories ───────────────────────────────────────────────────────

function CategoriesView({ services, products, onSelect, onCreated, onDeleted }: {
  services: Service[]; products: Product[];
  onSelect: (s: Service) => void; onCreated: (s: Service) => void; onDeleted: (id: string) => void;
}) {
  const { msg, toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState(""); const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const s = await addService(name.trim());
      onCreated(s); setName(""); setCreating(false);
      toast(`"${s.name}" created`);
    } catch (e) { toast((e as Error).message, "err"); }
    finally { setSaving(false); }
  }

  async function del(s: Service) {
    const count = products.filter(p => p.service_id === s.id).length;
    if (count > 0) return toast(`Cannot delete — ${count} product${count > 1 ? "s" : ""} still in this category`, "err");
    if (!confirm(`Delete category "${s.name}"?`)) return;
    setDeletingId(s.id);
    try { await removeService(s.id); onDeleted(s.id); toast(`"${s.name}" deleted`); }
    catch (e) { toast((e as Error).message, "err"); }
    finally { setDeletingId(null); }
  }

  const countFor = (id: string) => products.filter(p => p.service_id === id).length;

  return (
    <>
      <Toast msg={msg} />
      <CardGrid>
        {services.map(s => (
          <ItemCard key={s.id} title={s.name}
            sub={`${countFor(s.id)} product${countFor(s.id) !== 1 ? "s" : ""}`}
            onClick={() => onSelect(s)}
            onDelete={() => del(s)} deleting={deletingId === s.id} />
        ))}
        {creating
          ? <CreateCard title="New category" fields={[{ placeholder: "Category name", value: name, onChange: setName }]}
              onSubmit={create} onCancel={() => { setCreating(false); setName(""); }} saving={saving} />
          : <NewCard label="New Category" onClick={() => setCreating(true)} />}
      </CardGrid>
    </>
  );
}

// ── Level 2: Products ─────────────────────────────────────────────────────────

function ProductCard({ product, groups, onSelect, onDeleted, onGroupChanged }: {
  product: Product; groups: Group[];
  onSelect: () => void; onDeleted: () => void; onGroupChanged: (groupId: string | null) => void;
}) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [assigningGroup, setAssigningGroup] = useState(false);

  async function del(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Remove "${product.name}"?`)) return;
    setDeleting(true);
    try { await removeProduct(product.id); onDeleted(); }
    catch (e) { toast((e as Error).message, "err"); setDeleting(false); }
  }

  async function handleGroupChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.stopPropagation();
    const groupId = e.target.value || null;
    setAssigningGroup(true);
    try {
      await setProductGroup(product.id, groupId);
      onGroupChanged(groupId);
      toast(groupId ? "Moved to group" : "Removed from group");
    } catch (err) { toast((err as Error).message, "err"); }
    finally { setAssigningGroup(false); }
  }

  const groupName = groups.find(g => g.id === product.group_id)?.name;

  return (
    <div className="group relative bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col gap-3">
      {/* clickable title area */}
      <div role="button" tabIndex={0} onClick={onSelect} onKeyDown={e => e.key === "Enter" && onSelect()}
        className="cursor-pointer flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate pr-6 leading-snug">{product.name}</p>
        <p className="text-sm text-gray-500 mt-1">{product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}</p>
        <p className="text-xs text-gray-400 font-mono mt-1">{product.product_code}</p>
      </div>

      {/* group assignment row */}
      <div onClick={e => e.stopPropagation()} className="flex items-center gap-2">
        <span className="text-xs text-gray-400 shrink-0">Group:</span>
        <div className="relative flex-1 min-w-0">
          <select
            value={product.group_id ?? ""}
            onChange={handleGroupChange}
            disabled={assigningGroup}
            className="w-full text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 appearance-none pr-5"
          >
            <option value="">— standalone —</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          {assigningGroup && (
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2"><Spinner /></span>
          )}
        </div>
      </div>

      {/* delete button */}
      <button type="button" onClick={del} disabled={deleting}
        className="absolute top-3 right-3 p-1 rounded-full text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
        {deleting ? <Spinner /> : "✕"}
      </button>
    </div>
  );
}

function ProductsView({ category, products, groups, onSelect, onCreated, onDeleted, onProductChanged, onBack }: {
  category: Service; products: Product[]; groups: Group[];
  onSelect: (p: Product) => void; onCreated: (p: Product) => void; onDeleted: (id: string) => void;
  onProductChanged: (p: Product) => void;
  onBack: () => void;
}) {
  const { msg, toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const p = await addProduct(category.id, name.trim(), desc.trim() || undefined);
      onCreated(p); setName(""); setDesc(""); setCreating(false);
      toast(`"${p.name}" created`);
    } catch (e) { toast((e as Error).message, "err"); }
    finally { setSaving(false); }
  }

  return (
    <>
      <Toast msg={msg} />
      <BackButton label="All Categories" onClick={onBack} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(p => (
          <ProductCard key={p.id} product={p} groups={groups}
            onSelect={() => onSelect(p)}
            onDeleted={() => onDeleted(p.id)}
            onGroupChanged={groupId => onProductChanged({ ...p, group_id: groupId })} />
        ))}
        {creating
          ? <CreateCard title="New product"
              fields={[
                { placeholder: "Product name *", value: name, onChange: setName },
                { placeholder: "Description (optional)", value: desc, onChange: setDesc, optional: true },
              ]}
              onSubmit={create} onCancel={() => { setCreating(false); setName(""); setDesc(""); }} saving={saving} />
          : <NewCard label="New Product" onClick={() => setCreating(true)} />}
      </div>
    </>
  );
}

// ── Level 3: Variants ─────────────────────────────────────────────────────────

function VariantCard({ variant, totalVariants, onSelect, onRenamed, onDeleted }: {
  variant: Variant; totalVariants: number;
  onSelect: () => void; onRenamed: (name: string) => void; onDeleted: () => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(variant.variant_name);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    if (!name.trim() || name.trim() === variant.variant_name) { setEditing(false); return; }
    setSaving(true);
    try {
      await renameVariant(variant.id, name.trim());
      onRenamed(name.trim()); setEditing(false);
    } catch (e) { toast((e as Error).message, "err"); }
    finally { setSaving(false); }
  }

  async function del(e: React.MouseEvent) {
    e.stopPropagation();
    if (totalVariants <= 1) return toast("Cannot delete the only variant", "err");
    if (!confirm(`Remove "${variant.variant_name}" and all its options and pricing?`)) return;
    setDeleting(true);
    try { await removeVariant(variant.id); onDeleted(); }
    catch (e) { toast((e as Error).message, "err"); setDeleting(false); }
  }

  const optCount     = variant.options.length;
  const pricingCount = variant.options.filter(o => o.is_pricing_field).length;

  if (editing) {
    return (
      <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 space-y-2">
        <input className={inp} value={name} autoFocus
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setName(variant.variant_name); setEditing(false); } }} />
        <div className="flex gap-2">
          <Btn small onClick={save} disabled={saving || !name.trim()}>{saving ? <Spinner /> : "Save"}</Btn>
          <Btn small variant="ghost" onClick={() => { setName(variant.variant_name); setEditing(false); }}>Cancel</Btn>
        </div>
      </div>
    );
  }

  return (
    <div role="button" tabIndex={0} onClick={onSelect} onKeyDown={e => e.key === "Enter" && onSelect()}
      className="group relative bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
      <p className="font-semibold text-gray-900 truncate pr-14 leading-snug">{variant.variant_name}</p>
      <p className="text-sm text-gray-500 mt-1">{optCount} option{optCount !== 1 ? "s" : ""} · {pricingCount} affect price</p>
      <p className="text-xs text-gray-400 font-mono mt-2">{variant.variant_code}</p>

      {/* action buttons — visible on hover */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button type="button" onClick={e => { e.stopPropagation(); setEditing(true); }}
          className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Rename">
          ✎
        </button>
        {totalVariants > 1 && (
          <button type="button" onClick={del} disabled={deleting}
            className="p-1 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
            {deleting ? <Spinner /> : "✕"}
          </button>
        )}
      </div>
    </div>
  );
}

function VariantsView({ product, onSelect, onAdded, onRenamed, onDeleted, onBack }: {
  product: Product;
  onSelect: (v: Variant) => void; onAdded: (v: Variant) => void;
  onRenamed: (id: string, name: string) => void; onDeleted: (id: string) => void;
  onBack: () => void;
}) {
  const { msg, toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState(""); const [saving, setSaving] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const v = await addVariant(product.id, name.trim());
      onAdded(v); setName(""); setCreating(false);
      toast(`"${v.variant_name}" added`);
    } catch (e) { toast((e as Error).message, "err"); }
    finally { setSaving(false); }
  }

  const totalOptions = (v: Variant) => v.options.length;
  const pricingOpts  = (v: Variant) => v.options.filter(o => o.is_pricing_field).length;

  return (
    <>
      <Toast msg={msg} />
      <BackButton label={`Back to ${product.name} products`} onClick={onBack} />
      <CardGrid>
        {product.variants.map(v => (
          <VariantCard key={v.id} variant={v} totalVariants={product.variants.length}
            onSelect={() => onSelect(v)}
            onRenamed={name => onRenamed(v.id, name)}
            onDeleted={() => onDeleted(v.id)} />
        ))}
        {creating
          ? <CreateCard title="New variant"
              fields={[{ placeholder: "Variant name (e.g. 500 GSM + UV)", value: name, onChange: setName }]}
              onSubmit={create} onCancel={() => { setCreating(false); setName(""); }} saving={saving} />
          : <NewCard label="New Variant" onClick={() => setCreating(true)} />}
      </CardGrid>
    </>
  );
}

// ── Level 4: Images ───────────────────────────────────────────────────────────

function ImagesSection({ product }: { product: Product }) {
  const { msg, toast } = useToast();
  const [images, setImages] = useState<Array<{ name: string; url: string; path: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    listImages(product.id).then(setImages).catch(e => toast((e as Error).message, "err")).finally(() => setLoading(false));
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const img = await uploadImage(product.id, file);
        setImages(prev => [...prev, img]);
      }
      toast(`${files.length} image${files.length > 1 ? "s" : ""} uploaded`);
    } catch (e) { toast((e as Error).message, "err"); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function del(path: string) {
    setDeletingPath(path);
    try { await deleteImage(product.id, path); setImages(prev => prev.filter(i => i.path !== path)); }
    catch (e) { toast((e as Error).message, "err"); }
    finally { setDeletingPath(null); }
  }

  const folderPath = product.image_url?.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/[^/]+\//, "") ?? null;

  return (
    <div className="space-y-4">
      <Toast msg={msg} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">Images</h3>
          {folderPath && <p className="text-xs text-gray-400 font-mono mt-0.5 break-all">{folderPath}</p>}
        </div>
        <div className="shrink-0">
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => handleFiles(e.target.files)} />
          <Btn variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <><Spinner /> Uploading…</> : "↑ Upload"}
          </Btn>
        </div>
      </div>

      {loading ? <p className="text-sm text-gray-400">Loading…</p>
        : images.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-300 transition-colors"
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
            <p className="text-gray-400 text-sm">Drop images here or click Upload</p>
            <p className="text-gray-300 text-xs mt-1">PNG, JPG, WEBP — multiple files supported</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
            {images.map(img => (
              <div key={img.path} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                <button type="button" onClick={() => del(img.path)} disabled={deletingPath === img.path}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                  {deletingPath === img.path ? <Spinner /> : "✕"}
                </button>
                <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-black/40 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.name}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-2xl text-gray-300 hover:border-blue-400 hover:text-blue-400 transition-colors">
              +
            </button>
          </div>
        )}
    </div>
  );
}

// ── Level 4: Options ──────────────────────────────────────────────────────────

type Suggestion = { label: string; is_pricing_field: boolean; choices: string[] };

function OptionsSection({ productId, variantId, options, onChange }: {
  productId: string; variantId: string; options: Option[]; onChange: (opts: Option[]) => void;
}) {
  const { msg, toast } = useToast();

  // existing options state
  const [newChoice, setNewChoice] = useState<Record<string, string>>({});
  const [addingChoice, setAddingChoice] = useState<Record<string, boolean>>({});
  const [deletingOpt, setDeletingOpt] = useState<string | null>(null);
  const [deletingChoice, setDeletingChoice] = useState<string | null>(null);

  // add-option form state
  const [newLabel, setNewLabel] = useState("");
  const [affectsPrice, setAffectsPrice] = useState(true);
  const [adding, setAdding] = useState(false);
  const [importChoices, setImportChoices] = useState<string[]>([]);

  // suggestions
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null);
  const sugRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getOptionSuggestions().then(setSuggestions).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // close suggestions on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sugRef.current && !sugRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredSuggestions = newLabel.trim()
    ? suggestions.filter(s => s.label.toLowerCase().includes(newLabel.toLowerCase()))
    : suggestions;

  function pickSuggestion(s: Suggestion) {
    setNewLabel(s.label);
    setAffectsPrice(s.is_pricing_field);
    setActiveSuggestion(s);
    setImportChoices(s.choices);   // pre-select all choices for import
    setShowSuggestions(false);
  }

  function toggleImportChoice(choice: string) {
    setImportChoices(prev => prev.includes(choice) ? prev.filter(c => c !== choice) : [...prev, choice]);
  }

  async function addOpt() {
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      const o = await addField(productId, variantId, newLabel.trim(), affectsPrice, importChoices.length ? importChoices : undefined);
      onChange([...options, o]);
      setNewLabel(""); setImportChoices([]); setActiveSuggestion(null);
    } catch (e) { toast((e as Error).message, "err"); }
    finally { setAdding(false); }
  }

  async function delOpt(id: string, label: string) {
    if (!confirm(`Remove "${label}" and all its values?`)) return;
    setDeletingOpt(id);
    try { await removeField(id); onChange(options.filter(o => o.id !== id)); }
    catch (e) { toast((e as Error).message, "err"); }
    finally { setDeletingOpt(null); }
  }

  async function addCh(optId: string) {
    const label = (newChoice[optId] ?? "").trim(); if (!label) return;
    setAddingChoice(p => ({ ...p, [optId]: true }));
    try {
      const c = await addChoice(optId, label);
      onChange(options.map(o => o.id === optId ? { ...o, choices: [...o.choices, c] } : o));
      setNewChoice(p => ({ ...p, [optId]: "" }));
    } catch (e) { toast((e as Error).message, "err"); }
    finally { setAddingChoice(p => ({ ...p, [optId]: false })); }
  }

  async function delCh(optId: string, choiceId: string) {
    setDeletingChoice(choiceId);
    try {
      await removeChoice(choiceId);
      onChange(options.map(o => o.id === optId ? { ...o, choices: o.choices.filter(c => c.id !== choiceId) } : o));
    } catch (e) { toast((e as Error).message, "err"); }
    finally { setDeletingChoice(null); }
  }

  return (
    <div className="space-y-4">
      {msg && <div className={`text-sm px-3 py-2 rounded-xl ${msg.type === "err" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>{msg.text}</div>}
      <div>
        <h3 className="font-semibold text-gray-900">Options</h3>
        <p className="text-sm text-gray-500 mt-0.5">Properties the customer picks — e.g. Quantity, Paper, Finish, UV Coating.</p>
      </div>

      {/* existing options */}
      {options.map(opt => (
        <div key={opt.id} className="border border-gray-200 rounded-2xl p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{opt.label}</span>
              {opt.is_pricing_field && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">affects price</span>
              )}
            </div>
            <Btn variant="danger" small onClick={() => delOpt(opt.id, opt.label)} disabled={deletingOpt === opt.id}>
              {deletingOpt === opt.id ? <Spinner /> : "Remove"}
            </Btn>
          </div>

          <div className="flex flex-wrap gap-2">
            {opt.choices.length === 0 && <span className="text-xs text-gray-400 italic">No values yet</span>}
            {opt.choices.map(c => (
              <span key={c.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700">
                {c.label}
                <button type="button" disabled={deletingChoice === c.id} onClick={() => delCh(opt.id, c.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors ml-0.5">
                  {deletingChoice === c.id ? <Spinner /> : "×"}
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input className={inp} placeholder="Add a value…" value={newChoice[opt.id] ?? ""}
              onChange={e => setNewChoice(p => ({ ...p, [opt.id]: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addCh(opt.id)} />
            <Btn variant="secondary" small onClick={() => addCh(opt.id)} disabled={addingChoice[opt.id]}>
              {addingChoice[opt.id] ? <Spinner /> : "+ Add"}
            </Btn>
          </div>
        </div>
      ))}

      {/* Add new option */}
      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add option</p>

        {/* label input + suggestion dropdown */}
        <div className="relative" ref={sugRef}>
          <input
            className={inp}
            placeholder='Type or pick an existing option…'
            value={newLabel}
            onChange={e => { setNewLabel(e.target.value); setActiveSuggestion(null); setImportChoices([]); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={e => e.key === "Enter" && !showSuggestions && addOpt()}
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
              {filteredSuggestions.map(s => (
                <button key={s.label} type="button"
                  onClick={() => pickSuggestion(s)}
                  className="w-full flex items-start justify-between px-3 py-2.5 hover:bg-blue-50 text-left gap-3 group">
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-900">{s.label}</span>
                    {s.choices.length > 0 && (
                      <span className="ml-2 text-xs text-gray-400">{s.choices.slice(0, 4).join(", ")}{s.choices.length > 4 ? "…" : ""}</span>
                    )}
                  </div>
                  {s.is_pricing_field && (
                    <span className="shrink-0 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">price</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* if a suggestion was picked with choices, show choice import panel */}
        {activeSuggestion && activeSuggestion.choices.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-medium text-gray-600">Import values from existing uses of &ldquo;{activeSuggestion.label}&rdquo;:</p>
            <div className="flex flex-wrap gap-2">
              {activeSuggestion.choices.map(c => (
                <label key={c} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={importChoices.includes(c)} onChange={() => toggleImportChoice(c)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700">{c}</span>
                </label>
              ))}
            </div>
            <button type="button" onClick={() => setImportChoices(activeSuggestion.choices.length === importChoices.length ? [] : activeSuggestion.choices)}
              className="text-xs text-blue-600 hover:text-blue-800">
              {importChoices.length === activeSuggestion.choices.length ? "Deselect all" : "Select all"}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={affectsPrice} onChange={e => setAffectsPrice(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            Different values have different prices
          </label>
          <Btn onClick={addOpt} disabled={adding || !newLabel.trim()}>{adding ? <Spinner /> : "+ Add Option"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Level 4: Pricing ──────────────────────────────────────────────────────────

function PricingSection({ productId, variantId, options }: {
  productId: string; variantId: string; options: Option[];
}) {
  const { msg, toast } = useToast();
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const pricesRef = useRef<Record<string, string>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadPricing(productId, variantId);
      setRows(data);
      const init: Record<string, string> = {};
      data.forEach(r => { init[r.id] = r.price != null ? String(r.price) : ""; });
      pricesRef.current = init; setPrices(init);
    } catch (e) { toast((e as Error).message, "err"); }
    finally { setLoading(false); }
  }, [productId, variantId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);
  // reload pricing whenever options (choices) change
  useEffect(() => { load(); }, [options, load]);

  function changePrice(id: string, val: string) {
    pricesRef.current[id] = val;
    setPrices(p => ({ ...p, [id]: val }));
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(async () => {
      const n = parseFloat(pricesRef.current[id]);
      if (isNaN(n)) return;
      setSavingId(id);
      try { await savePrice(id, n); }
      catch { toast("Could not save price", "err"); }
      finally { setSavingId(null); }
    }, 700);
  }

  async function delRow(id: string) {
    setDeletingId(id);
    try { await removePrice(id); setRows(r => r.filter(x => x.id !== id)); }
    catch (e) { toast((e as Error).message, "err"); }
    finally { setDeletingId(null); }
  }

  async function generate() {
    const pricingOpts = options.filter(o => o.is_pricing_field && o.choices.length > 0);
    if (!pricingOpts.length) return toast("Add an option marked 'affects price' with values first.", "err");
    setGenerating(true);
    try {
      const existing = new Set(rows.map(r =>
        r.selectedOptions.slice().sort((a, b) => a.fieldKey.localeCompare(b.fieldKey)).map(o => `${o.fieldKey}:${o.value}`).join("|")
      ));
      const combos = cartesian(pricingOpts.map(o => o.choices.map(c => ({ fieldId: o.id, fk: o.field_key, value: c.value }))));
      let created = 0;
      for (const combo of combos) {
        const key = combo.slice().sort((a, b) => a.fk.localeCompare(b.fk)).map(x => `${x.fk}:${x.value}`).join("|");
        if (!existing.has(key)) { await addPricing(productId, variantId, combo.map(x => ({ fieldId: x.fieldId, value: x.value })), 0); created++; }
      }
      await load();
      toast(created > 0 ? `${created} row${created > 1 ? "s" : ""} created — fill in the prices.` : "All combinations already exist.");
    } catch (e) { toast((e as Error).message, "err"); }
    finally { setGenerating(false); }
  }

  const hasPricingOptions = options.some(o => o.is_pricing_field && o.choices.length > 0);

  return (
    <div className="space-y-4">
      {msg && <div className={`text-sm px-3 py-2 rounded-xl ${msg.type === "err" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>{msg.text}</div>}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">Pricing</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {hasPricingOptions ? "Generate rows for every option combination, then fill in prices." : "Mark at least one option as 'affects price' and add values above."}
          </p>
        </div>
        {hasPricingOptions && (
          <Btn variant="secondary" onClick={generate} disabled={generating}>
            {generating ? <Spinner /> : "⚡"} Generate
          </Btn>
        )}
      </div>

      {loading ? <p className="text-sm text-gray-400">Loading…</p>
        : rows.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            {hasPricingOptions ? "No rows yet — click Generate." : "No pricing yet."}
          </p>
        ) : (
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Configuration</th>
                  <th className="px-4 py-3 text-left font-semibold w-44">Price (NPR)</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{row.combination}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input type="number" min={0} placeholder="0"
                          className="w-28 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={prices[row.id] ?? ""}
                          onChange={e => changePrice(row.id, e.target.value)} />
                        {savingId === row.id && <Spinner />}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button type="button" onClick={() => delRow(row.id)} disabled={deletingId === row.id}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1">
                        {deletingId === row.id ? <Spinner /> : "✕"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

// ── Level 4: Variant detail ───────────────────────────────────────────────────

function VariantDetailView({ product, variant, onOptionsChange, onBack }: {
  product: Product; variant: Variant; onOptionsChange: (opts: Option[]) => void; onBack: () => void;
}) {
  const [options, setOptions] = useState<Option[]>(variant.options);

  function handleOptions(opts: Option[]) { setOptions(opts); onOptionsChange(opts); }

  return (
    <div className="max-w-2xl space-y-10">
      <BackButton label={`Back to ${product.name} variants`} onClick={onBack} />
      <ImagesSection product={product} />
      <hr className="border-gray-100" />
      <OptionsSection productId={product.id} variantId={variant.id} options={options} onChange={handleOptions} />
      <hr className="border-gray-100" />
      <PricingSection productId={product.id} variantId={variant.id} options={options} />
    </div>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Navigation IDs — level is derived from which are set
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [productId,  setProductId]  = useState<string | null>(null);
  const [variantId,  setVariantId]  = useState<string | null>(null);

  // Derived objects
  const category = services.find(s => s.id === categoryId) ?? null;
  const product  = products.find(p => p.id === productId)  ?? null;
  const variant  = product?.variants.find(v => v.id === variantId) ?? null;

  const level = variantId ? "detail" : productId ? "variants" : categoryId ? "products" : "categories";

  useEffect(() => {
    Promise.all([getProducts(), getServices(), getGroups()])
      .then(([prods, svcs, grps]) => { setProducts(prods); setServices(svcs); setGroups(grps); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function updateProduct(updated: Product) {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  }

  // Breadcrumb crumbs for each level
  const crumbs = [
    { label: "Categories", onClick: level !== "categories" ? () => { setCategoryId(null); setProductId(null); setVariantId(null); } : undefined },
    ...(category ? [{ label: category.name, onClick: level !== "products" ? () => { setProductId(null); setVariantId(null); } : undefined }] : []),
    ...(product  ? [{ label: product.name,  onClick: level !== "variants" ? () => { setVariantId(null); } : undefined }] : []),
    ...(variant  ? [{ label: variant.variant_name }] : []),
  ];

  // Page title for each level
  const subtitle: Record<typeof level, string> = {
    categories: "Select a category to get started",
    products:   `Products in ${category?.name ?? ""}`,
    variants:   `Variants of ${product?.name ?? ""}`,
    detail:     `${variant?.variant_name ?? ""} — ${product?.name ?? ""}`,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen gap-3 text-gray-400">
      <Spinner /> <span>Loading…</span>
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center space-y-2">
        <p className="text-red-500 font-semibold">Could not connect to database</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* App header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">M</div>
        <div className="min-w-0 flex-1">
          <Breadcrumb crumbs={crumbs} />
          <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle[level]}</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        {level === "categories" && (
          <CategoriesView
            services={services} products={products}
            onSelect={s => setCategoryId(s.id)}
            onCreated={s => setServices(prev => [...prev, s])}
            onDeleted={id => setServices(prev => prev.filter(s => s.id !== id))}
          />
        )}

        {level === "products" && category && (
          <ProductsView
            category={category}
            products={products.filter(p => p.service_id === category.id)}
            groups={groups}
            onSelect={p => setProductId(p.id)}
            onCreated={p => { setProducts(prev => [p, ...prev]); }}
            onDeleted={id => {
              setProducts(prev => prev.filter(p => p.id !== id));
              if (productId === id) setProductId(null);
            }}
            onProductChanged={updated => setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))}
            onBack={() => setCategoryId(null)}
          />
        )}

        {level === "variants" && product && (
          <VariantsView
            product={product}
            onSelect={v => setVariantId(v.id)}
            onAdded={v => updateProduct({ ...product, variants: [...product.variants, v] })}
            onRenamed={(id, name) => updateProduct({
              ...product,
              variants: product.variants.map(v => v.id === id ? { ...v, variant_name: name } : v),
            })}
            onDeleted={id => {
              const rest = product.variants.filter(v => v.id !== id);
              updateProduct({ ...product, variants: rest });
              if (variantId === id) setVariantId(null);
            }}
            onBack={() => setProductId(null)}
          />
        )}

        {level === "detail" && product && variant && (
          <VariantDetailView
            key={variant.id}
            product={product}
            variant={variant}
            onOptionsChange={opts => {
              const updatedVariants = product.variants.map(v => v.id === variant.id ? { ...v, options: opts } : v);
              updateProduct({ ...product, variants: updatedVariants });
            }}
            onBack={() => setVariantId(null)}
          />
        )}
      </main>
    </div>
  );
}
