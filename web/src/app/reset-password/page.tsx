"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/services/api";
import { AuthCard } from "@/components/ui/auth-card";
import { StatusBanner } from "@/components/ui/status-banner";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }
        setSubmitting(true);
        try {
            await resetPassword(token, password);
            setDone(true);
            setTimeout(() => router.push("/login"), 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Reset failed. Request a new link.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="space-y-4">
                <StatusBanner type="error" title="Invalid link" message="This reset link is missing its token. Please request a new one." />
                <Link href="/forgot-password" className="btn-secondary w-full h-11">Request a new link</Link>
            </div>
        );
    }

    if (done) {
        return (
            <div className="space-y-4">
                <StatusBanner type="success" message="Password updated. Redirecting to login..." />
                <Link href="/login" className="btn-secondary w-full h-11">Go to login</Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <StatusBanner type="error" message={error} />}
            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-text-primary">New password</label>
                <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input h-11"
                    placeholder="At least 8 characters"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="confirm" className="text-sm font-medium text-text-primary">Confirm password</label>
                <input
                    id="confirm"
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="input h-11"
                    placeholder="Re-enter password"
                />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full h-11">
                {submitting ? "Updating..." : "Update password"}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base p-4">
            <div className="w-full max-w-md animate-in">
                <AuthCard title="Set a new password" description="Choose a new password for your account.">
                    <Suspense fallback={null}>
                        <ResetPasswordForm />
                    </Suspense>
                </AuthCard>
            </div>
        </div>
    );
}
