import * as React from "react";

import { cn } from "@/lib/utils";

interface SwitchFieldProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
    className?: string;
}

export function SwitchField({
    checked,
    onCheckedChange,
    label,
    disabled = false,
    className,
}: SwitchFieldProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "relative h-6 w-12 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface disabled:cursor-not-allowed disabled:opacity-60",
                checked ? "bg-accent" : "bg-bg-elevated",
                className,
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    checked ? "left-6" : "left-0.5",
                )}
            />
        </button>
    );
}
