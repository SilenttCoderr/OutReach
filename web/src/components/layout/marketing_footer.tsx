import Link from "next/link";
import { Zap } from "lucide-react";

export function MarketingFooter() {
    return (
        <footer className="border-t border-border py-8 mt-16">
            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-text-primary">OutreachPro</span>
                </Link>
                <div className="flex items-center gap-6 text-sm text-text-secondary">
                    <Link href="/pricing" className="hover:text-text-primary transition-colors">Pricing</Link>
                    <Link href="/docs" className="hover:text-text-primary transition-colors">Docs</Link>
                    <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
                    <Link href="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
                </div>
                <p className="text-sm text-text-muted">© {new Date().getFullYear()} OutreachPro</p>
            </div>
        </footer>
    );
}
