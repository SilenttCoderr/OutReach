"use client";

import Link from "next/link";
import { Check, Zap, ArrowRight, HelpCircle } from "lucide-react";
import { useState } from "react";
import { buyCredits } from "@/services/api";

const pricingPlans = [
    {
        name: "Starter",
        credits: 25,
        price: 3,
        perCredit: "0.12",
        description: "Perfect for trying out",
        features: [
            "25 AI-personalized emails",
            "Gmail integration",
            "CSV import",
            "Email tracking",
        ],
    },
    {
        name: "Basic",
        credits: 100,
        price: 9,
        perCredit: "0.09",
        description: "For regular outreach",
        features: [
            "100 AI-personalized emails",
            "Gmail integration",
            "CSV import",
            "Email tracking",
            "Priority support",
        ],
    },
    {
        name: "Pro",
        credits: 300,
        price: 19,
        perCredit: "0.063",
        description: "Best value for teams",
        popular: true,
        features: [
            "300 AI-personalized emails",
            "Gmail integration",
            "CSV import",
            "Email tracking",
            "Priority support",
            "Resume attachment",
            "Custom templates",
        ],
    },
    {
        name: "Business",
        credits: 1000,
        price: 49,
        perCredit: "0.049",
        description: "For power users",
        features: [
            "1000 AI-personalized emails",
            "Gmail integration",
            "CSV import",
            "Email tracking",
            "Priority support",
            "Resume attachment",
            "Custom templates",
            "API access (coming soon)",
        ],
    },
];

const faqs = [
    {
        q: "What is a credit?",
        a: "1 credit = 1 AI-generated personalized email. Each email is uniquely crafted using Gemini AI based on the recipient's context.",
    },
    {
        q: "Do credits expire?",
        a: "No, credits never expire. Use them whenever you need.",
    },
    {
        q: "How does Gmail integration work?",
        a: "We use OAuth2 to connect to your Gmail account. We never see your password and can only create drafts on your behalf.",
    },
    {
        q: "Can I upgrade my plan?",
        a: "Yes, you can purchase additional credit packs at any time. They stack on top of your existing credits.",
    },
    {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards via Stripe, including Visa, Mastercard, and American Express.",
    },
];

export default function PricingPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const handleBuyCredits = async (credits: number, price: number) => {
        try {
            const { url } = await buyCredits(credits, price * 100);
            window.location.href = url;
        } catch (error) {
            alert("Please login first to purchase credits");
            window.location.href = "/login";
        }
    };

    return (
        <div className="min-h-screen bg-bg-base">
            {/* Navbar */}
            <header className="fixed top-0 w-full z-50 border-b border-border bg-bg-base/95 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-text-primary">OutreachPro</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
                        <Link href="/#features" className="hover:text-text-primary transition-colors">Features</Link>
                        <Link href="/pricing" className="text-text-primary">Pricing</Link>
                        <Link href="/docs" className="hover:text-text-primary transition-colors">Docs</Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="btn-ghost text-sm">Login</Link>
                        <Link href="/signup" className="btn-primary text-sm">Get Started</Link>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20">
                {/* Hero */}
                <section className="max-w-4xl mx-auto px-6 text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                        Pay only for what you use. No subscriptions, no hidden fees.
                        Credits never expire.
                    </p>
                </section>

                {/* Pricing Cards */}
                <section className="max-w-6xl mx-auto px-6 mb-24">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {pricingPlans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`card p-6 relative ${plan.popular ? "border-accent bg-accent/5" : ""
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-white text-xs font-medium rounded-full">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-text-primary mb-1">{plan.name}</h3>
                                    <p className="text-sm text-text-secondary">{plan.description}</p>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-text-primary">${plan.price}</span>
                                    </div>
                                    <p className="text-sm text-text-muted mt-1">
                                        {plan.credits} credits • ${plan.perCredit}/email
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleBuyCredits(plan.credits, plan.price)}
                                    className={`w-full mb-6 ${plan.popular ? "btn-primary" : "btn-secondary"}`}
                                >
                                    Buy {plan.credits} Credits
                                </button>

                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2 text-sm">
                                            <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                                            <span className="text-text-secondary">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Comparison */}
                <section className="max-w-4xl mx-auto px-6 mb-24">
                    <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
                        Why Credits?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="card p-6 text-center">
                            <div className="text-3xl mb-3">💰</div>
                            <h3 className="font-semibold text-text-primary mb-2">No Subscriptions</h3>
                            <p className="text-sm text-text-secondary">
                                Buy once, use anytime. No recurring charges.
                            </p>
                        </div>
                        <div className="card p-6 text-center">
                            <div className="text-3xl mb-3">♾️</div>
                            <h3 className="font-semibold text-text-primary mb-2">Never Expire</h3>
                            <p className="text-sm text-text-secondary">
                                Your credits are yours forever. No pressure.
                            </p>
                        </div>
                        <div className="card p-6 text-center">
                            <div className="text-3xl mb-3">📈</div>
                            <h3 className="font-semibold text-text-primary mb-2">Volume Discounts</h3>
                            <p className="text-sm text-text-secondary">
                                Buy more, save more. Up to 60% off per email.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="max-w-3xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <div key={i} className="card overflow-hidden">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full p-4 flex items-center justify-between text-left hover:bg-bg-elevated transition-colors"
                                >
                                    <span className="font-medium text-text-primary">{faq.q}</span>
                                    <HelpCircle className={`w-5 h-5 text-text-muted transition-transform ${openFaq === i ? "rotate-180" : ""
                                        }`} />
                                </button>
                                {openFaq === i && (
                                    <div className="px-4 pb-4 text-sm text-text-secondary">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="max-w-3xl mx-auto px-6 mt-24">
                    <div className="card p-12 text-center">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">
                            Ready to Start?
                        </h2>
                        <p className="text-text-secondary mb-8">
                            Get 10 free credits when you sign up. No credit card required.
                        </p>
                        <Link href="/signup" className="btn-primary text-base py-3 px-8 inline-flex">
                            Create Free Account <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-8">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-text-primary">OutreachPro</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-text-secondary">
                        <Link href="/docs" className="hover:text-text-primary transition-colors">Docs</Link>
                        <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
                    </div>
                    <p className="text-sm text-text-muted">© 2026 OutreachPro</p>
                </div>
            </footer>
        </div>
    );
}
