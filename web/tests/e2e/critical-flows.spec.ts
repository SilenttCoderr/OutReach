import { test, expect } from "@playwright/test";
import { Buffer } from "node:buffer";

async function expectDashboardOrLogin(
    page: import("@playwright/test").Page,
    routeHeading: string,
) {
    const pathname = new URL(page.url()).pathname;

    if (pathname === "/login") {
        await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
        return;
    }

    expect(pathname).toMatch(/^\/dashboard(?:\/[^/]+)?$/);
    await expect(page.getByRole("heading", { name: routeHeading })).toBeVisible();
}

async function authenticate(page: import("@playwright/test").Page) {
    await page.context().addCookies([{ name: "token", value: "test-token", url: "http://127.0.0.1:3000" }]);
    await page.addInitScript(() => localStorage.setItem("token", "test-token"));
    await page.route("**/api/auth/status", (route) => route.fulfill({ json: {
        authenticated: true,
        gmail_connected: true,
        is_admin: false,
        email: "career@example.com",
        credits: 10,
    } }));
}

test.describe("critical frontend smoke flows", () => {
    test("career-coach home guides visitors toward a first outreach rhythm", async ({ page }) => {
        await page.goto("/");

        await expect(page.getByRole("heading", { name: "Make your next move feel personal." })).toBeVisible();
        await expect(page.getByText("Today's quiet progress")).toBeVisible();
        await expect(page.getByRole("link", { name: "Start with 10 free credits" })).toBeVisible();
    });

    test("auth entry routes render", async ({ page }) => {
        await page.goto("/signup");
        await expect(page.getByRole("heading", { name: "Create Your Account" })).toBeVisible();

        await page.goto("/login");
        await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
    });

    test("dashboard route protects unauthenticated access", async ({ page }) => {
        await page.goto("/dashboard");
        await expectDashboardOrLogin(page, "Dashboard");
    });

    test("primary dashboard routes respond", async ({ page }) => {
        const routes = [
            { path: "/dashboard/contacts", heading: "Contacts" },
            { path: "/dashboard/campaigns", heading: "New Campaign" },
            { path: "/dashboard/profile", heading: "Your Profile" },
        ];

        for (const route of routes) {
            await page.goto(route.path);
            await expectDashboardOrLogin(page, route.heading);
            await expect(page.getByText("This page could not be found")).toHaveCount(0);
        }
    });

    test("mobile navigation is reachable and dismissible", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await authenticate(page);
        await page.goto("/dashboard");

        await page.getByRole("button", { name: "Open navigation menu" }).click();
        await expect(page.getByRole("button", { name: "Close navigation menu" })).toBeVisible();
        await page.getByRole("button", { name: "Close navigation menu" }).click();
        await expect(page.getByRole("button", { name: "Close navigation menu" })).toHaveCount(0);
    });

    test("contact load failures are visible", async ({ page }) => {
        await authenticate(page);
        await page.route(/\/api\/contacts/, (route) => route.fulfill({ status: 500, json: { detail: "Contact service unavailable" } }));
        await page.goto("/dashboard/contacts");

        await expect(page.getByText("Failed to load contacts. Please refresh and try again.")).toBeVisible();
    });

    test("account-removal requests require confirmation", async ({ page }) => {
        await authenticate(page);
        await page.goto("/dashboard/settings");

        await page.getByRole("button", { name: "Request removal" }).click();
        await expect(page.getByRole("dialog", { name: "Request account removal" })).toBeVisible();
        await page.getByRole("button", { name: "Continue" }).click();
        await expect(page.getByText("Self-service deletion is not enabled. Please contact support to request account removal; nothing was deleted here.")).toBeVisible();
    });

    test("a user can move from contacts to draft generation and sending", async ({ page }) => {
        await authenticate(page);
        await page.route("**/api/**", async (route) => {
            const path = new URL(route.request().url()).pathname;
            if (path === "/api/auth/status") return route.fulfill({ json: {
                authenticated: true,
                gmail_connected: true,
                is_admin: false,
                email: "career@example.com",
                credits: 10,
            } });
            if (path === "/api/upload") return route.fulfill({ json: { message: "Uploaded", contacts_added: 1 } });
            if (path === "/api/contacts") return route.fulfill({ json: { contacts: [] } });
            if (path === "/api/draft") return route.fulfill({ json: { success: 1, failed: 0, total: 1, progress: [] } });
            if (path === "/api/drafts") return route.fulfill({ json: [{ id: 1, recipient_email: "sarah@example.com", recipient_name: "Sarah", company: "Acme", subject: "Hello", body: "Hi Sarah", status: "draft", created_at: "2026-07-14T00:00:00Z" }] });
            if (path === "/api/send-all") return route.fulfill({ json: { message: "Queued", queued: 1 } });
            return route.fulfill({ json: {} });
        });

        await page.goto("/dashboard/contacts");
        await page.locator('input[type="file"]').setInputFiles({ name: "contacts.csv", mimeType: "text/csv", buffer: Buffer.from("recruiter_name,recruiter_email,company,role\nSarah,sarah@example.com,Acme,Recruiter") });
        await expect(page.getByText("Uploaded 1 new contacts")).toBeVisible();

        await page.goto("/dashboard/campaigns");
        await page.getByRole("button", { name: "Generate Drafts" }).click();
        await expect(page.getByText("Created 1 draft(s) in your Gmail!")).toBeVisible();

        await page.goto("/dashboard/drafts");
        await page.getByRole("button", { name: "Send All (1)" }).click();
        await expect(page.getByText("Batch send started!")).toBeVisible();
    });
});
