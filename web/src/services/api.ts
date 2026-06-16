const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

// Backend endpoints are mounted under /api in FastAPI.
// Accept NEXT_PUBLIC_API_URL as either https://host or https://host/api.
export const API_BASE_URL = rawApiUrl
    ? (rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`)
    : "/api";

// Used for OAuth hops that must hit the backend origin directly.
export const API_ORIGIN = rawApiUrl
    ? (rawApiUrl.endsWith("/api") ? rawApiUrl.slice(0, -4) : rawApiUrl)
    : "";

interface ApiErrorPayload {
    detail?: string;
    message?: string;
    error?: string;
}

function getStoredToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }
    return localStorage.getItem("token");
}

function redirectToLogin(): void {
    if (typeof window !== "undefined") {
        window.location.assign("/login");
    }
}

function buildHeaders(options: { requiresAuth?: boolean; json?: boolean; base?: HeadersInit } = {}): Headers {
    const headers = new Headers(options.base);

    if (options.json) {
        headers.set("Content-Type", "application/json");
    }

    if (options.requiresAuth) {
        const token = getStoredToken();
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
    }

    return headers;
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
    try {
        const data = (await response.json()) as ApiErrorPayload;
        return data.detail || data.message || data.error || fallback;
    } catch {
        return fallback;
    }
}

async function requestJson<T>(
    path: string,
    options: {
        method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        requiresAuth?: boolean;
        json?: boolean;
        body?: BodyInit | null;
        redirectOnUnauthorized?: boolean;
        fallbackError: string;
        headers?: HeadersInit;
    },
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method || "GET",
        headers: buildHeaders({
            requiresAuth: options.requiresAuth,
            json: options.json,
            base: options.headers,
        }),
        body: options.body,
    });

    if (response.status === 401) {
        if (options.redirectOnUnauthorized !== false) {
            redirectToLogin();
        }
        throw new Error("Unauthorized");
    }

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response, options.fallbackError));
    }

    return (await response.json()) as T;
}

export function getGoogleAuthUrl(): string {
    return `${API_ORIGIN}/api/auth/google`;
}

export function setAuthToken(token: string): void {
    if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
    }
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

export interface UploadCsvResponse {
    filename?: string;
    total_contacts?: number;
    new_added: number;
    already_exists: number;
}

export interface ManualContactPayload {
    recruiter_name: string;
    recruiter_email: string;
    company: string;
    role: string;
}

type RecruiterApiRecord = Partial<Recruiter> & {
    name?: string;
    email?: string;
};

export interface AuthTokenResponse {
    access_token: string;
    token_type: string;
}

export interface AuthStatus {
    authenticated: boolean;
    email?: string;
    credits?: number;
    gmail_connected?: boolean;
    is_admin?: boolean;
}

export interface AdminMetrics {
    total_users: number;
    live_accounts_30d: number;
    gmail_connected_accounts: number;
    total_contacts: number;
    total_sent_emails: number;
    total_draft_emails: number;
    total_credits: number;
}

export interface AdminUserAccount {
    id: number;
    email: string;
    name?: string | null;
    credits: number;
    gmail_connected: boolean;
    is_live: boolean;
    created_at?: string | null;
    last_login?: string | null;
}

export interface AdminOverview {
    metrics: AdminMetrics;
    users: AdminUserAccount[];
}

export interface DraftGenerationProgress {
    contact: string | null;
    status: 'success' | 'failed';
    errors: string[];
}

export interface DraftGenerationResponse {
    success: number;
    failed: number;
    total?: number;
    message?: string;
    errors?: DraftGenerationProgress[];
    progress?: DraftGenerationProgress[];
}

export interface SendDraftResponse {
    message?: string;
    status?: string;
}

export interface SendAllDraftsResponse {
    queued: number;
    message: string;
}

export interface EmailLog {
    id: number;
    recipient_email: string;
    recipient_name: string;
    company: string;
    subject: string;
    body?: string | null;
    status: string;
    created_at: string;
    sent_at?: string | null;
}

export interface UserProfile {
    id?: number;
    full_name: string;
    phone?: string | null;
    linkedin?: string | null;
    github?: string | null;
    portfolio?: string | null;
    current_title: string;
    current_company: string;
    degree: string;
    university: string;
    graduation_date?: string | null;
    experience_summary: string;
    key_skills: string[];
    highlights: string[];
    preferred_roles?: string[];
    email_sign_off: string;
    created_at?: string;
    updated_at?: string;
}

interface ProfileEnvelope {
    profile: Partial<UserProfile> | null;
    complete?: boolean;
    message?: string;
}

const EMPTY_PROFILE: UserProfile = {
    full_name: "",
    current_title: "",
    current_company: "",
    degree: "",
    university: "",
    experience_summary: "",
    key_skills: [],
    highlights: [],
    preferred_roles: [],
    email_sign_off: "Best regards,",
};

function normalizeProfile(profile?: Partial<UserProfile> | null): UserProfile {
    if (!profile) {
        return { ...EMPTY_PROFILE };
    }

    return {
        ...EMPTY_PROFILE,
        ...profile,
        key_skills: profile.key_skills || [],
        highlights: profile.highlights || [],
        preferred_roles: profile.preferred_roles || [],
    };
}

function normalizeRecruiter(record: RecruiterApiRecord): Recruiter {
    return {
        id: record.id,
        recruiter_name: record.recruiter_name || record.name || "",
        recruiter_email: record.recruiter_email || record.email || "",
        company: record.company || "",
        role: record.role || "",
        status: record.status,
    };
}

function escapeCsvCell(value: string): string {
    if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

export async function fetchStats(): Promise<Stats> {
    return requestJson<Stats>("/stats", {
        requiresAuth: true,
        json: true,
        fallbackError: "Failed to fetch stats",
    });
}

export async function uploadCSV(file: File): Promise<UploadCsvResponse> {
    const formData = new FormData();
    formData.append("file", file);

    return requestJson<UploadCsvResponse>("/upload", {
        method: "POST",
        requiresAuth: true,
        body: formData,
        fallbackError: "Upload failed",
    });
}

// Uses existing CSV upload contract so manual add works without backend route changes.
export async function addManualContact(contact: ManualContactPayload): Promise<UploadCsvResponse> {
    const csv = [
        "recruiter_name,recruiter_email,company,role",
        [
            escapeCsvCell(contact.recruiter_name.trim()),
            escapeCsvCell(contact.recruiter_email.trim()),
            escapeCsvCell(contact.company.trim()),
            escapeCsvCell(contact.role.trim()),
        ].join(","),
    ].join("\n");

    const file = new File([csv], "manual-contact.csv", { type: "text/csv" });
    return uploadCSV(file);
}

export async function loginWithEmail(email: string, password: string): Promise<AuthTokenResponse> {
    return requestJson<AuthTokenResponse>("/auth/login", {
        method: "POST",
        json: true,
        body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
        }),
        fallbackError: "Invalid email or password",
        redirectOnUnauthorized: false,
    });
}

export async function registerWithEmail(name: string, email: string, password: string): Promise<AuthTokenResponse> {
    return requestJson<AuthTokenResponse>("/auth/register", {
        method: "POST",
        json: true,
        body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
        }),
        fallbackError: "Registration failed",
        redirectOnUnauthorized: false,
    });
}

export async function checkAuthStatus(): Promise<AuthStatus> {
    const token = getStoredToken();
    if (!token) {
        return { authenticated: false, gmail_connected: false, is_admin: false };
    }

    try {
        return await requestJson<AuthStatus>("/auth/status", {
            requiresAuth: true,
            fallbackError: "Failed to check auth status",
            redirectOnUnauthorized: false,
        });
    } catch {
        return { authenticated: false, gmail_connected: false, is_admin: false };
    }
}

export async function buyCredits(credits: number = 50, amount: number = 1000): Promise<{ url: string }> {
    return requestJson<{ url: string }>("/stripe/create-checkout-session", {
        method: "POST",
        requiresAuth: true,
        json: true,
        body: JSON.stringify({ credits, amount }),
        fallbackError: "Failed to create checkout session",
    });
}

export async function fetchContacts(status?: string): Promise<Recruiter[]> {
    const query = status
        ? `/contacts?status=${encodeURIComponent(status)}&limit=100`
        : "/contacts?limit=100";

    const contacts = await requestJson<RecruiterApiRecord[]>(query, {
        requiresAuth: true,
        json: true,
        fallbackError: "Failed to fetch contacts",
    });

    return contacts.map(normalizeRecruiter);
}

export async function updateContact(contactId: string, payload: ManualContactPayload): Promise<Recruiter> {
    const contact = await requestJson<RecruiterApiRecord>(`/contacts/${contactId}`, {
        method: "PUT",
        requiresAuth: true,
        json: true,
        body: JSON.stringify(payload),
        fallbackError: "Failed to update contact",
    });

    return normalizeRecruiter(contact);
}

export async function deleteContact(contactId: string): Promise<{ deleted: boolean }> {
    return requestJson<{ deleted: boolean }>(`/contacts/${contactId}`, {
        method: "DELETE",
        requiresAuth: true,
        json: true,
        fallbackError: "Failed to delete contact",
    });
}

export async function generateDrafts(useLLM: boolean, attachments: File[]): Promise<DraftGenerationResponse> {
    const formData = new FormData();
    formData.append("use_llm", String(useLLM));

    attachments.forEach((file) => {
        formData.append("attachments", file);
    });

    return requestJson<DraftGenerationResponse>("/draft", {
        method: "POST",
        requiresAuth: true,
        body: formData,
        fallbackError: "Failed to generate drafts",
    });
}

export async function fetchDrafts(): Promise<EmailLog[]> {
    return requestJson<EmailLog[]>("/drafts", {
        requiresAuth: true,
        json: true,
        fallbackError: "Failed to fetch drafts",
    });
}

export async function syncDrafts(): Promise<EmailLog[]> {
    return requestJson<EmailLog[]>("/drafts/sync", {
        method: "POST",
        requiresAuth: true,
        json: true,
        fallbackError: "Failed to sync drafts with Gmail",
    });
}

export async function updateDraft(draftId: number, subject: string, body: string): Promise<{ status: string }> {
    return requestJson<{ status: string }>(`/draft/${draftId}`, {
        method: "PUT",
        requiresAuth: true,
        json: true,
        body: JSON.stringify({ subject, body }),
        fallbackError: "Failed to update draft",
    });
}

export async function deleteDraft(draftId: number): Promise<{ status: string }> {
    return requestJson<{ status: string }>(`/draft/${draftId}`, {
        method: "DELETE",
        requiresAuth: true,
        json: true,
        fallbackError: "Failed to delete draft",
    });
}

export async function sendDraft(draftId: number): Promise<SendDraftResponse> {
    return requestJson<SendDraftResponse>(`/send/${draftId}`, {
        method: "POST",
        requiresAuth: true,
        json: true,
        fallbackError: "Failed to send draft",
    });
}

export async function sendAllDrafts(delaySeconds: number = 30): Promise<SendAllDraftsResponse> {
    return requestJson<SendAllDraftsResponse>(`/send-all?delay_seconds=${delaySeconds}`, {
        method: "POST",
        requiresAuth: true,
        json: true,
        fallbackError: "Failed to send all drafts",
    });
}

export function logout(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");
    }
    redirectToLogin();
}

export async function fetchProfile(): Promise<UserProfile> {
    const response = await requestJson<ProfileEnvelope | Partial<UserProfile>>("/profile", {
        requiresAuth: true,
        json: true,
        fallbackError: "Failed to fetch profile",
        redirectOnUnauthorized: true,
    });

    if ("profile" in response) {
        return normalizeProfile(response.profile);
    }

    return normalizeProfile(response);
}

export async function upsertProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const response = await requestJson<ProfileEnvelope | Partial<UserProfile>>("/profile", {
        method: "PUT",
        requiresAuth: true,
        json: true,
        body: JSON.stringify(profile),
        fallbackError: "Failed to save profile",
    });

    if ("profile" in response) {
        return normalizeProfile(response.profile);
    }

    return normalizeProfile(response);
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
    return requestJson<AdminOverview>("/admin/overview", {
        requiresAuth: true,
        json: true,
        fallbackError: "Failed to fetch admin overview",
        redirectOnUnauthorized: false,
    });
}

export async function updateUserCredits(
    userId: number,
    operation: "add" | "set",
    amount: number,
): Promise<AdminUserAccount> {
    return requestJson<AdminUserAccount>(`/admin/users/${userId}/credits`, {
        method: "PATCH",
        requiresAuth: true,
        json: true,
        body: JSON.stringify({ operation, amount }),
        fallbackError: "Failed to update credits",
        redirectOnUnauthorized: false,
    });
}
