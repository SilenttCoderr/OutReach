"use client";

import { FileText, Plus, Sparkles, Mail, Building } from "lucide-react";

const templates = [
    {
        id: 1,
        name: "Initial Outreach",
        description: "First contact email for cold outreach",
        icon: Mail,
        uses: 45,
    },
    {
        id: 2,
        name: "Follow-up",
        description: "Gentle follow-up after no response",
        icon: Mail,
        uses: 23,
    },
    {
        id: 3,
        name: "Company Research",
        description: "Template using company-specific context",
        icon: Building,
        uses: 18,
    },
];

export default function TemplatesPage() {
    return (
        <div className="page-container animate-in">
            {/* Header */}
            <div className="section-header flex items-center justify-between">
                <div>
                    <h1 className="section-title">Templates</h1>
                    <p className="section-description">Manage your email templates</p>
                </div>
                <button className="btn-primary">
                    <Plus className="w-4 h-4" /> New Template
                </button>
            </div>

            {/* AI Notice */}
            <div className="card p-4 mb-6 flex items-center gap-4 bg-accent/5 border-accent/30">
                <div className="p-2.5 rounded-lg bg-accent/20">
                    <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                    <p className="font-medium text-text-primary">AI-Powered Templates</p>
                    <p className="text-sm text-text-secondary">
                        Templates are enhanced with Gemini AI for personalization
                    </p>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {templates.map((template) => (
                    <div key={template.id} className="card p-5 cursor-pointer hover:border-border-strong">
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 rounded-lg bg-bg-elevated">
                                <template.icon className="w-5 h-5 text-text-muted" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-text-primary mb-1">{template.name}</h3>
                                <p className="text-sm text-text-secondary">{template.description}</p>
                                <p className="text-xs text-text-muted mt-2">Used {template.uses} times</p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add Template Card */}
                <div className="card p-5 cursor-pointer border-dashed hover:border-accent/50 flex items-center justify-center min-h-[120px]">
                    <div className="text-center">
                        <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center mx-auto mb-3">
                            <Plus className="w-5 h-5 text-text-muted" />
                        </div>
                        <p className="font-medium text-text-primary">Create Template</p>
                        <p className="text-sm text-text-muted">Add a new email template</p>
                    </div>
                </div>
            </div>

            <p className="text-center text-sm text-text-muted mt-8">
                Template editor coming soon
            </p>
        </div>
    );
}
