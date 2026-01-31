"use client";

import { useState, useEffect } from "react";
import { User, CreditCard, Bell, Shield } from "lucide-react";
import { checkAuthStatus } from "@/services/api";

export default function SettingsPage() {
    const [userEmail, setUserEmail] = useState<string>("");
    const [credits, setCredits] = useState<number>(0);

    useEffect(() => {
        checkAuthStatus().then(data => {
            if (data.authenticated) {
                setUserEmail(data.email || "");
                setCredits(data.credits || 0);
            }
        });
    }, []);

    const sections = [
        {
            icon: User,
            title: "Account",
            description: "Manage your account details",
            items: [
                { label: "Email", value: userEmail || "-" },
                { label: "Plan", value: "Free" },
            ]
        },
        {
            icon: CreditCard,
            title: "Credits & Billing",
            description: "Manage credits and payments",
            items: [
                { label: "Available Credits", value: credits.toString() },
                { label: "Payment Method", value: "Stripe" },
            ]
        },
        {
            icon: Bell,
            title: "Notifications",
            description: "Configure notifications",
            items: [
                { label: "Email Notifications", value: "Enabled" },
                { label: "Weekly Reports", value: "Disabled" },
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
                                <p className="text-sm text-text-secondary">Irreversible actions</p>
                            </div>
                        </div>

                        <div className="border-t border-border pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-text-primary">Delete Account</p>
                                    <p className="text-xs text-text-muted">Permanently delete your data</p>
                                </div>
                                <button className="btn-ghost text-error border-error/30 hover:bg-error/10 text-sm">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
