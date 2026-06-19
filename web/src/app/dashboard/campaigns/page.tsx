"use client";

import { useState } from "react";
import { Sparkles, FileText, Send, CheckCircle, Loader2, Upload, ArrowRight, AlertTriangle, ExternalLink } from "lucide-react";
import { generateDrafts, getGoogleAuthUrl, DraftGenerationProgress, DraftGenerationResponse } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { SwitchField } from "@/components/ui/switch-field";

export default function CampaignsPage() {
    const [useLLM, setUseLLM] = useState(true);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DraftGenerationResponse | null>(null);
    const [progress, setProgress] = useState<DraftGenerationProgress[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const { status: authStatus } = useAuth();
    const gmailConnected = authStatus ? Boolean(authStatus.gmail_connected) : null;
    const googleAuthUrl = getGoogleAuthUrl();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(Array.from(e.target.files));
        }
    };

    const handleGenerate = async () => {
        if (gmailConnected !== true) {
            setMessage({ type: 'error', text: 'Please connect your Gmail account first by logging in with Google.' });
            return;
        }
        setLoading(true);
        setResult(null);
        setProgress([]);
        setMessage(null);
        try {
            const data = await generateDrafts(useLLM, attachments);
            setResult(data);
            setProgress(data.progress || []);
            if (data.success > 0) {
                setMessage({ type: 'success', text: `Created ${data.success} draft(s) in your Gmail!` });
            } else if (data.failed > 0) {
                const firstError = data.errors?.[0]?.errors?.[0] || 'Check your profile and contacts.';
                setMessage({ type: 'error', text: `${data.failed} draft(s) failed: ${firstError}` });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to generate drafts. Please try again.";
            setMessage({ type: 'error', text: message });
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
                    {/* Gmail Connection Warning */}
                    {gmailConnected === false && (
                        <div className="card p-5 bg-warning/5 border border-warning/30 flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-warning/20 shrink-0">
                                <AlertTriangle className="w-5 h-5 text-warning" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-text-primary mb-1">Gmail Not Connected</h3>
                                <p className="text-sm text-text-secondary mb-3">
                                    Emails are sent <strong>from your own Gmail account</strong>. You must sign in with Google to grant Gmail access. Email/password accounts cannot send emails.
                                </p>
                                <a
                                    href={googleAuthUrl}
                                    className="btn-primary text-sm inline-flex items-center gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Connect Gmail via Google
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Message Banner */}
                    {message && (
                        <div className={`p-4 rounded-lg flex items-start gap-3 ${message.type === 'success'
                            ? 'bg-success/10 border border-success/30'
                            : 'bg-error/10 border border-error/30'
                        }`}>
                            {message.type === 'success'
                                ? <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                                : <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                            }
                            <span className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-error'}`}>
                                {message.text}
                            </span>
                        </div>
                    )}

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

                            <SwitchField
                                checked={useLLM}
                                onCheckedChange={setUseLLM}
                                label="AI personalization"
                            />
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

                    {/* Progress Bar */}
                    {loading && progress.length > 0 && (
                        <div className="w-full my-4">
                            <div className="h-3 bg-border rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-accent transition-all duration-300"
                                    style={{ width: `${(progress.filter(p => p.status === 'success').length / progress.length) * 100}%` }}
                                />
                            </div>
                            <div className="text-xs text-center mt-1 text-text-secondary">
                                {progress.filter(p => p.status === 'success').length} of {progress.length} drafts generated
                            </div>
                        </div>
                    )}

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
                                    {/* Error details */}
                                    {result.errors && result.errors.length > 0 && (
                                        <div className="mt-2">
                                            <h5 className="font-semibold text-error mb-1">Failed Drafts:</h5>
                                            <ul className="list-disc pl-5 text-xs text-error">
                                                {result.errors.map((err, idx) => (
                                                    <li key={idx}>
                                                        {err.contact ? <span>{err.contact}: </span> : null}
                                                        {err.errors.join(", ")}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
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
                        disabled={loading || gmailConnected !== true}
                        className={`btn-primary w-full h-12 text-base font-semibold ${gmailConnected !== true ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                        ) : (
                            <><Send className="w-5 h-5" /> Generate Drafts</>
                        )}
                    </button>

                    <p className="text-center text-sm text-text-muted">
                        Creates drafts in your Gmail for all unprocessed contacts · Emails sent from <strong>your</strong> Gmail address
                    </p>
                </div>
            </div>
        </div>
    );
}
