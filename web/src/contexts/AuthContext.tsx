"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { checkAuthStatus, type AuthStatus } from "@/services/api";

interface AuthContextValue {
    status: AuthStatus | null;
    loading: boolean;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    status: null,
    loading: true,
    refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<AuthStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const result = await checkAuthStatus();
            setStatus(result);
        } catch {
            setStatus({ authenticated: false });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return (
        <AuthContext.Provider value={{ status, loading, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    return useContext(AuthContext);
}
