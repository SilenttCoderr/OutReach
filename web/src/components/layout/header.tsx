"use client";

import Link from "next/link";
import { Compass, Menu, User } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

interface HeaderProps {
    onOpenMenu?: () => void;
}

export function Header({ onOpenMenu }: HeaderProps) {
    return (
        <header className="h-16 bg-bg-surface border-b border-border px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 gap-3">
            <div className="flex items-center gap-2 md:gap-3 w-full">
                <IconButton
                    onClick={onOpenMenu}
                    className="lg:hidden"
                    label="Open navigation menu"
                >
                    <Menu className="w-5 h-5 text-text-secondary" />
                </IconButton>

                <div className="hidden items-center gap-2 text-sm text-text-secondary md:flex">
                    <Compass className="h-4 w-4 text-accent" />
                    <span>One thoughtful next step at a time.</span>
                </div>
            </div>

            <Link href="/dashboard/profile" className="rounded-full p-1 focus-ring" aria-label="Open profile">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-accent" />
                    </div>
            </Link>
        </header>
    );
}
