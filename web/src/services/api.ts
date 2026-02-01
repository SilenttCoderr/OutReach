export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

function getAuthHeader() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Stats {
    credits_available: number;
    total_sent: number;
    total_drafted: number;
    pending: number;
    failed_emails: number;
    success_rate?: number;
}

export interface Recruiter {
    id?: string;
    recruiter_name: string;
    recruiter_email: string;
    company: string;
    role: string;
    status?: string;
}

export async function fetchStats(): Promise<Stats> {
    const headers = getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/stats`, {
        headers: {
            "Content-Type": "application/json",
            ...headers,
        } as any, // Cast to any to avoid type issues with headers object
    });

    if (res.status === 401) {
        window.location.href = "/login";
        throw new Error("Unauthorized");
    }

    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
}

export async function uploadCSV(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    const headers = getAuthHeader();
    // Don't set Content-Type for FormData, browser does it

    const res = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: {
            ...headers,
        } as any,
        body: formData,
    });

    if (res.status === 401) {
        window.location.href = "/login";
        throw new Error("Unauthorized");
    }

    if (!res.ok) throw new Error("Upload failed");
    return res.json();
}

export interface AuthTokenResponse {
    access_token: string;
    token_type: string;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthTokenResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data.detail as string) || "Invalid email or password");
    }
    return res.json();
}

export async function registerWithEmail(name: string, email: string, password: string): Promise<AuthTokenResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
        }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data.detail as string) || "Registration failed");
    }
    return res.json();
}

export async function checkAuthStatus(): Promise<{ authenticated: boolean; email?: string; credits?: number }> {
    try {
        const headers = getAuthHeader();
        if (!headers.Authorization) return { authenticated: false };

        const res = await fetch(`${API_BASE_URL}/auth/status`, {
            headers: {
                ...headers,
            } as any,
        });

        if (!res.ok) return { authenticated: false };
        return res.json();
    } catch {
        return { authenticated: false };
    }
}

export async function buyCredits(credits: number = 50, amount: number = 1000): Promise<{ url: string }> {
    const headers = getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/stripe/create-checkout-session`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        } as any,
        body: JSON.stringify({ credits, amount }),
    });

    if (!res.ok) throw new Error("Failed to create checkout session");
    return res.json();
}

export async function fetchContacts(status?: string): Promise<Recruiter[]> {
    const headers = getAuthHeader();
    const url = status
        ? `${API_BASE_URL}/contacts?status=${status}&limit=100`
        : `${API_BASE_URL}/contacts?limit=100`;

    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...headers,
        } as any,
    });

    if (res.status === 401) {
        window.location.href = "/login";
        throw new Error("Unauthorized");
    }

    if (!res.ok) throw new Error("Failed to fetch contacts");
    return res.json();
}

export async function generateDrafts(useLLM: boolean, attachments: File[]): Promise<any> {
    const formData = new FormData();
    formData.append("use_llm", String(useLLM));

    attachments.forEach((file) => {
        formData.append("attachments", file);
    });

    const headers = getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/draft`, {
        method: "POST",
        headers: {
            ...headers,
        } as any, // Do NOT set Content-Type, fetch sets it for FormData
        body: formData,
    });

    if (!res.ok) throw new Error("Failed to generate drafts");
    return res.json();
}

export interface EmailLog {
    id: number;
    recipient_email: string;
    recipient_name: string;
    company: string;
    subject: string;
    status: string;
    created_at: string;
}

export async function fetchDrafts(): Promise<EmailLog[]> {
    const headers = getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/drafts`, {
        headers: {
            "Content-Type": "application/json",
            ...headers,
        } as any,
    });

    if (!res.ok) throw new Error("Failed to fetch drafts");
    return res.json();
}

export async function sendDraft(draftId: number): Promise<any> {
    const headers = getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/send/${draftId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        } as any,
    });

    if (!res.ok) throw new Error("Failed to send draft");
    return res.json();
}

export async function sendAllDrafts(delaySeconds: number = 30): Promise<{ queued: number; message: string }> {
    const headers = getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/send-all?delay_seconds=${delaySeconds}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        } as any,
    });

    if (res.status === 401) {
        window.location.href = "/login";
        throw new Error("Unauthorized");
    }

    if (!res.ok) throw new Error("Failed to send all drafts");
    return res.json();
}

export function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
}
