"use client";

import Link from "next/link";
import { MoveLeft, Zap } from "lucide-react";

export default function TermsPage() {
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
                <h1 className="text-3xl font-bold text-text-primary mb-2">Terms of Service</h1>
                <p className="text-text-muted text-sm mb-10">Last updated: January 2026</p>

                <div className="space-y-8 text-text-secondary">
                    <section>
                        <h2 className="text-lg font-semibold text-text-primary mb-3">1. Acceptance</h2>
                        <p className="text-sm leading-relaxed">
                            By using OutreachPro (“Service”), you agree to these Terms of Service. If you do not agree, do not use the Service. We may update these terms; continued use after changes constitutes acceptance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-text-primary mb-3">2. Use of the Service</h2>
                        <p className="text-sm leading-relaxed">
                            You must use the Service in compliance with applicable laws and not for spam, fraud, or harassment. You are responsible for the content of your campaigns and for obtaining any required consent from recipients. We may suspend or terminate access for abuse or violation of these terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-text-primary mb-3">3. Account and Credits</h2>
                        <p className="text-sm leading-relaxed">
                            You must provide accurate account information. Credits purchased are non-refundable except where required by law. We reserve the right to modify pricing and credit policies with reasonable notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-text-primary mb-3">4. Intellectual Property</h2>
                        <p className="text-sm leading-relaxed">
                            OutreachPro and its content, features, and branding are owned by us or our licensors. You retain rights to your data and content. You grant us a limited license to use your content to provide the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-text-primary mb-3">5. Disclaimers</h2>
                        <p className="text-sm leading-relaxed">
                            The Service is provided “as is.” We disclaim warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee deliverability or that the Service will be error-free.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-text-primary mb-3">6. Limitation of Liability</h2>
                        <p className="text-sm leading-relaxed">
                            To the maximum extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages, or for loss of data or profits. Our total liability is limited to the amount you paid us in the twelve months before the claim.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-text-primary mb-3">7. Contact</h2>
                        <p className="text-sm leading-relaxed">
                            For questions about these terms, contact us at the support or contact email provided on our website.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex gap-6 text-sm">
                    <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
                    <Link href="/" className="text-text-muted hover:text-text-primary">Home</Link>
                </div>
            </main>
        </div>
    );
}
