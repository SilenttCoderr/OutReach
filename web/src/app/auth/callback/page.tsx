"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { setAuthToken, syncTokenCookie } from "@/services/api";

function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        if (token) {
            setAuthToken(token);
            syncTokenCookie(token);
            // Full page navigation so dashboard loads with token visible (fixes redirect-to-login race)
            window.location.assign("/dashboard");
        } else if (error) {
            // Redirect to login with error
            router.push(`/login?error=${encodeURIComponent(error)}`);
        } else {
            // Fallback
            router.push("/login");
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card text-center space-y-4 p-8 max-w-sm w-full"
            >
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                <h2 className="text-xl font-semibold text-text-primary">Authenticating...</h2>
                <p className="text-text-secondary">Please wait while we log you in.</p>
            </motion.div>
        </div>
    );
}

export default function CallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-bg-base" />}>
            <AuthCallback />
        </Suspense>
    );
}
