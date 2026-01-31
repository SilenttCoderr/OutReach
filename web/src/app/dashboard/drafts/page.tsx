"use client";

import { useState, useEffect } from "react";
import { Mail, Send, ExternalLink, Loader2, CheckCircle, AlertCircle, Rocket } from "lucide-react";
import { fetchDrafts, sendDraft, sendAllDrafts, type EmailLog } from "@/services/api";

export default function DraftsPage() {
    const [drafts, setDrafts] = useState<EmailLog[]>([]);
    const [sendingId, setSendingId] = useState<number | null>(null);
    const [sendingAll, setSendingAll] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState<EmailLog | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadDrafts();
    }, []);

    async function loadDrafts() {
        try {
            const data = await fetchDrafts();
            setDrafts(data);
            if (data.length > 0 && !selectedDraft) {
                setSelectedDraft(data[0]);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const handleSend = async (id: number) => {
        setSendingId(id);
        setMessage(null);
        try {
            await sendDraft(id);
            setMessage({ type: 'success', text: "Email sent successfully!" });
            loadDrafts();
        } catch (error) {
            setMessage({ type: 'error', text: "Failed to send. Check Gmail draft." });
        } finally {
            setSendingId(null);
        }
    };

    const handleSendAll = async () => {
        setSendingAll(true);
        setMessage(null);
        try {
            await sendAllDrafts();
            setMessage({ type: 'success', text: "Batch send started!" });
            setTimeout(loadDrafts, 2000);
        } catch (error) {
            setMessage({ type: 'error', text: "Failed to start batch send." });
        } finally {
            setSendingAll(false);
        }
    };

    const pendingDrafts = drafts.filter(d => d.status === 'draft');

    return (
        <div className="page-container animate-in">
            {/* Header */}
            <div className="section-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="section-title">Drafts</h1>
                    <p className="section-description">{pendingDrafts.length} drafts ready to send</p>
                </div>

                {pendingDrafts.length > 0 && (
                    <button onClick={handleSendAll} disabled={sendingAll} className="btn-primary">
                        {sendingAll ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Rocket className="w-4 h-4" />
                        )}
                        {sendingAll ? "Sending..." : `Send All (${pendingDrafts.length})`}
                    </button>
                )}
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-success/10 border border-success/30'
                        : 'bg-error/10 border border-error/30'
                    }`}>
                    {message.type === 'success'
                        ? <CheckCircle className="w-5 h-5 text-success" />
                        : <AlertCircle className="w-5 h-5 text-error" />
                    }
                    <span className={message.type === 'success' ? 'text-success' : 'text-error'}>
                        {message.text}
                    </span>
                </div>
            )}

            {/* Content */}
            {drafts.length === 0 ? (
                <div className="card p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-bg-elevated flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-text-muted" />
                    </div>
                    <p className="text-lg font-medium text-text-primary mb-1">No drafts found</p>
                    <p className="text-text-secondary">Generate some in the Campaigns tab</p>
                </div>
            ) : (
                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Draft List */}
                    <div className="lg:col-span-2 space-y-2">
                        {drafts.map((draft) => (
                            <div
                                key={draft.id}
                                onClick={() => setSelectedDraft(draft)}
                                className={`card p-4 cursor-pointer ${selectedDraft?.id === draft.id ? 'border-accent bg-accent/5' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={
                                                draft.status === 'sent' ? 'badge badge-success' : 'badge badge-accent'
                                            }>
                                                {draft.status}
                                            </span>
                                        </div>
                                        <h3 className="font-medium text-text-primary truncate">{draft.recipient_name}</h3>
                                        <p className="text-sm text-text-secondary truncate">{draft.company}</p>
                                    </div>

                                    {draft.status !== 'sent' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSend(draft.id);
                                            }}
                                            disabled={sendingId === draft.id}
                                            className="p-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                                        >
                                            {sendingId === draft.id
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Send className="w-4 h-4" />
                                            }
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Preview */}
                    <div className="lg:col-span-3">
                        <div className="card p-6 sticky top-24">
                            {selectedDraft ? (
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-xl font-semibold text-text-primary">{selectedDraft.recipient_name}</h2>
                                            <p className="text-text-secondary">{selectedDraft.recipient_email}</p>
                                        </div>
                                        <a
                                            href="https://gmail.com"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn-ghost text-sm"
                                        >
                                            <ExternalLink className="w-4 h-4" /> Gmail
                                        </a>
                                    </div>

                                    <div className="border-t border-border pt-4">
                                        <p className="text-sm text-text-muted mb-1">Subject</p>
                                        <p className="font-medium text-text-primary">{selectedDraft.subject || "(No Subject)"}</p>
                                    </div>

                                    <div className="border-t border-border pt-4">
                                        <p className="text-sm text-text-muted mb-1">Company</p>
                                        <p className="text-text-primary">{selectedDraft.company}</p>
                                    </div>

                                    <div className="border-t border-border pt-4">
                                        <p className="text-sm text-text-muted mb-1">Created</p>
                                        <p className="text-sm text-text-secondary">{new Date(selectedDraft.created_at).toLocaleString()}</p>
                                    </div>

                                    {selectedDraft.status !== 'sent' && (
                                        <button
                                            onClick={() => handleSend(selectedDraft.id)}
                                            disabled={sendingId === selectedDraft.id}
                                            className="btn-primary w-full mt-4"
                                        >
                                            {sendingId === selectedDraft.id
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                                                : <><Send className="w-4 h-4" /> Send Email</>
                                            }
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-text-muted">
                                    <Mail className="w-12 h-12 mx-auto opacity-30 mb-3" />
                                    <p>Select a draft to preview</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
