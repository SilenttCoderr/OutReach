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
    CheckCircle,
    Clock
} from "lucide-react";
import { fetchStats, checkAuthStatus, buyCredits, type Stats } from "@/services/api";

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
    const [loading, setLoading] = useState(true);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        if (searchParams.get("payment") === "success") {
            setPaymentSuccess(true);
            setTimeout(() => setPaymentSuccess(false), 5000);
        }

        async function loadData() {
            try {
                const authData = await checkAuthStatus();
                if (!authData.authenticated) {
                    router.push("/login");
                    return;
                }
                const statsData = await fetchStats();
                setStats(statsData);
            } catch (error) {
                console.error("Failed to load dashboard:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [router, searchParams]);

    const handleBuyCredits = () => {
        router.push("/pricing");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="page-container animate-in">
            {/* Payment Success Banner */}
            {paymentSuccess && (
                <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success/30 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="text-success font-medium">Payment successful! Credits have been added.</span>
                </div>
            )}

            {/* Header */}
            <div className="section-header flex items-center justify-between">
                <div>
                    <h1 className="section-title">Dashboard</h1>
                    <p className="section-description">Overview of your outreach performance</p>
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

            {/* Recent Activity */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Recent Activity</h2>
                    <Link href="/dashboard/drafts" className="text-sm text-accent hover:underline flex items-center gap-1">
                        View all <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="text-text-muted text-sm py-8 text-center border border-dashed border-border rounded-lg">
                    No recent activity. Start by importing contacts.
                </div>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    accent = false,
    trend,
    variant
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    accent?: boolean;
    trend?: string;
    variant?: 'warning';
}) {
    return (
        <div className={`stat-card ${accent ? 'accent' : ''}`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${variant === 'warning' ? 'bg-warning/10' :
                    accent ? 'bg-accent/20' : 'bg-bg-elevated'
                    }`}>
                    <Icon className={`w-5 h-5 ${variant === 'warning' ? 'text-warning' :
                        accent ? 'text-accent' : 'text-text-muted'
                        }`} />
                </div>
                {trend && (
                    <span className="text-xs text-success font-medium">{trend}</span>
                )}
            </div>
            <div className="text-3xl font-bold text-text-primary mb-1">{value}</div>
            <div className="text-sm text-text-secondary">{label}</div>
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
