"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarClock, Check, Edit2, ExternalLink, FilePenLine, Loader2, Mail, RefreshCw, Rocket, Send, Trash2 } from "lucide-react";
import { deleteDraft, fetchDrafts, sendAllDrafts, sendDraft, syncDrafts, updateDraft, type EmailLog } from "@/services/api";
import { useSafeTimeout } from "@/lib/timeout";
import { useAuth } from "@/hooks/useAuth";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBanner } from "@/components/ui/status-banner";

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export default function DraftsPage() {
    const safeTimeout = useSafeTimeout();
    const { status, loading } = useAuth();
    const identity = status?.authenticated && status.email ? status.email.trim().toLowerCase() : null;
    const cacheKey = useMemo(() => identity ? `outreachpro:drafts:${identity}` : null, [identity]);
    const identityRef = useRef<string | null>(null);
    const [drafts, setDrafts] = useState<EmailLog[]>([]);
    const [sendingId, setSendingId] = useState<number | null>(null);
    const [sendingAll, setSendingAll] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState<EmailLog | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editSubject, setEditSubject] = useState("");
    const [editBody, setEditBody] = useState("");
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncedAt, setSyncedAt] = useState<string | null>(null);

    const applyDrafts = useCallback((items: EmailLog[], at?: string | null) => {
        setDrafts(items);
        setSelectedDraft((previous) => items.find((draft) => draft.id === previous?.id) || items[0] || null);
        if (at) setSyncedAt(at);
        if (cacheKey) localStorage.setItem(cacheKey, JSON.stringify({ drafts: items, syncedAt: at || new Date().toISOString() }));
    }, [cacheKey]);

    const loadDrafts = useCallback(async () => {
        if (!identity) return;
        const data = await fetchDrafts();
        if (identityRef.current === identity) applyDrafts(data);
    }, [applyDrafts, identity]);

    const refreshFromGmail = useCallback(async (quiet = false) => {
        if (!identity || document.visibilityState !== "visible") return;
        const requestedFor = identity;
        setIsSyncing(true);
        if (!quiet) setMessage({ type: "info", text: "Syncing drafts with Gmail…" });
        try {
            const data = await syncDrafts();
            if (identityRef.current !== requestedFor) return;
            applyDrafts(data.drafts, data.synced_at);
            if (!quiet) setMessage(data.status === "gmail_checked"
                ? { type: "success", text: "Gmail draft availability checked." }
                : { type: "info", text: "Gmail is unavailable. Showing the local draft queue." });
        } catch {
            if (!quiet) setMessage({ type: "error", text: "Failed to synchronize drafts." });
        } finally {
            setIsSyncing(false);
        }
    }, [applyDrafts, identity]);

    useEffect(() => {
        identityRef.current = identity;
        if (!identity) {
            setDrafts([]);
            setSelectedDraft(null);
            setSyncedAt(null);
        }
    }, [identity]);

    useEffect(() => {
        if (loading || !identity || !cacheKey) return;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached) as { drafts?: EmailLog[]; syncedAt?: string };
                if (parsed.drafts) applyDrafts(parsed.drafts, parsed.syncedAt);
            } catch { localStorage.removeItem(cacheKey); }
        }
        void refreshFromGmail(true);
        const interval = window.setInterval(() => void refreshFromGmail(true), SYNC_INTERVAL_MS);
        const refreshWhenActive = () => { if (document.visibilityState === "visible") void refreshFromGmail(true); };
        window.addEventListener("focus", refreshWhenActive);
        window.addEventListener("online", refreshWhenActive);
        document.addEventListener("visibilitychange", refreshWhenActive);
        return () => { window.clearInterval(interval); window.removeEventListener("focus", refreshWhenActive); window.removeEventListener("online", refreshWhenActive); document.removeEventListener("visibilitychange", refreshWhenActive); };
    }, [applyDrafts, cacheKey, identity, loading, refreshFromGmail]);

    const handleSend = async (id: number) => { setSendingId(id); setMessage(null); try { await sendDraft(id); setMessage({ type: "success", text: "Email sent successfully." }); await loadDrafts(); } catch { setMessage({ type: "error", text: "Failed to send. Check the Gmail draft and try again." }); } finally { setSendingId(null); } };
    const handleSendAll = async () => { setSendingAll(true); setMessage(null); try { await sendAllDrafts(); setMessage({ type: "success", text: "Batch send started." }); safeTimeout(() => void refreshFromGmail(true), 2000); } catch { setMessage({ type: "error", text: "Failed to start batch send." }); } finally { setSendingAll(false); } };
    const handleDelete = async (id: number) => { setIsDeleting(id); setMessage(null); try { await deleteDraft(id); setMessage({ type: "success", text: "Draft deleted." }); setIsEditing(false); await loadDrafts(); } catch { setMessage({ type: "error", text: "Failed to delete draft." }); } finally { setIsDeleting(null); } };
    const startEditing = () => { if (selectedDraft) { setEditSubject(selectedDraft.subject || ""); setEditBody(selectedDraft.body || ""); setIsEditing(true); } };
    const saveEdit = async () => { if (!selectedDraft) return; setMessage(null); try { await updateDraft(selectedDraft.id, editSubject, editBody); setMessage({ type: "success", text: "Draft updated." }); setIsEditing(false); await loadDrafts(); } catch { setMessage({ type: "error", text: "Failed to update draft." }); } };
    const pendingDrafts = drafts.filter((draft) => draft.status === "draft");

    return <div className="page-container animate-in">
        <div className="section-header flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="coach-kicker">Review desk</p><h1 className="section-title mt-3">Read every message before it leaves.</h1><p className="section-description">{pendingDrafts.length ? `${pendingDrafts.length} draft${pendingDrafts.length === 1 ? "" : "s"} waiting for your decision.` : "Your messages will appear here once you generate a campaign."}</p>{syncedAt && <p className="mt-2 text-xs text-text-muted">Last synced {new Date(syncedAt).toLocaleTimeString()}</p>}</div><div className="flex flex-wrap items-center gap-2"><button onClick={() => void refreshFromGmail()} disabled={isSyncing} className="btn-secondary text-sm">{isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sync Gmail</button>{pendingDrafts.length > 0 && <button onClick={handleSendAll} disabled={sendingAll} className="btn-primary text-sm">{sendingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}{sendingAll ? "Sending" : `Send all (${pendingDrafts.length})`}</button>}</div></div>
        {message && <StatusBanner type={message.type} message={message.text} className="mb-6" />}
        {drafts.length === 0 ? <section className="workspace-empty"><div><div className="workspace-empty-icon mx-auto"><FilePenLine className="h-6 w-6" /></div><h2 className="mt-5 text-xl font-bold tracking-tight text-text-primary">Your review desk is clear.</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-secondary">Create a campaign when you are ready. Each draft will arrive here for your review before any email is sent.</p><Link href="/dashboard/campaigns" className="btn-primary mt-6 text-sm">Create a campaign <Send className="h-4 w-4" /></Link></div></section> : <div className="grid gap-5 xl:grid-cols-[minmax(18rem,.72fr)_minmax(0,1.28fr)]"><section className="workspace-table min-w-0"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="data-line">Draft queue</p><p className="mt-1 text-sm text-text-secondary">Changes in Gmail refresh automatically while this tab is open.</p></div><span className="badge badge-accent">{pendingDrafts.length} open</span></div><div className="divide-y divide-border">{drafts.map((draft) => <button key={draft.id} type="button" onClick={() => { setSelectedDraft(draft); setIsEditing(false); }} className={`group w-full px-5 py-4 text-left transition ${selectedDraft?.id === draft.id ? "bg-accent/8" : "hover:bg-bg-elevated"}`}><div className="flex gap-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${draft.status === "sent" ? "bg-success" : "bg-accent"}`} /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><span className="truncate font-semibold text-text-primary">{draft.recipient_name}</span><span className={draft.status === "sent" ? "badge badge-success" : "badge badge-accent"}>{draft.status}</span></span><span className="mt-1 block truncate text-sm text-text-secondary">{draft.subject || "(No subject)"}</span><span className="mt-2 block text-xs text-text-muted">{draft.company || draft.recipient_email}</span></span></div></button>)}</div></section><section className="coach-panel min-w-0 p-5 sm:p-7">{selectedDraft ? <div className="space-y-6"><div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="data-line">To</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{selectedDraft.recipient_name}</h2><p className="mt-1 text-sm text-text-secondary">{selectedDraft.recipient_email}{selectedDraft.company ? ` · ${selectedDraft.company}` : ""}</p></div><div className="flex items-center gap-2">{selectedDraft.status !== "sent" && !isEditing && <button onClick={startEditing} className="btn-secondary text-sm"><Edit2 className="h-4 w-4" /> Edit</button>}<a href="https://mail.google.com/mail/u/0/#drafts" target="_blank" rel="noreferrer" className="btn-ghost text-sm"><ExternalLink className="h-4 w-4" /> Gmail</a></div></div>{isEditing ? <div className="space-y-5"><div className="field-stack"><label className="field-label" htmlFor="draft-subject">Subject</label><input id="draft-subject" value={editSubject} onChange={(event) => setEditSubject(event.target.value)} className="input" /></div><div className="field-stack"><label className="field-label" htmlFor="draft-body">Message</label><textarea id="draft-body" value={editBody} onChange={(event) => setEditBody(event.target.value)} className="input min-h-80 resize-y leading-7" /></div><div className="flex flex-wrap gap-2 border-t border-border pt-5"><button onClick={saveEdit} className="btn-primary"><Check className="h-4 w-4" /> Save changes</button><button onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button></div></div> : <><div><p className="data-line">Subject</p><p className="mt-2 text-lg font-semibold text-text-primary">{selectedDraft.subject || "(No subject)"}</p></div><div className="rounded-xl border border-border bg-bg-surface p-5 text-sm leading-7 text-text-primary whitespace-pre-wrap">{selectedDraft.body || "(No content)"}</div><div className="flex flex-col gap-4 border-t border-border pt-5"><p className="text-xs text-text-muted">Created {new Date(selectedDraft.created_at).toLocaleString()}</p>{selectedDraft.status !== "sent" && <div className="flex flex-wrap gap-2"><IconButton onClick={() => handleDelete(selectedDraft.id)} disabled={isDeleting === selectedDraft.id} label="Delete draft">{isDeleting === selectedDraft.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-error" />}</IconButton><button onClick={() => setMessage({ type: "info", text: "To schedule this email, open it in Gmail Drafts, use the arrow beside Send, then choose Schedule send." })} className="btn-secondary text-sm"><CalendarClock className="h-4 w-4" /> Schedule in Gmail</button><button onClick={() => handleSend(selectedDraft.id)} disabled={sendingId === selectedDraft.id} className="btn-primary text-sm">{sendingId === selectedDraft.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{sendingId === selectedDraft.id ? "Sending" : "Send this email"}</button></div>}</div></>}</div> : <div className="grid min-h-96 place-items-center text-center"><div><div className="workspace-empty-icon mx-auto"><Mail className="h-6 w-6" /></div><p className="mt-4 font-semibold text-text-primary">Choose a draft to begin</p><p className="mt-1 text-sm text-text-secondary">Its full message will appear here.</p></div></div>}</section></div>}
    </div>;
}
