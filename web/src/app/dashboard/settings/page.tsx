"use client";

import { useState } from "react";
import { User, CreditCard, Shield } from "lucide-react";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { StatusBanner } from "@/components/ui/status-banner";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
    const { status } = useAuth();
    const userEmail = status?.email ?? "";
    const credits = status?.credits ?? 0;
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "error" | "info" | "success"; message: string } | null>(null);

    const handleConfirmDelete = async () => {
        setShowDeleteConfirm(false);
        setStatusMessage({
            type: "info",
            message: "Self-service deletion is not enabled. Please contact support to request account removal; nothing was deleted here.",
        });
    };

    const sections = [
        {
            icon: User,
            title: "Account",
            description: "The details currently associated with your workspace",
            items: [
                { label: "Email", value: userEmail || "-" },
            ]
        },
        {
            icon: CreditCard,
            title: "Credits & Billing",
            description: "Credits are used when you generate outreach drafts",
            items: [
                { label: "Available Credits", value: credits.toString() },
            ]
        },
    ];

    return (
        <div className="page-container animate-in">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="section-header">
                    <h1 className="section-title">Settings</h1>
                    <p className="section-description">Manage your account and preferences</p>
                </div>

                {statusMessage && (
                    <StatusBanner
                        type={statusMessage.type}
                        message={statusMessage.message}
                        className="mb-4"
                    />
                )}

                {/* Sections */}
                <div className="space-y-4">
                    {sections.map((section) => (
                        <div key={section.title} className="card p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-2.5 rounded-lg bg-bg-elevated">
                                    <section.icon className="w-5 h-5 text-text-muted" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-text-primary">{section.title}</h3>
                                    <p className="text-sm text-text-secondary">{section.description}</p>
                                </div>
                            </div>

                            <div className="border-t border-border pt-4 space-y-3">
                                {section.items.map((item) => (
                                    <div key={item.label} className="flex items-center justify-between">
                                        <span className="text-sm text-text-secondary">{item.label}</span>
                                        <span className="text-sm font-medium text-text-primary">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Danger Zone */}
                    <div className="card p-6 border-error/30">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-2.5 rounded-lg bg-error/10">
                                <Shield className="w-5 h-5 text-error" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-error">Danger Zone</h3>
                                <p className="text-sm text-text-secondary">Account removal is handled by support while self-service deletion is unavailable.</p>
                            </div>
                        </div>

                        <div className="border-t border-border pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-text-primary">Request account removal</p>
                                    <p className="text-xs text-text-muted">We&apos;ll explain the next step without removing anything from this screen.</p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-ghost text-error border-error/30 hover:bg-error/10 text-sm"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    Request removal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <ConfirmActionDialog
                    open={showDeleteConfirm}
                    title="Request account removal"
                    description="Self-service deletion is not available yet. Confirm to see how to request removal from support."
                    confirmLabel="Continue"
                    onCancel={() => setShowDeleteConfirm(false)}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </div>
    );
}
