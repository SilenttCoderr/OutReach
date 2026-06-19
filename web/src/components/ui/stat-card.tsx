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
        <div className={`card p-5 flex flex-col gap-2 ${className}`}>
            {Icon && (
                <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
            )}
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-sm text-text-secondary">{label}</p>
        </div>
    );
}
