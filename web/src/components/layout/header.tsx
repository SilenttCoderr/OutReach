"use client";

import { Search, Bell, User, Menu } from "lucide-react";

interface HeaderProps {
    onOpenMenu?: () => void;
}

export function Header({ onOpenMenu }: HeaderProps) {
    return (
        <header className="h-16 bg-bg-surface border-b border-border px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 md:gap-3 w-full">
                <button
                    type="button"
                    onClick={onOpenMenu}
                    className="lg:hidden p-2 rounded-lg hover:bg-bg-elevated transition-colors"
                    aria-label="Open navigation menu"
                >
                    <Menu className="w-5 h-5 text-text-secondary" />
                </button>

                <div className="relative hidden md:block w-56 lg:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="input pl-10 h-10 bg-bg-base"
                    />
                    <kbd className="hidden lg:inline-flex absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs bg-bg-elevated text-text-muted rounded border border-border">
                        Ctrl+K
                    </kbd>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-bg-elevated transition-colors" aria-label="Notifications">
                    <Bell className="w-5 h-5 text-text-secondary" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
                </button>

                {/* User */}
                <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-elevated transition-colors" aria-label="Profile">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-accent" />
                    </div>
                </button>
            </div>
        </header>
    );
}
