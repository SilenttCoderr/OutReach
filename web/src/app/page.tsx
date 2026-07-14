import Link from "next/link";
import { ArrowRight, Check, CircleCheckBig, FileText, HeartHandshake, Sparkles, Upload } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing_header";
import { MarketingFooter } from "@/components/layout/marketing_footer";
import { HeroConstellation } from "@/components/marketing/hero-constellation";

const steps = [
  { number: "01", title: "Give your story some shape", detail: "Add the experience, goals, and context that make a message sound like you.", icon: FileText },
  { number: "02", title: "Choose people with care", detail: "Bring in a focused list, then keep the details you need close at hand.", icon: Upload },
  { number: "03", title: "Start a thoughtful conversation", detail: "Review every draft before it reaches someone's inbox.", icon: HeartHandshake },
];

const promises = ["Personal context in every draft", "Review before you send", "10 free credits to begin"];

export default function Home() {
  return <div className="min-h-[100dvh] bg-bg-base text-text-primary"><MarketingHeader activePath="/" /><main>
    <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-28 sm:px-8 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:gap-16 lg:px-10 lg:pt-36">
      <div className="max-w-2xl"><p className="coach-kicker">Outreach that sounds like you</p><h1 className="mt-5 text-5xl font-bold tracking-[-.07em] text-text-primary sm:text-6xl lg:text-7xl">Make your next move feel <span className="text-gradient">personal.</span></h1><p className="mt-6 max-w-xl text-lg leading-8 text-text-secondary">OutreachPro helps you turn a little context into a considerate first message, then keeps your whole outreach rhythm in one calm place.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/signup" className="btn-primary px-5 text-base" aria-label="Start with 10 free credits">Start with 10 free credits <ArrowRight className="h-4 w-4" /></Link><Link href="/docs" className="btn-secondary px-5 text-base">See how it works</Link></div><ul className="mt-9 grid gap-3 text-sm text-text-secondary sm:grid-cols-3">{promises.map((promise) => <li key={promise} className="flex items-start gap-2"><CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-success" />{promise}</li>)}</ul></div>
      <HeroConstellation />
    </section>

    <section id="features" className="border-y border-border bg-bg-surface"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10"><div className="max-w-2xl"><p className="coach-kicker">A better starting point</p><h2 className="mt-4 text-3xl font-bold tracking-[-.05em] sm:text-4xl">Make the small decisions easier.</h2><p className="mt-4 text-lg leading-8 text-text-secondary">Good outreach is not a volume game. It is a sequence of clear, human choices.</p></div><div className="mt-12 grid gap-4 lg:grid-cols-3">{steps.map((step) => { const Icon = step.icon; return <article key={step.number} className="card p-6"><div className="flex items-center justify-between"><span className="font-mono text-sm text-text-muted">{step.number}</span><div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-muted text-accent"><Icon className="h-5 w-5" /></div></div><h3 className="mt-12 text-xl font-bold tracking-tight">{step.title}</h3><p className="mt-3 text-sm leading-6 text-text-secondary">{step.detail}</p></article>; })}</div></div></section>

    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10"><div className="coach-panel grid gap-8 p-7 sm:p-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div><p className="coach-kicker">A simple rhythm</p><h2 className="mt-4 text-3xl font-bold tracking-[-.05em] sm:text-4xl">Know what to do next, without losing the human part.</h2><p className="mt-4 max-w-lg leading-7 text-text-secondary">Your workspace turns profile context, contacts, drafts, and delivery into a single focused loop.</p><Link href="/signup" className="btn-primary mt-7">Create your workspace <ArrowRight className="h-4 w-4" /></Link></div><div className="rounded-2xl border border-border bg-bg-surface p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="font-semibold">Today&apos;s quiet progress</p><p className="mt-1 text-sm text-text-secondary">One meaningful thing at a time.</p></div><Sparkles className="h-5 w-5 text-accent" /></div><div className="space-y-3">{["Finish your profile context", "Import a focused contact list", "Review your first draft"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl border border-border p-3"><span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${index === 0 ? "bg-success-muted text-success" : "bg-bg-elevated text-text-secondary"}`}>{index === 0 ? <Check className="h-4 w-4" /> : index + 1}</span><span className="flex-1 text-sm font-semibold">{item}</span>{index === 0 && <span className="text-xs font-semibold text-success">Ready</span>}</div>)}</div></div></div></section>
  </main><MarketingFooter /></div>;
}
