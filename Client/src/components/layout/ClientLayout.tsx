"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { notify } from "@/utils/notifications";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isInitialized } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            notify.lock();
            router.replace("/login");
        }
    }, [isAuthenticated, isInitialized, router]);

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
