"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuthStore } from "@/store/authStore";
import { notify } from "@/utils/notifications";

const features = [
    { title: "Wholesale Rates", desc: "Get the best prices in the industry directly from the source." },
    { title: "Live Tracking", desc: "Real-time updates on all your print jobs from start to delivery." },
    { title: "Nepal-Wide Reach", desc: "Service available across all major cities with premium logistics." },
    { title: "Expert Support", desc: "Dedicated team available for all your custom printing needs." },
];

export default function LoginPage() {
    const [clientId, setClientId] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuthStore();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId || !password) {
            notify.error("Please enter your Client ID and password");
            return;
        }
        setLoading(true);
        const result = await login(clientId, password);
        setLoading(false);
        if (result.success) {
            notify.success("Welcome back! Redirecting to dashboard…");
            router.push('/');
        } else {
            notify.error(result.message || "Invalid Client ID or password");
        }
    };

    return (
        <>
            <Navbar />
            <div className="bg-[#f0f4ff] min-h-[calc(100vh-64px)] flex items-center justify-center py-8 px-2 sm:px-4">
                <div className="max-w-[860px] w-full bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col md:grid md:grid-cols-2">
                    {/* Left: Form */}
                    <div className="p-6 sm:p-10 flex flex-col justify-center">
                        <div className="mb-7 sm:mb-8">
                            <h1 className="text-[1.5rem] sm:text-[1.875rem] font-extrabold text-[#0f172a] mb-1.5">Welcome!</h1>
                            <p className="text-[#64748b] text-[0.92rem] sm:text-[0.875rem]">Log in to access your dashboard.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="form-group">
                                <label htmlFor="client-id" className="form-label">Phone Number or Client ID</label>
                                <input
                                    id="client-id"
                                    type="text"
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                    placeholder="e.g. 9800000000 or MP-XXXXXXXX"
                                    className="form-input"
                                    autoComplete="username"
                                />
                            </div>
                            <div className="form-group">
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="password" className="form-label mb-0">Password</label>
                                    <button type="button" className="bg-transparent border-none text-[#1a56db] text-[0.78rem] font-semibold cursor-pointer">
                                        Forgot?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="form-input pr-12"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#94a3b8] text-[0.75rem] font-semibold tracking-wide"
                                    >
                                        {showPassword ? "HIDE" : "SHOW"}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`btn-primary w-full p-3.5 text-[0.875rem] font-bold tracking-[0.08em] ${loading ? "opacity-70" : ""}`}
                            >
                                {loading ? "SIGNING IN…" : "SIGN IN"}
                            </button>
                        </form>
                    </div>

                    {/* Right: Gradient Panel */}
                    <div className="gradient-card p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute -bottom-10 -right-10 w-[110px] sm:w-[150px] md:w-[180px] h-[110px] sm:h-[150px] md:h-[180px] rounded-full bg-white/[0.06] pointer-events-none" />
                        <div>
                            <h2 className="text-white text-[1.08rem] sm:text-[1.25rem] md:text-[1.35rem] font-extrabold tracking-[0.02em] mb-5 sm:mb-7">
                                NEW USER?
                            </h2>
                            <div className="flex flex-col gap-4 sm:gap-5">
                                {features.map((f) => (
                                    <div key={f.title} className="flex gap-3 sm:gap-4 items-start">
                                        <div className="w-[38px] sm:w-[42px] h-[38px] sm:h-[42px] rounded-[10px] bg-white/[0.15] flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-[0.89rem] sm:text-[0.9rem] mb-1">{f.title}</h3>
                                            <p className="text-white/75 text-[0.78rem] leading-[1.6]">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Link
                            href="/register"
                            className="block mt-6 sm:mt-8 border-2 border-white/70 rounded-[50px] p-2.5 sm:p-3 text-center text-white font-bold text-[0.84rem] sm:text-[0.85rem] tracking-[0.08em] no-underline transition-all duration-200 hover:bg-white/10"
                        >
                            CREATE ACCOUNT
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
            <style jsx global>{`
                @media (max-width: 850px) {
                    .gradient-card {
                        border-top-left-radius: 0 !important;
                        border-bottom-left-radius: 0 !important;
                    }
                }
                @media (max-width: 767px) {
                    .gradient-card {
                        border-radius: 0 0 20px 20px !important;
                        min-height: unset !important;
                    }
                }
            `}</style>
        </>
    );
}
