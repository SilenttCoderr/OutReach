"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Shield, UserRound, Activity, MailCheck, Coins, Send, FileText } from "lucide-react";
import { fetchAdminOverview, updateUserCredits, type AdminOverview } from "@/services/api";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBanner } from "@/components/ui/status-banner";

const EMPTY_OVERVIEW: AdminOverview = {
    metrics: {
        total_users: 0,
        live_accounts_30d: 0,
        gmail_connected_accounts: 0,
        total_contacts: 0,
        total_sent_emails: 0,
        total_draft_emails: 0,
        total_credits: 0,
    },
    users: [],
};

function formatDate(value?: string | null): string {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString();
}

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [forbidden] = useState(false);
    const [overview, setOverview] = useState<AdminOverview>(EMPTY_OVERVIEW);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [creditDrafts, setCreditDrafts] = useState<Record<number, string>>({});
    const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

    const loadOverview = async () => {
        setError(null);
        const data = await fetchAdminOverview();
        setOverview(data);
    };

    useEffect(() => {
        async function initialize() {
            try {
                await loadOverview();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load admin dashboard.");
            } finally {
                setLoading(false);
            }
        }

        void initialize();
    }, []);

    const users = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) {
            return overview.users;
        }

        return overview.users.filter((user) =>
            user.email.toLowerCase().includes(q)
            || (user.name || "").toLowerCase().includes(q)
            || String(user.id).includes(q),
        );
    }, [overview.users, search]);

    const applyCreditChange = async (userId: number, operation: "add" | "set", amount: number) => {
        setUpdatingUserId(userId);
        setError(null);
        setSuccess(null);

        try {
            await updateUserCredits(userId, operation, amount);
            await loadOverview();
            setSuccess(operation === "add" ? "Credits updated." : "Credits value set.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update credits.");
        } finally {
            setUpdatingUserId(null);
        }
    };

    if (loading) {
        return (
            <div className="page-container animate-in">
                <div className="section-header">
                    <h1 className="section-title">Admin</h1>
                    <p className="section-description">Loading admin controls...</p>
                </div>
            </div>
        );
    }

    if (forbidden) {
        return (
            <div className="page-container animate-in">
                <div className="section-header">
                    <h1 className="section-title">Admin</h1>
                    <p className="section-description">Restricted access</p>
                </div>
                <StatusBanner
                    type="error"
                    title="Admin Access Required"
                    message="This dashboard is only available for your configured admin account."
                />
            </div>
        );
    }

    return (
        <div className="page-container animate-in">
            <div className="section-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="section-title">Admin Dashboard</h1>
                    <p className="section-description">Account controls, usage visibility, and credit management</p>
                </div>
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => void loadOverview()}
                    disabled={updatingUserId !== null}
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {error && <StatusBanner type="error" message={error} className="mb-6" />}
            {success && <StatusBanner type="success" message={success} className="mb-6" />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard icon={UserRound} label="Total Accounts" value={overview.metrics.total_users} />
                <StatCard icon={Activity} label="Live (30d)" value={overview.metrics.live_accounts_30d} />
                <StatCard icon={MailCheck} label="Gmail Connected" value={overview.metrics.gmail_connected_accounts} />
                <StatCard icon={Coins} label="Total Credits" value={overview.metrics.total_credits} />
                <StatCard icon={Shield} label="Total Contacts" value={overview.metrics.total_contacts} />
                <StatCard icon={Send} label="Sent Emails" value={overview.metrics.total_sent_emails} />
                <StatCard icon={FileText} label="Draft Emails" value={overview.metrics.total_draft_emails} />
            </div>

            <div className="mb-4 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                    type="text"
                    className="input pl-11"
                    placeholder="Search accounts by email, name, or ID"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="table-header">
                            <tr>
                                <th className="px-4 py-3 text-left">Account</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Credits</th>
                                <th className="px-4 py-3 text-left">Last Login</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-text-muted">
                                        No accounts matched your search.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const draft = creditDrafts[user.id] ?? String(user.credits);
                                    const busy = updatingUserId === user.id;

                                    return (
                                        <tr key={user.id} className="table-row">
                                            <td className="px-4 py-4">
                                                <div className="font-medium text-text-primary">{user.name || "Unnamed user"}</div>
                                                <div className="text-text-secondary text-xs">{user.email}</div>
                                                <div className="text-text-muted text-xs">ID: {user.id}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={user.is_live ? "badge badge-success" : "badge badge-default"}>
                                                        {user.is_live ? "live" : "inactive"}
                                                    </span>
                                                    <span className={user.gmail_connected ? "badge badge-accent" : "badge badge-default"}>
                                                        {user.gmail_connected ? "gmail" : "no gmail"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-text-primary font-semibold">{user.credits}</td>
                                            <td className="px-4 py-4 text-text-secondary">{formatDate(user.last_login)}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn-secondary text-sm"
                                                        disabled={busy}
                                                        onClick={() => void applyCreditChange(user.id, "add", 10)}
                                                    >
                                                        +10
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-secondary text-sm"
                                                        disabled={busy}
                                                        onClick={() => void applyCreditChange(user.id, "add", -10)}
                                                    >
                                                        -10
                                                    </button>
                                                    <input
                                                        className="input w-24"
                                                        value={draft}
                                                        onChange={(event) => {
                                                            setCreditDrafts((prev) => ({ ...prev, [user.id]: event.target.value }));
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn-primary text-sm"
                                                        disabled={busy}
                                                        onClick={() => {
                                                            const value = Number.parseInt(draft, 10);
                                                            if (Number.isNaN(value)) {
                                                                setError("Enter a valid number before setting credits.");
                                                                return;
                                                            }
                                                            void applyCreditChange(user.id, "set", value);
                                                        }}
                                                    >
                                                        Set
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

