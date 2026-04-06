"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    UserCircle
} from "lucide-react";
import { logout } from "@/services/api";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/contacts", label: "Contacts", icon: Users },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: Send },
    { href: "/dashboard/drafts", label: "Drafts", icon: Mail },
    { href: "/dashboard/templates", label: "Templates", icon: FileText },
    { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
    mobileOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();

    const handleLogout = () => {
        logout();
        onClose?.();
    };

    const renderNavigation = (isMobile: boolean) => (
        <>
            {/* Logo */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-text-primary">OutreachPro</span>
                </div>

                {isMobile && (
                    <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-bg-elevated transition-colors"
                        onClick={onClose}
                        aria-label="Close navigation menu"
                    >
                        <X className="w-5 h-5 text-text-secondary" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
                <div className="space-y-1">
                    <p className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Workspace</p>
                    {navItems.slice(0, 5).map((item) => {
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
                    <p className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Preferences</p>
                    {navItems.slice(5).map((item) => {
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
            <aside className="hidden lg:flex w-64 h-screen bg-bg-surface border-r border-border flex-col">
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

                    <aside className="relative w-72 max-w-[85vw] h-full bg-bg-surface border-r border-border flex flex-col shadow-2xl">
                        {renderNavigation(true)}
                    </aside>
                </div>
            )}
        </>
    );
}
