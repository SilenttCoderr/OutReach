"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Send, ExternalLink, Loader2, Rocket, Trash2, Edit2, X, Check, RefreshCw } from "lucide-react";
import { fetchDrafts, sendDraft, sendAllDrafts, deleteDraft, updateDraft, syncDrafts, type EmailLog } from "@/services/api";
import { StatusBanner } from "@/components/ui/status-banner";

export default function DraftsPage() {
    const [drafts, setDrafts] = useState<EmailLog[]>([]);
    const [sendingId, setSendingId] = useState<number | null>(null);
    const [sendingAll, setSendingAll] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState<EmailLog | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editSubject, setEditSubject] = useState("");
    const [editBody, setEditBody] = useState("");
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadDrafts = useCallback(async () => {
        try {
            const data = await fetchDrafts();
            setDrafts(data);
            setSelectedDraft((prev) => {
                if (!prev) return data[0] || null;
                const updatedSelection = data.find((draft) => draft.id === prev.id);
                return updatedSelection || data[0] || null;
            });
        } catch {
            setMessage({ type: "error", text: "Failed to load drafts. Please refresh and try again." });
        }
    }, []);

    useEffect(() => {
        void loadDrafts();
    }, [loadDrafts]);

    const handleSend = async (id: number) => {
        setSendingId(id);
        setMessage(null);
        try {
            await sendDraft(id);
            setMessage({ type: 'success', text: "Email sent successfully!" });
            await loadDrafts();
        } catch {
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
            setTimeout(() => { void loadDrafts(); }, 2000);
        } catch {
            setMessage({ type: 'error', text: "Failed to start batch send." });
        } finally {
            setSendingAll(false);
        }
    };

    const handleDelete = async (id: number) => {
        setIsDeleting(id);
        setMessage(null);
        try {
            await deleteDraft(id);
            setMessage({ type: 'success', text: "Draft deleted successfully!" });
            if (selectedDraft?.id === id) {
                setSelectedDraft(null);
                setIsEditing(false);
            }
            await loadDrafts();
        } catch {
            setMessage({ type: 'error', text: "Failed to delete draft." });
        } finally {
            setIsDeleting(null);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        setMessage({ type: 'info', text: "Syncing drafts with Gmail..." });
        try {
            await syncDrafts();
            setMessage({ type: 'success', text: "Drafts synchronized successfully!" });
            await loadDrafts();
        } catch {
            setMessage({ type: 'error', text: "Failed to synchronize drafts." });
        } finally {
            setIsSyncing(false);
        }
    };

    const startEditing = () => {
        if (!selectedDraft) return;
        setEditSubject(selectedDraft.subject || "");
        setEditBody(selectedDraft.body || "");
        setIsEditing(true);
    };

    const saveEdit = async () => {
        if (!selectedDraft) return;
        setMessage(null);
        try {
            await updateDraft(selectedDraft.id, {
                subject: editSubject,
                body: editBody
            });
            setMessage({ type: 'success', text: "Draft updated successfully!" });
            setIsEditing(false);
            await loadDrafts();
        } catch {
            setMessage({ type: 'error', text: "Failed to update draft." });
        }
    };

    const pendingDrafts = drafts.filter(d => d.status === 'draft');

    return (
        <div className="page-container animate-in">
            <div className="section-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="section-title">Drafts</h1>
                    <p className="section-description">{pendingDrafts.length} drafts ready to send</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleSync} disabled={isSyncing} className="btn-secondary">
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync
                    </button>
                    {pendingDrafts.length > 0 && (
                        <button onClick={handleSendAll} disabled={sendingAll} className="btn-primary">
                            {sendingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                            {sendingAll ? "Sending..." : `Send All (${pendingDrafts.length})`}
                        </button>
                    )}
                </div>
            </div>

            {message && <StatusBanner type={message.type} message={message.text} className="mb-6" />}

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
                    <div className="lg:col-span-2 space-y-2">
                        {drafts.map((draft) => (
                            <div
                                key={draft.id}
                                onClick={() => { setSelectedDraft(draft); setIsEditing(false); }}
                                className={`card p-4 cursor-pointer ${selectedDraft?.id === draft.id ? 'border-accent bg-accent/5' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={draft.status === 'sent' ? 'badge badge-success' : 'badge badge-accent'}>
                                                {draft.status}
                                            </span>
                                        </div>
                                        <h3 className="font-medium text-text-primary truncate">{draft.recipient_name}</h3>
                                        <p className="text-sm text-text-secondary truncate">{draft.subject || "(No Subject)"}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {draft.status !== 'sent' && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(draft.id); }}
                                                    disabled={isDeleting === draft.id}
                                                    className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                >
                                                    {isDeleting === draft.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSend(draft.id); }}
                                                    disabled={sendingId === draft.id}   
                                                    className="p-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                                                >
                                                    {sendingId === draft.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-3">
                        <div className="card p-6 sticky top-24">
                            {selectedDraft ? (
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-xl font-semibold text-text-primary">{selectedDraft.recipient_name}</h2>
                                            <p className="text-text-secondary">{selectedDraft.recipient_email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedDraft.status !== 'sent' && !isEditing && (
                                                <button onClick={startEditing} className="btn-secondary text-sm px-3 py-1.5 h-auto">
                                                    <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                                                </button>
                                            )}
                                            <a href="https://gmail.com" target="_blank" rel="noreferrer" className="btn-ghost text-sm">
                                                <ExternalLink className="w-4 h-4" /> Gmail
                                            </a>
                                        </div>
                                    </div>

                                    {isEditing ? (
                                        <div className="space-y-4 pt-4 border-t border-border">
                                            <div>
                                                <label className="block text-sm text-text-muted mb-1">Subject</label>
                                                <input
                                                    type="text"
                                                    value={editSubject}
                                                    onChange={(e) => setEditSubject(e.target.value)}
                                                    className="input-field w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-text-muted mb-1">Body</label>
                                                <textarea
                                                    value={editBody}
                                                    onChange={(e) => setEditBody(e.target.value)}
                                                    className="input-field w-full min-h-[250px] resize-y"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 pt-2">
                                                <button onClick={saveEdit} className="btn-primary flex-1">
                                                    <Check className="w-4 h-4 mr-2" /> Save Changes
                                                </button>
                                                <button onClick={() => setIsEditing(false)} className="btn-secondary px-4">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="border-t border-border pt-4">
                                                <p className="text-sm text-text-muted mb-1">Subject</p>
                                                <p className="font-medium text-text-primary">{selectedDraft.subject || "(No Subject)"}</p>
                                            </div>
                                            <div className="border-t border-border pt-4">
                                                <p className="text-sm text-text-muted mb-1">Body</p>
                                                <div className="bg-bg-elevated p-4 rounded-xl text-text-primary whitespace-pre-wrap text-sm border border-border/50 max-h-[300px] overflow-y-auto">
                                                    {selectedDraft.body || "(No Content)"}
                                                </div>
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
                                                    {sendingId === selectedDraft.id ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Email</>}
                                                </button>
                                            )}
                                        </>
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