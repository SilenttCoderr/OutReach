"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, ShieldAlert, User } from "lucide-react";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { StatusBanner } from "@/components/ui/status-banner";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
    const { status } = useAuth();
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "info" | "success"; text: string } | null>(null);

    return <div className="page-container animate-in">
        <div className="section-header max-w-2xl"><p className="coach-kicker">Account settings</p><h1 className="section-title mt-3">Account, credits, and clear boundaries.</h1><p className="section-description">Manage the parts of OutreachPro that affect sign-in and billing. Your outreach context stays in Profile.</p></div>
        {message && <StatusBanner type={message.type} message={message.text} className="mb-6" />}

        <div className="mx-auto grid max-w-4xl gap-5">
            <section className="workspace-table p-5 sm:p-7"><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-muted text-accent"><User className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="data-line">Sign-in</p><h2 className="mt-2 text-xl font-bold tracking-tight text-text-primary">Your account</h2><dl className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-[8rem_1fr]"><dt className="text-sm text-text-secondary">Email address</dt><dd className="truncate text-sm font-semibold text-text-primary">{status?.email || "—"}</dd></dl></div></div></section>

            <section className="workspace-table p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-muted text-accent"><CreditCard className="h-5 w-5" /></span><div><p className="data-line">Credits</p><h2 className="mt-2 text-xl font-bold tracking-tight text-text-primary">Draft-generation balance</h2><p className="mt-3 font-mono text-4xl font-bold tracking-tight text-text-primary">{status?.credits ?? 0}</p><p className="mt-1 text-sm text-text-secondary">credits available for new drafts</p></div></div><Link href="/pricing" className="btn-primary shrink-0 text-sm">Add credits <ArrowRight className="h-4 w-4" /></Link></div></section>

            <section className="danger-panel p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-error-muted text-error"><ShieldAlert className="h-5 w-5" /></span><div><p className="data-line text-error">Danger zone</p><h2 className="mt-2 text-xl font-bold tracking-tight text-text-primary">Need to step away?</h2><p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">Request deactivation through support. This does not delete your account from this screen.</p></div></div><button type="button" onClick={() => setShowDeactivateConfirm(true)} className="btn-primary shrink-0 bg-error hover:bg-error/90 text-sm">Request deactivation</button></div></section>
        </div>

        <ConfirmActionDialog open={showDeactivateConfirm} title="Request account deactivation" description="This opens the support path only. Your account, credits, contacts, and drafts will not be deleted from this screen." confirmLabel="Show support instructions" onCancel={() => setShowDeactivateConfirm(false)} onConfirm={() => { setShowDeactivateConfirm(false); setMessage({ type: "info", text: "Contact support from your account email to request deactivation. No account data was changed." }); }} />
    </div>;
}
