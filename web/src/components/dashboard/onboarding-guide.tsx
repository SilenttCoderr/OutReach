"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { Check, ChevronRight, FileText, MailCheck, Send, Upload, UserRound } from "lucide-react";

interface OnboardingGuideProps {
  profileReady: boolean;
  gmailConnected: boolean;
  hasContacts: boolean;
  hasDrafts: boolean;
  hasSentMessage: boolean;
}

export function OnboardingGuide({ profileReady, gmailConnected, hasContacts, hasDrafts, hasSentMessage }: OnboardingGuideProps) {
  const root = useRef<HTMLElement>(null);
  const steps = [
    { label: "Add the context that makes your messages yours", href: "/dashboard/profile", icon: UserRound, complete: profileReady },
    { label: "Connect the Gmail account you will send from", href: "/dashboard/campaigns", icon: MailCheck, complete: gmailConnected },
    { label: "Bring in the people you want to reach", href: "/dashboard/contacts", icon: Upload, complete: hasContacts },
    { label: "Generate drafts, then make each one your own", href: "/dashboard/campaigns", icon: FileText, complete: hasDrafts },
    { label: "Send your first considered message", href: "/dashboard/drafts", icon: Send, complete: hasSentMessage },
  ];
  const completedCount = steps.filter((step) => step.complete).length;

  useLayoutEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => gsap.fromTo("[data-guide-step]", { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: .45, stagger: .1, ease: "power2.out", delay: .15 }), element);
    return () => context.revert();
  }, []);

  return <section ref={root} className="coach-panel p-5 sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="coach-kicker">A calmer first week</p><h2 className="mt-3 text-xl font-bold tracking-tight text-text-primary">Build your outreach rhythm</h2><p className="mt-1 text-sm leading-relaxed text-text-secondary">Small, visible steps make it easier to send with care.</p></div><span className="badge badge-accent shrink-0">{completedCount} of {steps.length}</span></div><ol className="space-y-2">{steps.map((step, index) => { const Icon = step.icon; return <li data-guide-step key={step.label}><Link href={step.href} className="group flex items-center gap-3 rounded-xl border border-border bg-bg-surface p-3.5 transition hover:border-accent"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${step.complete ? "bg-success-muted text-success" : "bg-bg-elevated text-text-secondary"}`}>{step.complete ? <Check className="h-4 w-4" /> : index + 1}</span><Icon className={`h-4 w-4 ${step.complete ? "text-success" : "text-accent"}`} /><span className="flex-1 text-sm font-semibold text-text-primary">{step.label}</span><ChevronRight className="h-4 w-4 text-text-muted transition group-hover:translate-x-0.5" /></Link></li>; })}</ol><div className="mt-4 flex items-center gap-2 text-xs text-text-muted"><Check className="h-4 w-4 text-success" />Progress is based on your actual workspace activity.</div></section>;
}
