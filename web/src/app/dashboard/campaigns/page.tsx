"use client";

import { useState } from "react";
import { Sparkles, FileText, Send, CheckCircle, Loader2, Upload, ArrowRight } from "lucide-react";
import { generateDrafts } from "@/services/api";
import Link from "next/link";

export default function CampaignsPage() {
    const [useLLM, setUseLLM] = useState(true);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: number, failed: number } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(Array.from(e.target.files));
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        setResult(null);
        try {
            const data = await generateDrafts(useLLM, attachments);
            setResult({ success: data.success, failed: data.failed });
        } catch (error) {
            console.error(error);
            alert("Failed to generate drafts");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container animate-in">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="section-header">
                    <h1 className="section-title">New Campaign</h1>
                    <p className="section-description">Configure AI settings and generate drafts</p>
                </div>

                <div className="space-y-6">
                    {/* AI Toggle */}
                    <div className="card p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-lg bg-accent/20">
                                    <Sparkles className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-text-primary">AI Personalization</h3>
                                    <p className="text-sm text-text-secondary mt-0.5">
                                        Use Gemini to write unique emails for each contact
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setUseLLM(!useLLM)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${useLLM ? 'bg-accent' : 'bg-bg-elevated'
                                    }`}
                            >
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${useLLM ? 'left-6' : 'left-0.5'
                                    }`} />
                            </button>
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="card p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-2.5 rounded-lg bg-bg-elevated">
                                <FileText className="w-5 h-5 text-text-muted" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-text-primary">Context & Attachments</h3>
                                <p className="text-sm text-text-secondary mt-0.5">
                                    Upload resume or case study for AI context
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${attachments.length > 0
                                    ? 'border-accent bg-accent/5'
                                    : 'border-border hover:border-border-strong'
                                }`}>
                                {attachments.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mx-auto">
                                            <CheckCircle className="w-5 h-5 text-accent" />
                                        </div>
                                        <p className="font-medium text-accent">{attachments.length} file(s) selected</p>
                                        <p className="text-xs text-text-muted">{attachments.map(f => f.name).join(", ")}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center mx-auto">
                                            <Upload className="w-5 h-5 text-text-muted" />
                                        </div>
                                        <p className="font-medium text-text-primary">Drop files here</p>
                                        <p className="text-sm text-text-muted">or click to browse</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Result */}
                    {result && (
                        <div className="card p-6 bg-success/5 border-success/30">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-success" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-success">Generation Complete</h4>
                                    <p className="text-sm text-text-secondary">
                                        Drafted {result.success} emails
                                        {result.failed > 0 && <span className="text-error"> ({result.failed} failed)</span>}
                                    </p>
                                </div>
                                <Link href="/dashboard/drafts" className="btn-secondary text-sm">
                                    View Drafts <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="btn-primary w-full h-12 text-base font-semibold"
                    >
                        {loading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                        ) : (
                            <><Send className="w-5 h-5" /> Generate Drafts</>
                        )}
                    </button>

                    <p className="text-center text-sm text-text-muted">
                        Creates drafts in Gmail for all unprocessed contacts
                    </p>
                </div>
            </div>
        </div>
    );
}
