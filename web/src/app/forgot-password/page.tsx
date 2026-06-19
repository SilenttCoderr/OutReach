"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/services/api";
import { AuthCard } from "@/components/ui/auth-card";
import { StatusBanner } from "@/components/ui/status-banner";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await forgotPassword(email);
            setSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base p-4">
            <div className="w-full max-w-md animate-in">
                <AuthCard title="Reset password" description="Enter your email and we'll send you a reset link.">
                    {sent ? (
                        <div className="space-y-4">
                            <StatusBanner
                                type="success"
                                message="If an account with that email exists, a reset link is on its way. Check your inbox (and spam). The link expires in 30 minutes."
                            />
                            <Link href="/login" className="btn-secondary w-full h-11">Back to login</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && <StatusBanner type="error" message={error} />}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-text-primary">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input h-11"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <button type="submit" disabled={submitting} className="btn-primary w-full h-11">
                                {submitting ? "Sending..." : "Send reset link"}
                            </button>
                            <p className="text-center text-sm text-text-secondary">
                                <Link href="/login" className="text-accent hover:underline">Back to login</Link>
                            </p>
                        </form>
                    )}
                </AuthCard>
            </div>
        </div>
    );
}
