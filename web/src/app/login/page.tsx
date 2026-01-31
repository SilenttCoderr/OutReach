"use client";

import Link from "next/link";
import { MoveLeft, Zap } from "lucide-react";

export default function LoginPage() {
    const handleGoogleLogin = () => {
        const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
        window.location.href = base ? `${base}/api/auth/google` : "/api/auth/google";
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base p-4">
            <div className="w-full max-w-md animate-in">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors mb-8"
                >
                    <MoveLeft className="w-4 h-4 mr-2" /> Back to Home
                </Link>

                {/* Card */}
                <div className="card p-8 space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-3">
                        <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto">
                            <Zap className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary">Welcome Back</h1>
                        <p className="text-text-secondary text-sm">Sign in to manage your campaigns</p>
                    </div>

                    {/* Google Login */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full h-12 bg-white text-black rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors font-medium"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-bg-surface px-3 text-text-muted">Or with email</span>
                        </div>
                    </div>

                    {/* Form */}
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-primary" htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                className="input h-11"
                                placeholder="name@company.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-text-primary" htmlFor="password">Password</label>
                                <Link href="#" className="text-xs text-accent hover:underline">Forgot password?</Link>
                            </div>
                            <input
                                id="password"
                                type="password"
                                className="input h-11"
                            />
                        </div>
                        <button type="submit" className="btn-primary w-full h-11">
                            Sign In
                        </button>
                    </form>

                    {/* Sign Up */}
                    <p className="text-center text-sm text-text-secondary">
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-accent hover:underline font-medium">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
