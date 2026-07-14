"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
    LayoutDashboard,
    Users,
    Mail,
    Send,
    Settings,
    FileText,
    LogOut,
    X,
    Zap,
    UserCircle,
    Shield,
} from "lucide-react";
import { logout } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { IconButton } from "@/components/ui/icon-button";

const workspaceNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/contacts", label: "Contacts", icon: Users },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: Send },
    { href: "/dashboard/drafts", label: "Drafts", icon: Mail },
    { href: "/dashboard/templates", label: "Templates", icon: FileText },
];

const preferenceNavItems = [
    { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
    mobileOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { status } = useAuth();
    const isAdmin = Boolean(status?.is_admin);
    const credits = status?.credits ?? 0;

    const preferences = useMemo(() => {
        if (!isAdmin) {
            return preferenceNavItems;
        }

        return [
            { href: "/dashboard/admin", label: "Admin", icon: Shield },
            ...preferenceNavItems,
        ];
    }, [isAdmin]);

    const handleLogout = () => {
        logout();
        onClose?.();
    };

    const renderNavigation = (isMobile: boolean) => (
        <>
            {/* Logo */}
            <div className="h-20 px-5 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-[0_12px_24px_-16px_#a23e2e]">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div><span className="block font-bold text-lg tracking-tight text-text-primary">OutreachPro</span><span className="block text-[11px] text-text-muted">Career outreach, considered</span></div>
                </div>

                {isMobile && (
                    <IconButton
                        onClick={onClose}
                        label="Close navigation menu"
                    >
                        <X className="w-5 h-5 text-text-secondary" />
                    </IconButton>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-7 overflow-y-auto">
                <div className="space-y-1">
                    <p className="data-line px-3 mb-2">Workspace</p>
                    {workspaceNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    if (isMobile) {
                                        onClose?.();
                                    }
                                }}
                                className={`nav-item ${isActive ? "active" : ""}`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                <div className="space-y-1">
                    <p className="data-line px-3 mb-2">Your account</p>
                    {preferences.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    if (isMobile) {
                                        onClose?.();
                                    }
                                }}
                                className={`nav-item ${isActive ? "active" : ""}`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-border">
                <div className="mb-3 rounded-xl bg-bg-elevated px-3 py-2.5"><p className="data-line">Draft credits</p><p className="mt-1 font-mono text-lg font-bold tracking-tight text-text-primary">{credits}</p></div>
                <button
                    onClick={handleLogout}
                    className="nav-item w-full text-error hover:bg-error/10"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </>
    );

    return (
        <>
            <aside className="hidden h-full min-h-0 w-[17rem] shrink-0 flex-col border-r border-border bg-bg-surface/90 backdrop-blur-sm lg:flex">
                {renderNavigation(false)}
            </aside>

            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/50"
                        aria-label="Close navigation overlay"
                        onClick={onClose}
                    />

                    <aside role="dialog" aria-modal="true" aria-label="Navigation menu" className="relative w-72 max-w-[85vw] h-full bg-bg-surface border-r border-border flex flex-col shadow-2xl">
                        {renderNavigation(true)}
                    </aside>
                </div>
            )}
        </>
    );
}
