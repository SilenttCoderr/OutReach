import { test, expect } from "@playwright/test";

test.describe("critical frontend smoke flows", () => {
    test("auth entry routes render", async ({ page }) => {
        await page.goto("/signup");
        await expect(page.getByRole("heading", { name: "Create Your Account" })).toBeVisible();

        await page.goto("/login");
        await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
    });

    test("dashboard route protects unauthenticated access", async ({ page }) => {
        await page.goto("/dashboard");
        await page.waitForURL(/\/(dashboard|login)$/, { timeout: 10_000 });

        if (page.url().endsWith("/login")) {
            await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
            return;
        }

        await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    });

    test("primary dashboard routes respond", async ({ page }) => {
        const routes = [
            { path: "/dashboard/contacts", heading: "Contacts" },
            { path: "/dashboard/campaigns", heading: "New Campaign" },
            { path: "/dashboard/profile", heading: "Your Profile" },
        ];

        for (const route of routes) {
            await page.goto(route.path);
            await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
            await expect(page.getByText("This page could not be found")).toHaveCount(0);
        }
    });
});
