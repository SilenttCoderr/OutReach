"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, Shield, User } from "lucide-react";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { StatusBanner } from "@/components/ui/status-banner";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
    const { status } = useAuth();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "error" | "info" | "success"; message: string } | null>(null);
    const credits = status?.credits ?? 0;

    return <div className="page-container animate-in">
        <div className="section-header"><p className="coach-kicker">Workspace settings</p><h1 className="section-title mt-3">Keep the account details simple.</h1><p className="section-description">The essentials for your OutreachPro workspace, without settings that do not do anything.</p></div>
        {statusMessage && <StatusBanner type={statusMessage.type} message={statusMessage.message} className="mb-6" />}
        <div className="workspace-layout with-rail">
            <div className="workspace-table divide-y divide-border">
                <section className="p-5 sm:p-7"><div className="flex gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-muted text-accent"><User className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="data-line">Account</p><h2 className="mt-2 text-lg font-bold tracking-tight text-text-primary">Your sign-in details</h2><dl className="mt-5 divide-y divide-border"><div className="flex items-center justify-between gap-4 py-3"><dt className="text-sm text-text-secondary">Email</dt><dd className="truncate text-sm font-semibold text-text-primary">{status?.email || "—"}</dd></div></dl></div></div></section>
                <section className="p-5 sm:p-7"><div className="flex gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-muted text-accent"><CreditCard className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="data-line">Credits</p><h2 className="mt-2 text-lg font-bold tracking-tight text-text-primary">Draft-generation balance</h2><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-3xl font-bold tracking-tight text-text-primary">{credits}</p><p className="mt-1 text-sm text-text-secondary">credits available</p></div><Link href="/pricing" className="btn-secondary text-sm">Add credits <ArrowRight className="h-4 w-4" /></Link></div></div></div></section>
                <section className="p-5 sm:p-7"><div className="flex gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-error-muted text-error"><Shield className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="data-line text-error">Account removal</p><h2 className="mt-2 text-lg font-bold tracking-tight text-text-primary">Need to close your account?</h2><p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">Self-service deletion is not available yet. We will explain how to request removal without deleting anything from this screen.</p><button type="button" className="btn-ghost mt-4 border border-error/30 text-error hover:bg-error-muted" onClick={() => setShowDeleteConfirm(true)}>Request removal</button></div></div></section>
            </div>
            <aside className="workspace-rail"><p className="data-line">A clear boundary</p><p className="mt-4 text-sm leading-6 text-text-secondary">Account settings only show the information and actions available today. Profile content lives separately so it remains focused on your outreach.</p><Link href="/dashboard/profile" className="action-link mt-4">Edit profile context <ArrowRight className="h-4 w-4" /></Link></aside>
        </div>
        <ConfirmActionDialog open={showDeleteConfirm} title="Request account removal" description="Self-service deletion is not available yet. Confirm to see how to request removal from support." confirmLabel="Continue" onCancel={() => setShowDeleteConfirm(false)} onConfirm={() => { setShowDeleteConfirm(false); setStatusMessage({ type: "info", message: "Self-service deletion is not enabled. Please contact support to request account removal; nothing was deleted here." }); }} />
    </div>;
}
