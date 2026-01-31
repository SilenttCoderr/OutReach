"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        if (token) {
            // Store token
            localStorage.setItem("token", token);
            // Redirect to dashboard
            router.push("/dashboard");
        } else if (error) {
            // Redirect to login with error
            router.push(`/login?error=${encodeURIComponent(error)}`);
        } else {
            // Fallback
            router.push("/login");
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/5">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4"
            >
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <h2 className="text-xl font-semibold">Authenticating...</h2>
                <p className="text-muted-foreground">Please wait while we log you in.</p>
            </motion.div>
        </div>
    );
}

export default function CallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthCallback />
        </Suspense>
    );
}
