"use client";

import { useState, useEffect } from "react";
import { useAuthStore, getAuthHeaders } from "@/store/authStore";
import { notify } from "@/utils/notifications";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";

interface ProfileData {
    id: string;
    client_code?: string;
    phone_number: string;
    business_name: string;
    owner_name: string;
    email: string;
    address?: string;
    status: string;
}

export default function ProfilePage() {
    const { user } = useAuthStore();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        business_name: "",
        owner_name: "",
        email: "",
        address: "",
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_BASE}/user/profile`, { headers: getAuthHeaders() });
                const data = await res.json();
                if (res.ok && data.data) {
                    const p: ProfileData = data.data;
                    setProfile(p);
                    setForm({
                        business_name: p.business_name || "",
                        owner_name: p.owner_name || "",
                        email: p.email || "",
                        address: p.address || "",
                    });
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/user/profile`, {
                method: "PATCH",
                headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                notify.error(data.message || "Failed to update profile");
                return;
            }
            setProfile(data.data);
            setEditing(false);
            notify.success("Profile updated successfully!");
        } catch {
            notify.error("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const displayName = profile?.owner_name || user?.ownerName || "C";

    return (
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
            <div className="mb-8">
                <h1 className="text-xl max-sm:text-center sm:text-2xl font-extrabold text-[#0f172a]">My Profile</h1>
                <p className="text-[#64748b] max-sm:text-center text-sm sm:text-base mt-1">
                    View and manage your company account details.
                </p>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center text-[#94a3b8]">
                    Loading profile…
                </div>
            ) : (
                <div className="flex flex-col gap-7 max-sm:items-center md:grid md:grid-cols-[320px_1fr] md:gap-7 items-start">
                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden mb-5 md:mb-0 w-full">
                        <div className="gradient-card p-8 sm:p-10 text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 text-2xl sm:text-3xl text-white font-extrabold border-[3px] border-white/40">
                                {displayName[0]?.toUpperCase() || "C"}
                            </div>
                            <h2 className="text-white font-extrabold text-base sm:text-lg tracking-wide">
                                {profile?.business_name || user?.businessName}
                            </h2>
                            <p className="text-white/75 text-xs sm:text-sm mt-1">
                                {profile?.email || user?.email}
                            </p>
                        </div>
                        <div className="p-5 sm:p-6">
                            <div className="flex flex-col gap-3">
                                <div className="p-3 bg-[#f0f4ff] rounded-[10px] border border-[#c7d9fd]">
                                    <div className="text-[0.65rem] font-bold text-[#4361ee] tracking-wider uppercase mb-1">
                                        Client ID
                                    </div>
                                    <div className="text-lg font-extrabold text-[#0f172a] tracking-wide">
                                        {profile?.client_code || user?.clientId}
                                    </div>
                                </div>
                                <div className="p-3 bg-[#f8fafc] rounded-[10px] border border-[#e2e8f0]">
                                    <div className="text-[0.65rem] font-bold text-[#64748b] tracking-wider uppercase mb-1">
                                        Phone
                                    </div>
                                    <div className="text-[0.9rem] font-semibold text-[#0f172a]">
                                        {profile?.phone_number || user?.phoneNumber}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-[#94a3b8] mb-1">Account Status</div>
                                    <span className="badge bg-[#dcfce7] text-[#16a34a]">
                                        ● {profile?.status === "active" ? "Active" : profile?.status || "Active"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details Form */}
                    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-7 w-full">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                            <h2 className="font-bold text-base sm:text-lg text-[#0f172a]">Company Details</h2>
                            {editing ? (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditing(false)}
                                        className="btn-outline-dark py-2 px-4 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={saving}
                                        className={`btn-primary py-2 px-5 text-sm ${saving ? "opacity-70" : ""}`}
                                    >
                                        {saving ? "Saving…" : "Save Changes"}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setEditing(true)}
                                    className="btn-outline-dark py-2 px-5 text-sm"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {[
                                { label: "Business Name", name: "business_name" as const },
                                { label: "Owner Name", name: "owner_name" as const },
                                { label: "Email Address", name: "email" as const },
                            ].map(({ label, name }) => (
                                <div key={name} className="form-group flex flex-col">
                                    <label htmlFor={`field-${name}`} className="form-label mb-1">{label}</label>
                                    <input
                                        id={`field-${name}`}
                                        className={`form-input text-sm ${
                                            editing
                                                ? "bg-[#f8fafc] cursor-text focus:ring-2 focus:ring-[#1a56db] focus:border-[#1a56db] outline-none"
                                                : "bg-[#f1f5f9] cursor-not-allowed"
                                        }`}
                                        value={form[name]}
                                        onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
                                        disabled={!editing}
                                    />
                                </div>
                            ))}
                            <div className="form-group flex flex-col">
                                <label htmlFor="field-phone" className="form-label mb-1">Phone Number</label>
                                <input
                                    id="field-phone"
                                    className="form-input text-sm bg-[#f1f5f9] cursor-not-allowed"
                                    value={profile?.phone_number || user?.phoneNumber || ""}
                                    disabled
                                />
                            </div>
                            <div className="form-group col-span-1 sm:col-span-2 flex flex-col">
                                <label htmlFor="field-address" className="form-label mb-1">Business Address</label>
                                <input
                                    id="field-address"
                                    className={`form-input text-sm ${
                                        editing
                                            ? "bg-[#f8fafc] cursor-text focus:ring-2 focus:ring-[#1a56db] focus:border-[#1a56db] outline-none"
                                            : "bg-[#f1f5f9] cursor-not-allowed"
                                    }`}
                                    value={form.address}
                                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                                    disabled={!editing}
                                    placeholder="e.g. Kathmandu, Nepal"
                                />
                            </div>
                        </div>

                        <div className="mt-7 p-4 sm:p-5 bg-[#f8fafc] rounded-[10px] border border-[#e2e8f0]">
                            <h3 className="font-bold text-sm sm:text-base text-[#0f172a] mb-2">Need to change your password?</h3>
                            <p className="text-[#64748b] text-xs sm:text-sm leading-relaxed">
                                Passwords are managed by admin. Please contact us via email to reset your Client ID or password.
                            </p>
                            <a
                                href={`mailto:roshan.kr.singh9857@gmail.com?subject=Password Reset Request&body=Hello Admin, I need help with my account (Client ID: ${profile?.client_code || user?.clientId})`}
                                className="mt-4 inline-block py-2 px-5 bg-[#0061FF] text-white rounded-lg font-bold text-sm hover:bg-[#0050d5] transition-colors"
                            >
                                Contact Admin via Email
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
