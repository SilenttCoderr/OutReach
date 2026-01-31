"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Database, ShieldCheck, Zap, Check, Star } from "lucide-react";

const pricingPreview = [
  { credits: 25, price: 3, perEmail: "0.12" },
  { credits: 100, price: 9, perEmail: "0.09" },
  { credits: 300, price: 19, perEmail: "0.063", popular: true },
  { credits: 1000, price: 49, perEmail: "0.049" },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CS Student @ Stanford",
    text: "Landed 3 interviews at FAANG companies. The AI personalization is incredible.",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Job Seeker",
    text: "Sent 200 personalized emails in 2 hours. Got a 15% response rate.",
    avatar: "MJ",
  },
  {
    name: "Priya Patel",
    role: "Recruiter",
    text: "Great for reaching out to candidates. Saves me hours every week.",
    avatar: "PP",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-border bg-bg-base/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-text-primary">OutreachPro</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <Link href="#features" className="hover:text-text-primary transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-text-primary transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-text-primary transition-colors">Docs</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">Login</Link>
            <Link href="/signup" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-20">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 text-center">
          <div className="space-y-6 animate-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium border border-accent/20">
              <Sparkles className="w-4 h-4" />
              Powered by Gemini 2.5 Flash
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-text-primary leading-[1.1]">
              Send Personalized
              <br />
              <span className="text-gradient">Emails at Scale</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Stop sending generic spam. AI-powered cold outreach that actually converts.
              Import contacts, generate personalized drafts, and send with one click.
            </p>

            {/* CTAs */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/signup" className="btn-primary text-base py-3 px-8">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/docs" className="btn-secondary text-base py-3 px-8">
                Read Docs
              </Link>
            </div>

            {/* Trust */}
            <div className="flex items-center justify-center gap-6 pt-8 text-sm text-text-muted">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" /> 10 free credits
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" /> No credit card
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" /> Cancel anytime
              </span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Everything You Need
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Built for job seekers, recruiters, and sales teams who want results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <FeatureCard
              icon={<Sparkles className="w-6 h-6 text-accent" />}
              title="AI Personalization"
              description="Gemini analyzes your context and generates hyper-relevant, personalized emails for each contact."
            />
            <FeatureCard
              icon={<Database className="w-6 h-6 text-blue-400" />}
              title="CSV Import"
              description="Drop in your Apollo or LinkedIn export. We handle parsing and cleaning automatically."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-yellow-400" />}
              title="Bulk Sending"
              description="Send hundreds of personalized emails with one click. Smart queuing respects Gmail limits."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6 text-success" />}
              title="Safe & Secure"
              description="OAuth2 means we never see your password. Your data stays yours, always."
            />
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Loved by Professionals
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-text-secondary mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-medium text-accent">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Pay only for what you use. No subscriptions, no hidden fees.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {pricingPreview.map((plan) => (
              <div
                key={plan.credits}
                className={`card p-5 text-center ${plan.popular ? "border-accent bg-accent/5" : ""
                  }`}
              >
                {plan.popular && (
                  <span className="badge badge-accent mb-3">Best Value</span>
                )}
                <div className="text-3xl font-bold text-text-primary">${plan.price}</div>
                <div className="text-sm text-text-secondary mt-1">{plan.credits} credits</div>
                <div className="text-xs text-text-muted mt-1">${plan.perEmail}/email</div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/pricing" className="btn-secondary">
              View All Plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-3xl mx-auto px-6">
          <div className="card p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Ready to 10x Your Outreach?
            </h2>
            <p className="text-text-secondary mb-8 max-w-lg mx-auto">
              Join thousands of professionals who've already transformed their cold email game.
            </p>
            <Link href="/signup" className="btn-primary text-base py-3 px-8 inline-flex">
              Get Started Free <ArrowRight className="w-4 h-4" />
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
            <Link href="/pricing" className="hover:text-text-primary transition-colors">Pricing</Link>
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

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-6 hover:border-border-strong cursor-pointer">
      <div className="mb-4 p-3 rounded-lg bg-bg-elevated w-fit">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}
