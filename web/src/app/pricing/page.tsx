"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, CircleDollarSign, HelpCircle, MailCheck, ShieldCheck } from "lucide-react";
import { buyCredits } from "@/services/api";
import { MarketingFooter } from "@/components/layout/marketing_footer";
import { MarketingHeader } from "@/components/layout/marketing_header";
import { StatusBanner } from "@/components/ui/status-banner";

const packs = [
    { name: "A thoughtful start", credits: 25, price: 3, rate: "0.12", note: "For a focused first outreach list." },
    { name: "A steady search", credits: 100, price: 9, rate: "0.09", note: "Enough room to build a repeatable rhythm." },
    { name: "A fuller campaign", credits: 300, price: 19, rate: "0.063", note: "The best value when your list is ready.", featured: true },
    { name: "A larger season", credits: 1000, price: 49, rate: "0.049", note: "For sustained outreach across more opportunities." },
];

const promises = [
    { icon: MailCheck, title: "One credit, one generated draft", copy: "Credits are used when you create personalized outreach drafts." },
    { icon: ShieldCheck, title: "Pay when you need to", copy: "There is no subscription or recurring charge to manage." },
    { icon: CircleDollarSign, title: "Credits remain available", copy: "Your credit balance stays in your workspace until you use it." },
];

const faqs = [
    ["What is a credit?", "One credit is used to generate one personalized outreach draft."],
    ["How are messages sent?", "You connect your own Gmail account. OutreachPro creates drafts for you to review before sending."],
    ["Can I add more later?", "Yes. Credit packs can be purchased whenever you need more drafting capacity."],
];

export default function PricingPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const handleBuyCredits = async (credits: number, price: number) => {
        setCheckoutError(null);
        try { const { url } = await buyCredits(credits, price * 100); window.location.assign(url); }
        catch (error) { const message = error instanceof Error ? error.message : "Checkout failed. Please try again."; if (message === "Unauthorized") { window.location.assign("/login?next=/pricing&reason=checkout_required"); return; } setCheckoutError(message); }
    };

    return <div className="min-h-[100dvh] bg-bg-base"><MarketingHeader activePath="/pricing" /><main className="pb-20 pt-28 sm:pt-32"><section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-end"><div><p className="coach-kicker">Credit packs</p><h1 className="mt-4 max-w-xl text-5xl font-bold tracking-[-.06em] text-text-primary sm:text-6xl">Pay for the messages you are ready to make personal.</h1></div><p className="max-w-xl text-lg leading-8 text-text-secondary">No subscription tiers to decode. Add drafting credits when your outreach has momentum, then take the time to review every message.</p></div></section>{checkoutError && <div className="mx-auto mt-8 max-w-7xl px-5 sm:px-8 lg:px-10"><StatusBanner type="error" message={checkoutError} /></div>}
    <section className="mx-auto mt-12 max-w-7xl px-5 sm:px-8 lg:px-10"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{packs.map((pack) => <article key={pack.credits} className={`relative flex min-h-[27rem] flex-col rounded-[var(--radius-xl)] border p-6 ${pack.featured ? "border-accent bg-[linear-gradient(155deg,#fffaf7,#f5e6df)] shadow-[0_30px_60px_-42px_#a23e2e]" : "border-border bg-bg-surface"}`}><div className="flex items-start justify-between gap-3"><p className="data-line">{pack.featured ? "Best value" : "Credit pack"}</p>{pack.featured && <span className="badge badge-accent">Most chosen</span>}</div><h2 className="mt-7 text-xl font-bold tracking-tight text-text-primary">{pack.name}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-text-secondary">{pack.note}</p><div className="mt-8 border-y border-border py-5"><p className="font-mono text-5xl font-bold tracking-[-.06em] text-text-primary"><span className="text-2xl align-top">$</span>{pack.price}</p><p className="mt-2 text-sm text-text-secondary">{pack.credits} credits · ${pack.rate} per draft</p></div><ul className="mt-6 space-y-3 text-sm text-text-secondary"><li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Personalized draft generation</li><li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> CSV contact import</li><li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Review before delivery</li></ul><button onClick={() => void handleBuyCredits(pack.credits, pack.price)} className={pack.featured ? "btn-primary mt-auto w-full text-sm" : "btn-secondary mt-auto w-full text-sm"}>Choose {pack.credits} credits <ArrowRight className="h-4 w-4" /></button></article>)}</div></section>
    <section className="mx-auto mt-24 max-w-7xl px-5 sm:px-8 lg:px-10"><div className="grid gap-px overflow-hidden rounded-[var(--radius-xl)] border border-border bg-border md:grid-cols-3">{promises.map(({ icon: Icon, title, copy }) => <article key={title} className="bg-bg-surface p-6"><Icon className="h-5 w-5 text-accent" /><h2 className="mt-8 font-bold tracking-tight text-text-primary">{title}</h2><p className="mt-2 text-sm leading-6 text-text-secondary">{copy}</p></article>)}</div></section>
    <section className="mx-auto mt-24 max-w-3xl px-5 sm:px-8"><p className="coach-kicker">Questions, answered</p><h2 className="mt-4 text-3xl font-bold tracking-[-.05em] text-text-primary">The details that matter.</h2><div className="mt-8 divide-y divide-border border-y border-border">{faqs.map(([question, answer], index) => <div key={question}><button type="button" className="flex w-full items-center justify-between gap-4 py-5 text-left" onClick={() => setOpenFaq(openFaq === index ? null : index)}><span className="font-semibold text-text-primary">{question}</span><HelpCircle className={`h-5 w-5 shrink-0 text-accent transition-transform ${openFaq === index ? "rotate-180" : ""}`} /></button>{openFaq === index && <p className="max-w-2xl pb-5 text-sm leading-6 text-text-secondary">{answer}</p>}</div>)}</div><div className="coach-panel mt-12 p-7 sm:p-9"><p className="data-line">Start with your first ten</p><h2 className="mt-3 text-2xl font-bold tracking-tight text-text-primary">Get into a thoughtful rhythm before you buy more.</h2><Link href="/signup" className="btn-primary mt-6">Create your workspace <ArrowRight className="h-4 w-4" /></Link></div></section></main><MarketingFooter /></div>;
}
