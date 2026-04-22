"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, ClipboardList, Menu, Moon, Palette, Search, Sun, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/shared/theme-provider";
import { cachedJsonFetch, invalidateCacheKey } from "@/lib/requestCache";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingRegistrations, setPendingRegistrations] = useState(0);
  const [pendingDesigns, setPendingDesigns] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const json = await cachedJsonFetch<{ data?: { pending_registrations?: number; pending_designs?: number } }>("dashboard-stats", "/api/admin/dashboard/stats", 8000);
        const d = json?.data;
        if (d) {
          const regs = d.pending_registrations || 0;
          const designs = d.pending_designs || 0;
          setPendingRegistrations(regs);
          setPendingDesigns(designs);
          setPendingCount(regs + designs);
        }
      } catch {
        // non-blocking
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 15000);

    const refreshNow = () => {
      invalidateCacheKey("dashboard-stats");
      void fetchPending();
    };
    window.addEventListener("stats-updated", refreshNow);
    const onVisible = () => { if (!document.hidden) fetchPending(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener("stats-updated", refreshNow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="mr-2 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="flex w-full max-w-sm items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders, clients…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#0061FF] focus:bg-white focus:ring-2 focus:ring-[#0061FF]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#0061FF] dark:focus:bg-slate-800"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4.5 w-4.5" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </button>

        {/* Notifications */}
        <div ref={bellRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label={`Notifications${pendingCount > 0 ? ` — ${pendingCount} pending` : ""}`}
            className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Bell className="h-4.5 w-4.5" />
            {pendingCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {pendingCount > 99 ? "99" : pendingCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notifications</span>
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  aria-label="Close notifications"
                  className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {pendingCount === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                  No pending items
                </div>
              ) : (
                <div className="py-1">
                  {pendingRegistrations > 0 && (
                    <button
                      type="button"
                      onClick={() => { router.push("/registration-requests"); setNotifOpen(false); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Registration Requests</p>
                        <p className="text-xs text-slate-400">{pendingRegistrations} awaiting approval</p>
                      </div>
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                        {pendingRegistrations}
                      </span>
                    </button>
                  )}
                  {pendingDesigns > 0 && (
                    <button
                      type="button"
                      onClick={() => { router.push("/design-approval"); setNotifOpen(false); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                        <Palette className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Design Reviews</p>
                        <p className="text-xs text-slate-400">{pendingDesigns} awaiting review</p>
                      </div>
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-500 px-1 text-[10px] font-bold text-white">
                        {pendingDesigns}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mx-2 h-5 w-px bg-slate-200 dark:bg-slate-700" />

        {/* User */}
        <button
          type="button"
          aria-label="Admin user menu"
          className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0061FF]/10 text-[11px] font-bold text-[#0061FF]">
            AD
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Admin</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:text-slate-600" />
        </button>
      </div>
    </header>
  );
}
