import * as React from "react";

import { cn } from "@/lib/utils";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ className, label, type = "button", children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                type={type}
                aria-label={label}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface disabled:pointer-events-none disabled:opacity-50",
                    className,
                )}
                {...props}
            >
                {children}
            </button>
        );
    },
);

IconButton.displayName = "IconButton";
