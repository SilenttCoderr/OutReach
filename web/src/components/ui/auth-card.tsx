import { ReactNode } from "react";
import { Zap } from "lucide-react";

interface AuthCardProps {
    title: string;
    description: string;
    children: ReactNode;
}

export function AuthCard({ title, description, children }: AuthCardProps) {
    return (
        <div className="card p-8 space-y-8">
            <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto">
                    <Zap className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
                <p className="text-text-secondary text-sm">{description}</p>
            </div>
            {children}
        </div>
    );
}
