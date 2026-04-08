"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TEMPLATES, TEMPLATE_CATEGORIES, SERVICES } from "@/constants";
import { useAuthStore } from "@/store/authStore";
import { notify } from "@/utils/notifications";
import { FiUploadCloud, FiGrid, FiEdit3, FiChevronRight, FiAward } from "react-icons/fi";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";

interface MyDesignSubmission {
    submissionId: string;
    title: string | null;
    status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
    submittedAt: string;
    feedbackMessage: string | null;
    designCode: string | null;
    approvedAt: string | null;
}

const categoryInitials: Record<string, string> = {
    "Visiting Cards": "VC",
    "Letterheads": "LH",
    "Envelopes": "EN",
    "ID Cards": "ID",
    "Garment Tags": "GT",
};

const getCategoryTheme = (category: string) => {
    switch (category) {
        case "Visiting Cards": return "bg-[#fde8e8]";
        case "Letterheads": return "bg-[#e8f0fe]";
        case "Envelopes": return "bg-[#fef3e8]";
        case "ID Cards": return "bg-[#e8fdf0]";
        case "Garment Tags": return "bg-[#fde8ff]";
        default: return "bg-[#f1f5f9]";
    }
};

type Tab = "free" | "custom" | "mydesigns";

function TemplatesContent() {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();
    const tabParam = (searchParams.get("tab") as Tab) ?? "free";
    const [activeTab, setActiveTab] = useState<Tab>(tabParam);

    // Sync whenever the URL ?tab param changes (e.g. navigating from free → mydesigns)
    useEffect(() => {
        setActiveTab(tabParam);
    }, [tabParam]);
    const [activeCategory, setActiveCategory] = useState("All");
    const [customDesignType, setCustomDesignType] = useState("");
    const [customDesignFile, setCustomDesignFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [myDesigns, setMyDesigns] = useState<MyDesignSubmission[]>([]);
    const [myDesignsLoading, setMyDesignsLoading] = useState(false);
    const [myDesignsError, setMyDesignsError] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab !== "mydesigns") return;
        const fetchMyDesigns = async () => {
            setMyDesignsLoading(true);
            setMyDesignsError(null);
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("mk_token") : null;
                const res = await fetch(`${API_BASE}/design-submissions/my`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "Failed to load designs");
                setMyDesigns(json.data?.items || []);
            } catch (err: any) {
                setMyDesignsError(err.message || "Failed to load designs");
            } finally {
                setMyDesignsLoading(false);
            }
        };
        fetchMyDesigns();
    }, [activeTab]);

    const categories = ["All", ...TEMPLATE_CATEGORIES];
    const filtered = activeCategory === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === activeCategory);

    const handleDownload = (imageSrc: string, name: string) => {
        const link = document.createElement("a");
        link.href = imageSrc;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        notify.success(`"${name}" download started!`);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setCustomDesignFile(file);
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleRemoveFile = () => {
        setCustomDesignFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    };

    const handleCustomDesign = async () => {
        if (!customDesignType) {
            notify.error("Please select a design type first.");
            return;
        }
        if (!customDesignFile) {
            notify.error("Please attach your design image file.");
            return;
        }

        setIsSending(true);
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("mk_token") : null;
            if (!token) {
                notify.error("Please log in to submit a design.");
                return;
            }

            const formData = new FormData();
            formData.append("file", customDesignFile);
            formData.append("title", customDesignType);

            const res = await fetch(`${API_BASE}/design-submissions`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Submission failed");

            notify.success("Design submitted successfully! You will receive a design code via email once approved.");
            setCustomDesignFile(null);
            setCustomDesignType("");
            if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
        } catch (err: any) {
            notify.error(err.message || "Failed to submit design. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const sidebarItems: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
        {
            id: "free",
            label: "Free Design Templates",
            icon: <FiGrid className="w-5 h-5" />,
            description: "Browse & download ready-made templates",
        },
        {
            id: "custom",
            label: "Submit Custom Design",
            icon: <FiEdit3 className="w-5 h-5" />,
            description: "Upload your own design & send to admin",
        },
        {
            id: "mydesigns",
            label: "My Designs",
            icon: <FiAward className="w-5 h-5" />,
            description: "View your submitted & approved designs",
        },
    ];

    return (
        <div className="p-4 sm:p-6 md:p-8 lg:p-10">
            {/* Page Header */}
            <div className="text-center pb-2 mb-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Design Centre</h2>
                <div className="h-[4px] mt-3 rounded-full w-20 sm:w-28 md:w-32 bg-blue-500 my-4 mx-auto" />
                <p className="max-w-full md:max-w-xl text-center mx-auto text-[#64748b] text-[0.93rem] md:text-[0.875rem] mt-1.5">
                    Browse our free professional templates or submit your own custom design to get started.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-[0.7rem] font-semibold tracking-[0.08em] text-[#94a3b8] uppercase">
                    <span>Home</span>
                    <span>/</span>
                    <span className="text-[#1a56db]">Design Centre</span>
                </div>
            </div>

            {/* Two-column layout: Sidebar + Content */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* ── Sidebar ── */}
                <aside className="lg:w-64 xl:w-72 shrink-0">
                    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-gradient-to-r from-[#1a56db] to-[#2563eb]">
                            <p className="text-white font-bold text-[0.8rem] uppercase tracking-widest">Options</p>
                        </div>
                        <nav className="p-2 flex flex-row lg:flex-col gap-2">
                            {sidebarItems.map((item) => {
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group cursor-pointer ${isActive
                                            ? "bg-gradient-to-r from-[#1a56db] to-[#2563eb] text-white shadow-md"
                                            : "hover:bg-[#f1f5f9] text-[#475569]"
                                            }`}
                                    >
                                        <span className={`shrink-0 ${isActive ? "text-white" : "text-[#1a56db]"}`}>
                                            {item.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-bold text-[0.8rem] leading-tight ${isActive ? "text-white" : "text-[#0f172a]"}`}>
                                                {item.label}
                                            </p>
                                            <p className={`text-[0.68rem] mt-0.5 hidden sm:block ${isActive ? "text-blue-100" : "text-[#94a3b8]"}`}>
                                                {item.description}
                                            </p>
                                        </div>
                                        <FiChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "text-white translate-x-0.5" : "text-[#cbd5e1] group-hover:text-[#1a56db]"}`} />
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Info card */}
                        <div className="mx-3 mb-3 p-3 bg-[#f0f4ff] rounded-xl border border-[#c7d9fd]">
                            <p className="text-[0.72rem] font-semibold text-[#1a56db] mb-1">Tip</p>
                            <p className="text-[0.7rem] text-[#475569] leading-relaxed">
                                Download a free template, customize it, then submit it as a Custom Design!
                            </p>
                        </div>
                    </div>
                </aside>

                {/* ── Main Content ── */}
                <div className="flex-1 min-w-0">

                    {/* ══ FREE TEMPLATES TAB ══ */}
                    {activeTab === "free" && (
                        <div>
                            {/* Tab header */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a56db] to-[#2563eb] flex items-center justify-center">
                                    <FiGrid className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-[1.05rem] text-[#0f172a]">Free Design Templates</h3>
                                    <p className="text-[0.75rem] text-[#64748b]">Download and customize for your brand</p>
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="flex gap-2 flex-wrap mb-6">
                                {categories.map((cat) => {
                                    const isActive = activeCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setActiveCategory(cat)}
                                            className={`px-3 py-1 md:px-[1.125rem] md:py-[0.4rem] rounded-[50px] font-semibold text-[0.78rem] cursor-pointer transition-all duration-200 border-[1.5px] ${isActive
                                                ? "border-transparent bg-gradient-to-r from-[#1a56db] to-[#2563eb] text-white"
                                                : "border-[#e2e8f0] bg-white text-[#475569] hover:bg-gray-50"
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Template Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                                {filtered.map((template) => (
                                    <div key={template.id} className="card overflow-hidden">
                                        <div className={`h-[110px] sm:h-[130px] ${getCategoryTheme(template.category)} flex flex-col items-center justify-center gap-2 relative overflow-hidden cursor-pointer`}>
                                            {template.image ? (
                                                <Image src={template.image} alt={template.name} fill className="object-cover" />
                                            ) : (
                                                <>
                                                    <span className="text-[1.1rem] font-black text-[#475569] tracking-widest">{categoryInitials[template.category] || "TP"}</span>
                                                    <span className="text-[0.6rem] bg-black/[0.06] px-2 py-0.5 rounded font-semibold text-[#475569]">TEMPLATE</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="p-2.5 sm:p-3.5">
                                            <h3 className="font-bold text-[0.83rem] text-[#0f172a] mb-1">{template.name}</h3>
                                            <p className="text-[0.68rem] text-[#e91e8c] font-semibold mb-3">Free Design Available</p>
                                            <button
                                                type="button"
                                                className="btn-primary w-full py-1.5 px-2 text-[0.7rem] font-bold"
                                                onClick={() => template.image
                                                    ? handleDownload(template.image, template.name)
                                                    : notify.error("No image available to download.")
                                                }
                                            >
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA to switch to custom tab */}
                            <div className="mt-8 p-4 bg-gradient-to-r from-[#f0f4ff] to-[#fde8ff] rounded-2xl border border-[#c7d9fd] flex flex-col sm:flex-row items-center gap-4">
                                <div className="flex-1">
                                    <p className="font-bold text-[0.9rem] text-[#0f172a]">Have your own design ready?</p>
                                    <p className="text-[0.78rem] text-[#64748b] mt-0.5">Upload it and submit directly to our admin for review.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("custom")}
                                    className="btn-primary py-2 px-5 text-[0.82rem] whitespace-nowrap shrink-0"
                                >
                                    Submit Custom Design
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ══ MY DESIGNS TAB ══ */}
                    {activeTab === "mydesigns" && (
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center">
                                    <FiAward className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-[1.05rem] text-[#0f172a]">My Designs</h3>
                                    <p className="text-[0.75rem] text-[#64748b]">Track your submitted and approved designs</p>
                                </div>
                            </div>

                            {myDesignsLoading && (
                                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center text-[#94a3b8] text-sm animate-pulse">
                                    Loading your designs…
                                </div>
                            )}
                            {myDesignsError && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">
                                    {myDesignsError}
                                </div>
                            )}
                            {!myDesignsLoading && !myDesignsError && myDesigns.length === 0 && (
                                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
                                    <FiAward className="w-10 h-10 text-[#cbd5e1] mx-auto mb-3" />
                                    <p className="font-semibold text-[#475569]">No designs submitted yet</p>
                                    <p className="text-[0.78rem] text-[#94a3b8] mt-1">Submit a custom design to get started.</p>
                                    <button type="button" onClick={() => setActiveTab("custom")} className="btn-primary mt-4 py-2 px-5 text-[0.82rem]">
                                        Submit a Design
                                    </button>
                                </div>
                            )}
                            {!myDesignsLoading && !myDesignsError && myDesigns.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    {myDesigns.map((d) => {
                                        const statusMap = {
                                            PENDING_REVIEW: { label: "Pending Review", bg: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
                                            APPROVED: { label: "Approved", bg: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
                                            REJECTED: { label: "Rejected", bg: "bg-red-100 text-red-700", dot: "bg-red-500" },
                                        };
                                        const s = statusMap[d.status] || statusMap.PENDING_REVIEW;
                                        return (
                                            <div key={d.submissionId} className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-bold text-[0.95rem] text-[#0f172a] truncate">
                                                            {d.title || "Untitled Design"}
                                                        </p>
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold ${s.bg}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                                            {s.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-[0.75rem] text-[#94a3b8] mt-1">
                                                        Submitted: {new Date(d.submittedAt).toLocaleDateString()}
                                                    </p>
                                                    {d.status === "REJECTED" && d.feedbackMessage && (
                                                        <p className="mt-2 text-[0.75rem] text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                                                            Feedback: {d.feedbackMessage}
                                                        </p>
                                                    )}
                                                </div>
                                                {d.status === "APPROVED" && d.designCode && (
                                                    <div className="shrink-0 bg-[#f0f4ff] border border-[#c7d9fd] rounded-xl px-4 py-3 text-center">
                                                        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#64748b] mb-1">Design Code</p>
                                                        <p className="font-mono font-extrabold text-[1rem] text-[#1a56db] tracking-widest">{d.designCode}</p>
                                                        <p className="text-[0.65rem] text-[#94a3b8] mt-0.5">Use this in your order</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ══ CUSTOM DESIGN TAB ══ */}
                    {activeTab === "custom" && (
                        <div>
                            {/* Tab header */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center">
                                    <FiEdit3 className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-[1.05rem] text-[#0f172a]">Submit Custom Design</h3>
                                    <p className="text-[0.75rem] text-[#64748b]">Upload your finalized design & submit to admin for review</p>
                                </div>
                            </div>

                            {/* Steps */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
                                {["Download a template", "Edit in design software", "Upload & Send to admin"].map((step, i) => (
                                    <div key={i} className="bg-white rounded-xl p-4 text-center border border-[#e2e8f0] shadow-sm">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a56db] to-[#2563eb] text-white text-[0.72rem] font-bold flex items-center justify-center mx-auto mb-2">
                                            {i + 1}
                                        </div>
                                        <div className="text-[0.82rem] font-semibold text-[#0f172a]">{step}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Form card */}
                            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5 sm:p-7">

                                {/* Design Type */}
                                <div className="form-group mb-5">
                                    <label className="form-label">Design Type <span className="text-red-500">*</span></label>
                                    <select
                                        value={customDesignType}
                                        onChange={(e) => setCustomDesignType(e.target.value)}
                                        aria-label="Design type"
                                        className="form-input appearance-none"
                                    >
                                        <option value="">Select design type…</option>
                                        {SERVICES.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>

                                {/* File Upload */}
                                <div className="form-group mb-6">
                                    <label className="form-label">Attach Design Image <span className="text-red-500">*</span></label>

                                    {!customDesignFile ? (
                                        <label className="flex flex-col items-center justify-center gap-2 py-10 px-4 rounded-xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] cursor-pointer hover:border-[#1a56db] hover:bg-[#eff6ff] transition-colors">
                                            <FiUploadCloud className="w-8 h-8 text-[#1a56db]" />
                                            <span className="text-[0.85rem] font-semibold text-[#475569]">Click to upload your design</span>
                                            <span className="text-[0.72rem] text-[#94a3b8]">PNG, JPG, PDF up to 10MB</span>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                    ) : (
                                        <div className="rounded-xl border border-[#c7d9fd] bg-[#f0f4ff] p-4 flex gap-4 items-start">
                                            {/* Image preview */}
                                            {previewUrl && (
                                                <img
                                                    src={previewUrl}
                                                    alt="Design preview"
                                                    className="w-20 h-20 object-cover rounded-lg border border-[#e2e8f0] shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-[0.85rem] text-[#0f172a] truncate">{customDesignFile.name}</p>
                                                <p className="text-[0.72rem] text-[#64748b] mt-0.5">
                                                    {(customDesignFile.size / 1024).toFixed(1)} KB &bull; Ready to send
                                                </p>
                                                <div className="flex items-center gap-1 mt-1.5">
                                                    <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                                        File selected
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-[#94a3b8] hover:text-red-500 transition-colors cursor-pointer"
                                                title="Remove file"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Submission note */}
                                <div className="flex items-start gap-3 p-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl mb-6">
                                    <p className="text-[0.78rem] text-[#166534] leading-relaxed">
                                        <strong>How it works:</strong> Click Submit to upload your design for admin review. Once approved, your <strong>Design Code</strong> will be sent to your registered email address.
                                    </p>
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCustomDesign}
                                        disabled={isSending}
                                        className="btn-primary flex-1 py-3 px-6 text-[0.88rem] font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isSending ? "Submitting…" : "Submit Design for Review"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("free")}
                                        className="py-3 px-5 rounded-xl border border-[#e2e8f0] text-[0.82rem] font-semibold text-[#475569] hover:bg-[#f8fafc] transition-colors cursor-pointer"
                                    >
                                        ← Back to Templates
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TemplatesPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center text-[#94a3b8]">Loading…</div>}>
            <TemplatesContent />
        </Suspense>
    );
}
