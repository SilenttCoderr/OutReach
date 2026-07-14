"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle, ExternalLink, FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { fetchTemplates, generateDrafts, getGoogleAuthUrl, type DraftGenerationProgress, type DraftGenerationResponse, type WorkspaceTemplate } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { StatusBanner } from "@/components/ui/status-banner";
import { SwitchField } from "@/components/ui/switch-field";

export default function CampaignsPage() {
    const maxAttachmentBytes = 18 * 1024 * 1024;
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const [useLLM, setUseLLM] = useState(true);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DraftGenerationResponse | null>(null);
    const [progress, setProgress] = useState<DraftGenerationProgress[]>([]);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [templates, setTemplates] = useState<WorkspaceTemplate[]>([]);
    const [emailTemplateId, setEmailTemplateId] = useState<number | null>(null);
    const [promptTemplateId, setPromptTemplateId] = useState<number | null>(null);
    const { status: authStatus } = useAuth();
    const gmailConnected = authStatus ? Boolean(authStatus.gmail_connected) : null;

    useEffect(() => { fetchTemplates().then(setTemplates).catch(() => undefined); }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const invalid = files.find((file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"));
        if (invalid) {
            setMessage({ type: "error", text: `${invalid.name} is not a PDF.` });
            event.target.value = "";
            return;
        }
        const merged = Array.from(new Map([...attachments, ...files].map((file) => [`${file.name}-${file.size}-${file.lastModified}`, file])).values());
        if (merged.reduce((total, file) => total + file.size, 0) > maxAttachmentBytes) {
            setMessage({ type: "error", text: "Attachments must total 18 MB or less so Gmail can send them safely." });
            event.target.value = "";
            return;
        }
        setAttachments(merged);
        setMessage(null);
        event.target.value = "";
    };

    const removeAttachment = (fileToRemove: File) => setAttachments((files) => files.filter((file) => file !== fileToRemove));

    const handleGenerate = async () => {
        if (gmailConnected !== true) {
            setMessage({ type: "error", text: "Connect Gmail before generating drafts." });
            return;
        }
        setLoading(true);
        setResult(null);
        setProgress([]);
        setMessage(null);
        try {
            const data = await generateDrafts(useLLM, attachments, { emailTemplateId, promptTemplateId });
            setResult(data);
            setProgress(data.progress || []);
            if (data.success > 0) setMessage({ type: "success", text: `Created ${data.success} draft${data.success === 1 ? "" : "s"}. Review them before sending.` });
            if (data.failed > 0) {
                const firstError = data.errors?.[0]?.errors?.[0] || "Check your profile and contacts.";
                setMessage({ type: "error", text: `${data.failed} draft${data.failed === 1 ? "" : "s"} could not be created: ${firstError}` });
            }
        } catch (error: unknown) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to generate drafts. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const completeCount = progress.filter((item) => item.status === "success").length;

    return (
        <div className="page-container animate-in">
            <div className="section-header flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <p className="coach-kicker">Draft studio</p>
                    <h1 className="section-title mt-3">Shape a thoughtful first pass.</h1>
                    <p className="section-description">OutreachPro turns the context you provide into drafts. You remain in control of every message before it is sent.</p>
                </div>
                <Link href="/dashboard/drafts" className="action-link">Review existing drafts <ArrowRight className="h-4 w-4" /></Link>
            </div>

            {message && <StatusBanner type={message.type} message={message.text} className="mb-6" />}

            {gmailConnected === false && (
                <section className="mb-6 flex gap-4 rounded-[var(--radius-xl)] border border-warning/35 bg-warning-muted p-5">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning"><AlertTriangle className="h-5 w-5" /></div>
                    <div className="min-w-0">
                        <h2 className="font-bold text-text-primary">Connect the Gmail account you will send from</h2>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">Draft generation and delivery use your own Gmail account. Sign in with Google to grant that connection.</p>
                        <a href={getGoogleAuthUrl()} className="btn-primary mt-4 text-sm"><ExternalLink className="h-4 w-4" /> Connect Gmail via Google</a>
                    </div>
                </section>
            )}

            <div className="workspace-layout with-rail">
                <section className="coach-panel p-5 sm:p-7">
                    <div className="workflow-step">
                        <span className="workflow-marker">01</span>
                        <div className="flex-1"><h2 className="workspace-section-title">Decide how much guidance to use</h2><p className="workspace-section-copy">Keep personalization on to use your profile and contact context as the starting point for each draft.</p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="field-stack"><span className="field-label">Email template</span><select value={emailTemplateId ?? ""} onChange={(event) => { const id = event.target.value ? Number(event.target.value) : null; setEmailTemplateId(id); if (id) setPromptTemplateId(null); }} className="input"><option value="">Let OutreachPro compose it</option>{templates.filter((template) => template.kind === "email").map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label><label className="field-stack"><span className="field-label">AI prompt preset</span><select value={promptTemplateId ?? ""} onChange={(event) => setPromptTemplateId(event.target.value ? Number(event.target.value) : null)} className="input" disabled={!useLLM || Boolean(emailTemplateId)}><option value="">Use the standard voice</option>{templates.filter((template) => template.kind === "prompt").map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select>{emailTemplateId && <span className="field-help">Email templates supply the full message, so prompt presets are not applied.</span>}</label></div>
                            <Link href="/dashboard/templates" className="action-link mt-3 text-xs">Manage templates and prompts <ArrowRight className="h-3.5 w-3.5" /></Link>
                        </div>
                        <SwitchField checked={useLLM} onCheckedChange={setUseLLM} label="Personalized drafts" />
                    </div>

                    <div className="workflow-step">
                        <span className="workflow-marker">02</span>
                        <div className="min-w-0 flex-1">
                            <h2 className="workspace-section-title">Add optional supporting material</h2>
                            <p className="workspace-section-copy">A resume or case study can give your drafts useful specificity.</p>
                            <label className={`mt-4 flex cursor-pointer items-center gap-4 rounded-xl border border-dashed p-4 transition ${attachments.length ? "border-accent bg-accent/5" : "border-border-strong bg-bg-surface hover:border-accent"}`}>
                                <input ref={attachmentInputRef} type="file" accept="application/pdf,.pdf" multiple onChange={handleFileChange} className="sr-only" />
                                <span className="grid h-10 w-10 place-items-center rounded-xl bg-bg-elevated text-accent"><Upload className="h-5 w-5" /></span>
                                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-text-primary">{attachments.length ? `${attachments.length} PDF${attachments.length === 1 ? "" : "s"} ready` : "Choose supporting PDFs"}</span><span className="mt-0.5 block text-xs text-text-muted">{attachments.length ? "Add more or remove any file below." : "Resumes and case studies · 18 MB total"}</span></span>
                                <FileText className="h-4 w-4 text-text-muted" />
                            </label>
                            {attachments.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{attachments.map((file) => <span key={`${file.name}-${file.lastModified}`} className="attachment-chip"><FileText className="h-3.5 w-3.5 text-accent" /><span className="max-w-52 truncate">{file.name}</span><span className="text-text-muted">{Math.ceil(file.size / 1024)} KB</span><button type="button" aria-label={`Remove ${file.name}`} onClick={(event) => { event.preventDefault(); removeAttachment(file); }}><X className="h-3.5 w-3.5" /></button></span>)}</div>}
                        </div>
                    </div>

                    <div className="workflow-step">
                        <span className="workflow-marker">03</span>
                        <div className="flex-1"><h2 className="workspace-section-title">Create drafts for new contacts</h2><p className="workspace-section-copy">We create drafts only; nothing sends automatically.</p></div>
                        <button onClick={handleGenerate} disabled={loading || gmailConnected !== true} className="btn-primary shrink-0 text-sm">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating</> : <><Sparkles className="h-4 w-4" /> Generate drafts</>}</button>
                    </div>

                    {loading && progress.length > 0 && <div className="mt-5 border-t border-border pt-5"><div className="flex justify-between text-xs text-text-muted"><span>Draft progress</span><span>{completeCount} / {progress.length}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-elevated"><div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(completeCount / progress.length) * 100}%` }} /></div></div>}

                    {result && <div className="mt-5 rounded-xl border border-success/30 bg-success-muted p-4"><div className="flex gap-3"><CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-success" /><div><p className="font-semibold text-text-primary">Generation complete</p><p className="mt-1 text-sm text-text-secondary">{result.success} draft{result.success === 1 ? " is" : "s are"} ready for review{result.failed ? `; ${result.failed} need attention.` : "."}</p>{result.errors?.length ? <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-error">{result.errors.map((error, index) => <li key={`${error.contact}-${index}`}>{error.contact ? `${error.contact}: ` : ""}{error.errors.join(", ")}</li>)}</ul> : null}</div></div></div>}
                </section>

                <aside className="workspace-rail">
                    <p className="data-line">Before you begin</p>
                    <div className="mt-4 space-y-4 text-sm">
                        <div><p className="font-semibold text-text-primary">Your profile</p><p className="mt-1 leading-6 text-text-secondary">Draft quality improves when your experience and highlights are current.</p><Link href="/dashboard/profile" className="action-link mt-2">Refine profile <ArrowRight className="h-4 w-4" /></Link></div>
                        <div className="border-t border-border pt-4"><p className="font-semibold text-text-primary">Your contacts</p><p className="mt-1 leading-6 text-text-secondary">Campaigns use contacts that are still new in your workspace.</p><Link href="/dashboard/contacts" className="action-link mt-2">Review contacts <ArrowRight className="h-4 w-4" /></Link></div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
