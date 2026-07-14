import { type LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: number | string;
    icon?: LucideIcon;
    accent?: boolean;
    variant?: "warning";
    className?: string;
}

export function StatCard({ label, value, icon: Icon, accent, variant, className = "" }: StatCardProps) {
    const iconColor = variant === "warning" ? "text-warning" : accent ? "text-accent" : "text-text-muted";
    const iconBg = variant === "warning" ? "bg-warning/10" : accent ? "bg-accent/20" : "bg-bg-elevated";

    return (
        <div className={`stat-card flex flex-col gap-3 ${className}`}>
            {Icon && (
                <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
            )}
            <p className="font-mono text-2xl font-bold tracking-tight text-text-primary tabular-nums">{value}</p>
            <p className="text-sm font-medium text-text-secondary">{label}</p>
        </div>
    );
}
