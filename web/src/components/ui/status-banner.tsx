import * as React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type StatusType = "success" | "error" | "info";

interface StatusBannerProps {
    type: StatusType;
    message: string;
    title?: string;
    className?: string;
}

const styleMap: Record<StatusType, { wrapper: string; text: string; Icon: React.ElementType }> = {
    success: {
        wrapper: "bg-success/10 border-success/30",
        text: "text-success",
        Icon: CheckCircle2,
    },
    error: {
        wrapper: "bg-error/10 border-error/30",
        text: "text-error",
        Icon: AlertCircle,
    },
    info: {
        wrapper: "bg-accent/10 border-accent/30",
        text: "text-accent",
        Icon: Info,
    },
};

export function StatusBanner({ type, title, message, className }: StatusBannerProps) {
    const { wrapper, text, Icon } = styleMap[type];

    return (
        <div
            role={type === "error" ? "alert" : "status"}
            className={cn("rounded-lg border p-4 flex items-start gap-3", wrapper, className)}
        >
            <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", text)} />
            <div>
                {title && <p className={cn("font-medium mb-0.5", text)}>{title}</p>}
                <p className={cn("text-sm", text)}>{message}</p>
            </div>
        </div>
    );
}
