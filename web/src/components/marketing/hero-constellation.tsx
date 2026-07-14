"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { CheckCircle2, Mail, Send, Sparkles } from "lucide-react";

export function HeroConstellation() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.fromTo("[data-orbit]", { opacity: 0, scale: .92, y: 18 }, { opacity: 1, scale: 1, y: 0, duration: .75, stagger: .14, ease: "power3.out" });
      gsap.fromTo("[data-thread]", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: .65, stagger: .12, delay: .38, ease: "power2.out" });
      gsap.to("[data-signal]", { y: -6, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: .2 });
    }, element);

    return () => context.revert();
  }, []);

  return (
    <div ref={root} className="coach-panel coach-grid relative min-h-[420px] overflow-hidden p-5 sm:p-7">
      <div data-orbit className="rounded-2xl border border-border bg-bg-surface p-5 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div><p className="text-xs font-semibold text-text-muted">Your outreach rhythm</p><p className="mt-1 text-2xl font-bold tracking-tight text-text-primary">One good next step</p></div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-accent-muted text-accent"><Sparkles className="h-5 w-5" /></div>
        </div>
        <div className="space-y-3">
          {[
            [CheckCircle2, "Profile context is ready", "Complete"],
            [Mail, "Import people worth knowing", "Next"],
            [Send, "Shape a personal first message", "Then"],
          ].map(([Icon, title, state], index) => {
            const StepIcon = Icon as typeof CheckCircle2;
            return <div data-orbit key={String(title)} className="flex items-center gap-3 rounded-xl border border-border bg-bg-surface/85 p-3"><div data-signal className={`grid h-9 w-9 place-items-center rounded-lg ${index === 0 ? "bg-success-muted text-success" : "bg-bg-elevated text-text-secondary"}`}><StepIcon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-text-primary">{String(title)}</p><p className="text-xs text-text-muted">{String(state)}</p></div></div>;
          })}
        </div>
      </div>
      <div data-thread className="absolute left-[42%] top-[52%] h-px w-[36%] bg-accent/60" />
      <div data-thread className="absolute left-[55%] top-[71%] h-px w-[29%] bg-text-primary/20" />
      <div data-orbit className="absolute bottom-8 right-7 max-w-[188px] rounded-2xl border border-[#e8b4a7] bg-[#fff7f4] p-4 shadow-lg"><div data-signal className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white"><Send className="h-4 w-4" /></div><p className="text-sm font-bold text-text-primary">Personal, not performative.</p><p className="mt-1 text-xs leading-relaxed text-text-secondary">A clearer way to turn research into a first conversation.</p></div>
    </div>
  );
}
