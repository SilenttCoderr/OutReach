import { ReactNode } from "react";
import { Zap } from "lucide-react";

interface AuthCardProps {
    title: string;
    description: string;
    children: ReactNode;
}

export function AuthCard({ title, description, children }: AuthCardProps) {
    return (
        <div className="coach-panel relative overflow-hidden p-6 sm:p-8 space-y-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_50%_0%,rgba(212,93,69,.15),transparent_65%)]" />
            <div className="relative text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto shadow-[0_16px_28px_-18px_#a23e2e]">
                    <Zap className="w-7 h-7 text-white" />
                </div>
                <p className="coach-kicker justify-center before:hidden">Your outreach workspace</p>
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">{title}</h1>
                <p className="mx-auto max-w-sm text-text-secondary text-sm leading-6">{description}</p>
            </div>
            <div className="relative space-y-6">{children}</div>
        </div>
    );
}
