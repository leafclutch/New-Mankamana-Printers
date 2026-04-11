"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { notify } from "@/utils/notifications";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isInitialized, logout } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            notify.lock();
            router.replace("/login");
        }
    }, [isAuthenticated, isInitialized, router]);

    // Intercept any 403 "deactivated" response globally — auto-logout and redirect
    useEffect(() => {
        const original = window.fetch;
        window.fetch = async (...args) => {
            const res = await original(...args);
            if (res.status === 403 && isAuthenticated) {
                const clone = res.clone();
                clone.json().then((data) => {
                    if (typeof data?.message === "string" && data.message.toLowerCase().includes("deactivated")) {
                        notify.error("Your account has been deactivated. Please contact the printer.");
                        logout().then(() => router.replace("/login"));
                    }
                }).catch(() => {});
            }
            return res;
        };
        return () => { window.fetch = original; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    if (!isInitialized || !isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
            <Navbar />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
}
