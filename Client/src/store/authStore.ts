import { create } from "zustand";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";

export interface AuthUser {
    id: string;
    clientId: string;
    businessName: string;
    ownerName: string;
    email: string;
    phoneNumber: string;
}

interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
    login: (phoneNumber: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
    initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isInitialized: false,

    login: async (phoneNumber: string, password: string) => {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone_number: phoneNumber, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                return { success: false, message: data.message || "Invalid credentials" };
            }
            // API returns { message, token, client } at root level
            const token: string = data.token;
            const raw = data.client;
            if (!token || !raw) {
                return { success: false, message: "Unexpected response from server." };
            }
            const user: AuthUser = {
                id: raw.id,
                clientId: raw.client_code || raw.phone,
                businessName: raw.business_name,
                ownerName: raw.owner_name || raw.business_name,
                email: raw.email || "",
                phoneNumber: raw.phone,
            };
            if (typeof window !== "undefined") {
                localStorage.setItem("mk_token", token);
                localStorage.setItem("mk_auth_user", JSON.stringify(user));
            }
            set({ user, token, isAuthenticated: true });
            return { success: true };
        } catch {
            return { success: false, message: "Network error. Please try again." };
        }
    },

    logout: async () => {
        const { token } = get();
        if (token) {
            fetch(`${API_BASE}/auth/logout`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
        }
        if (typeof window !== "undefined") {
            localStorage.removeItem("mk_token");
            localStorage.removeItem("mk_auth_user");
        }
        set({ user: null, token: null, isAuthenticated: false });
    },

    initialize: () => {
        if (typeof window !== "undefined") {
            const storedToken = localStorage.getItem("mk_token");
            const storedUser = localStorage.getItem("mk_auth_user");
            if (storedToken && storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    set({ user: parsedUser, token: storedToken, isAuthenticated: true, isInitialized: true });
                    return;
                } catch {
                    // ignore parse errors
                }
            }
        }
        set({ isInitialized: true });
    },
}));

// Helper to get auth headers for fetch calls
export const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("mk_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};
