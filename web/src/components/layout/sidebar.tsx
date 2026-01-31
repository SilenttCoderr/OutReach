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
    Zap
} from "lucide-react";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/contacts", label: "Contacts", icon: Users },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: Send },
    { href: "/dashboard/drafts", label: "Drafts", icon: Mail },
    { href: "/dashboard/templates", label: "Templates", icon: FileText },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
    };

    return (
        <aside className="w-64 h-screen bg-bg-surface border-r border-border flex flex-col">
            {/* Logo */}
            <div className="h-16 px-5 flex items-center gap-3 border-b border-border">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-text-primary">OutreachPro</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    );
                })}
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
        </aside>
    );
}
