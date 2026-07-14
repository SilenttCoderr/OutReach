"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    CreditCard,
    Send,
    Mail,
    AlertTriangle,
    ArrowRight,
    Plus,
    Upload,
    Sparkles,
    Clock
} from "lucide-react";
import { checkAuthStatus, fetchContacts, fetchOnboardingStatus, fetchStats, type Stats } from "@/services/api";
import { useSafeTimeout } from "@/lib/timeout";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBanner } from "@/components/ui/status-banner";
import { OnboardingGuide } from "@/components/dashboard/onboarding-guide";

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [stats, setStats] = useState<Stats | null>(null);
    const [onboarding, setOnboarding] = useState({ profileReady: false, gmailConnected: false, hasContacts: false, hasDrafts: false, hasSentMessage: false });
    const [loading, setLoading] = useState(true);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "error" | "info" | "success"; message: string } | null>(null);

    const safeTimeout = useSafeTimeout();

    useEffect(() => {
        if (searchParams.get("payment") === "success") {
            setPaymentSuccess(true);
            safeTimeout(() => setPaymentSuccess(false), 5000);
        }

        async function loadData() {
            try {
                setStatusMessage(null);
                const [statsResult, profileResult, authResult, contactsResult] = await Promise.allSettled([
                    fetchStats(),
                    fetchOnboardingStatus(),
                    checkAuthStatus(),
                    fetchContacts(),
                ]);

                if (statsResult.status !== "fulfilled") {
                    throw statsResult.reason;
                }

                const statsData = statsResult.value;
                setStats(statsData);
                setOnboarding({
                    profileReady: profileResult.status === "fulfilled" && profileResult.value.ready,
                    gmailConnected: authResult.status === "fulfilled" && Boolean(authResult.value.gmail_connected),
                    hasContacts: contactsResult.status === "fulfilled" && contactsResult.value.length > 0,
                    hasDrafts: statsData.total_drafted + statsData.total_sent > 0,
                    hasSentMessage: statsData.total_sent > 0,
                });

                if ([profileResult, authResult, contactsResult].some((result) => result.status === "rejected")) {
                    setStatusMessage({
                        type: "info",
                        message: "Some setup progress could not be loaded. Your workspace actions are still available.",
                    });
                }
            } catch {
                setStatusMessage({
                    type: "error",
                    message: "We could not load dashboard stats. Please refresh or try again in a minute.",
                });
            } finally {
                setLoading(false);
            }
        }
        void loadData();
    }, [safeTimeout, searchParams]);

    const handleBuyCredits = () => {
        router.push("/pricing");
    };

    if (loading) {
        return (
            <div className="page-container animate-in">
                <div className="section-header flex items-center justify-between">
                    <div>
                        <div className="h-8 w-48 bg-bg-elevated rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-64 bg-bg-elevated rounded animate-pulse"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="stat-card h-32 animate-pulse bg-bg-surface border-border flex flex-col justify-between">
                            <div className="w-8 h-8 bg-bg-elevated rounded-lg"></div>
                            <div>
                                <div className="h-8 w-16 bg-bg-elevated rounded mb-2"></div>
                                <div className="h-4 w-24 bg-bg-elevated rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                    {[1, 2].map((i) => (
                        <div key={i} className="card p-6 h-36 border-border animate-pulse flex items-start gap-4">
                            <div className="w-12 h-12 bg-bg-elevated rounded-xl"></div>
                            <div className="flex-1 space-y-3">
                                <div className="h-5 w-32 bg-bg-elevated rounded"></div>
                                <div className="h-4 w-full max-w-48 bg-bg-elevated rounded"></div>
                                <div className="h-8 w-24 bg-bg-elevated rounded mt-2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="page-container animate-in">
            {statusMessage && (
                <StatusBanner
                    type={statusMessage.type}
                    message={statusMessage.message}
                    className="mb-6"
                />
            )}

            {/* Payment Success Banner */}
            {paymentSuccess && (
                <StatusBanner
                    type="success"
                    message="Payment successful! Credits have been added."
                    className="mb-6"
                />
            )}

            {/* Header */}
            <div className="section-header flex items-center justify-between">
                <div>
                    <p className="coach-kicker">Your workspace</p>
                    <h1 className="section-title mt-3">A calmer way to make your next move.</h1>
                    <p className="section-description">Your context, contacts, and drafts are all moving in the same direction.</p>
                </div>
                <button onClick={handleBuyCredits} className="btn-primary">
                    <Plus className="w-4 h-4" /> Add Credits
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard
                    label="Credits Available"
                    value={stats?.credits_available ?? 0}
                    icon={CreditCard}
                    accent
                />
                <StatCard
                    label="Emails Sent"
                    value={stats?.total_sent ?? 0}
                    icon={Send}
                />
                <StatCard
                    label="Drafts Ready"
                    value={stats?.total_drafted ?? 0}
                    icon={Mail}
                />
                <StatCard
                    label="Pending"
                    value={stats?.pending ?? 0}
                    icon={Clock}
                />
                <StatCard
                    label="Failed"
                    value={stats?.failed_emails ?? 0}
                    icon={AlertTriangle}
                    variant="warning"
                />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr] mb-8">
                <OnboardingGuide {...onboarding} />
                <div className="coach-panel p-6 flex flex-col justify-between">
                    <div>
                        <p className="coach-kicker">A gentle prompt</p>
                        <h2 className="mt-3 text-xl font-bold tracking-tight text-text-primary">The best messages begin with a little more context.</h2>
                        <p className="mt-2 text-sm leading-6 text-text-secondary">Start by importing the people you want to reach. Then use a campaign to shape drafts you can make your own.</p>
                    </div>
                    <Link href="/dashboard/contacts" className="btn-secondary mt-6 self-start text-sm">Import a contact list <ArrowRight className="w-4 h-4" /></Link>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
                <ActionCard
                    title="Import Contacts"
                    description="Upload a CSV file with your outreach list"
                    icon={Upload}
                    href="/dashboard/contacts"
                    buttonText="Upload CSV"
                />
                <ActionCard
                    title="Generate Drafts"
                    description="Create AI-personalized emails for your contacts"
                    icon={Sparkles}
                    href="/dashboard/campaigns"
                    buttonText="New Campaign"
                    primary
                />
            </div>

            <div className="coach-panel p-6">
                <p className="coach-kicker">Keep it thoughtful</p>
                <h2 className="mt-3 text-lg font-bold text-text-primary">Review drafts before every send.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">OutreachPro creates drafts for you to evaluate. Nothing is sent until you choose to send it from the Drafts workspace.</p>
                <Link href="/dashboard/drafts" className="btn-secondary mt-5 text-sm">Open drafts <ArrowRight className="w-4 h-4" /></Link>
            </div>
        </div>
    );
}


function ActionCard({
    title,
    description,
    icon: Icon,
    href,
    buttonText,
    primary = false
}: {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    buttonText: string;
    primary?: boolean;
}) {
    return (
        <div className="card p-6">
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${primary ? 'bg-accent/20' : 'bg-bg-elevated'}`}>
                    <Icon className={`w-6 h-6 ${primary ? 'text-accent' : 'text-text-muted'}`} />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
                    <p className="text-sm text-text-secondary mb-4">{description}</p>
                    <Link
                        href={href}
                        className={primary ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
                    >
                        {buttonText} <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
