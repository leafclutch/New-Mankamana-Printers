"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_mk_sid");
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem("_mk_sid", sid);
  }
  return sid;
}

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) return;
    fetch(`${API_BASE}/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, sessionId: sid }),
    }).catch(() => {}); // fire-and-forget
  }, [pathname]);

  return null;
}
