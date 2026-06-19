import { type LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: number | string;
    icon?: LucideIcon;
    className?: string;
}

export function StatCard({ label, value, icon: Icon, className = "" }: StatCardProps) {
    return (
        <div className={`card p-5 flex flex-col gap-2 ${className}`}>
            {Icon && <Icon className="w-5 h-5 text-accent" />}
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-sm text-text-secondary">{label}</p>
        </div>
    );
}
