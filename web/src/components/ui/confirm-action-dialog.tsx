"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";

interface ConfirmActionDialogProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onCancel: () => void;
    onConfirm: () => Promise<void> | void;
}

export function ConfirmActionDialog({
    open,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onCancel,
    onConfirm,
}: ConfirmActionDialogProps) {
    const [confirming, setConfirming] = React.useState(false);
    const dialogRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!open) {
            setConfirming(false);
            return;
        }

        dialogRef.current?.focus();
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !confirming) {
                onCancel();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, confirming, onCancel]);

    if (!open) {
        return null;
    }

    const handleConfirm = async () => {
        setConfirming(true);
        try {
            await onConfirm();
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/60"
                aria-label="Close confirmation dialog"
                onClick={onCancel}
            />

            <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="confirmation-dialog-title" aria-describedby="confirmation-dialog-description" tabIndex={-1} className="relative w-full max-w-md card p-6">
                <IconButton
                    className="absolute right-4 top-4"
                    label="Close confirmation dialog"
                    onClick={onCancel}
                >
                    <span aria-hidden="true" className="text-lg leading-none">x</span>
                </IconButton>

                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-warning/15">
                        <AlertTriangle className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                        <h2 id="confirmation-dialog-title" className="text-lg font-semibold text-text-primary">{title}</h2>
                        <p id="confirmation-dialog-description" className="text-sm text-text-secondary mt-1">{description}</p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                    <button type="button" className="btn-secondary" onClick={onCancel} disabled={confirming}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className="btn-ghost text-error border-error/30 hover:bg-error/10"
                        onClick={handleConfirm}
                        disabled={confirming}
                    >
                        {confirming ? "Confirming..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
