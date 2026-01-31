"use client";

import Link from "next/link";
import { MoveLeft, Zap } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-bg-base">
            <header className="border-b border-border bg-bg-base/95">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors">
                        <MoveLeft className="w-4 h-4 mr-2" /> Back to Home
                    </Link>
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-text-primary">OutreachPro</span>
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold text-text-primary mb-2">Privacy Policy</h1>
                <p className="text-text-muted text-sm mb-10">Last updated: January 2026</p>

                <div className="space-y-8 text-text-secondary">
                    <section>
                        <h2 className="text-lg font-semibold text-text-primary mb-3">1. Information We Collect</h2>
                        <p className="text-sm leading-relaxed">
                            We collect information you provide when you sign up (e.g. name, email via Google OAuth), usage data related to your campaigns (contacts, email drafts, send status), and payment information processed securely through Stripe. We do not store your credit card details.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-text-primary mb-3">2. How We Use Your Information</h2>
                        <p className="text-sm leading-relaxed">
                            We use your information to provide and improve OutreachPro (authentication, AI personalization, Gmail integration, credits and billing), to communicate with you about your account, and to comply with legal obligations.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-text-primary mb-3">3. Data Sharing</h2>
                        <p className="text-sm leading-relaxed">
                            We do not sell your personal data. We may share data with service providers (e.g. hosting, email delivery, payment processing) under strict agreements. We may disclose information if required by law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-text-primary mb-3">4. Security</h2>
                        <p className="text-sm leading-relaxed">
                            We use industry-standard measures to protect your data (encryption, secure APIs, access controls). You are responsible for keeping your login credentials secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-text-primary mb-3">5. Your Rights</h2>
                        <p className="text-sm leading-relaxed">
                            You may access, correct, or delete your account data from the dashboard or by contacting us. You may withdraw consent where applicable. Residents of certain regions may have additional rights (e.g. GDPR, CCPA).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-text-primary mb-3">6. Contact</h2>
                        <p className="text-sm leading-relaxed">
                            For privacy-related questions, contact us at the support or contact email provided on our website.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex gap-6 text-sm">
                    <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>
                    <Link href="/" className="text-text-muted hover:text-text-primary">Home</Link>
                </div>
            </main>
        </div>
    );
}
