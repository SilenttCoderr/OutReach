"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <div className="flex h-dvh min-h-0 bg-bg-base overflow-hidden">
            <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <Header onOpenMenu={() => setMobileNavOpen(true)} />
                <main
                    className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
                    onClick={() => {
                        if (mobileNavOpen) {
                            setMobileNavOpen(false);
                        }
                    }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
