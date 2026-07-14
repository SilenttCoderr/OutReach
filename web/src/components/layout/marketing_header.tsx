import Link from "next/link";
import { Zap } from "lucide-react";

type ActivePath = "/" | "/pricing" | "/docs" | "/privacy" | "/terms" | "";

interface MarketingHeaderProps {
    activePath?: ActivePath;
    showFeaturesLink?: boolean;
}

function linkClass(isActive: boolean): string {
    return isActive
        ? "text-text-primary"
        : "hover:text-text-primary transition-colors";
}

export function MarketingHeader({ activePath = "", showFeaturesLink = true }: MarketingHeaderProps) {
    const featuresHref = activePath === "/" ? "#features" : "/#features";

    return (
        <header className="fixed top-0 w-full z-50 border-b border-border bg-bg-base/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-[0_12px_24px_-16px_#a23e2e]">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div><span className="block font-bold text-lg tracking-tight text-text-primary">OutreachPro</span><span className="hidden text-[10px] text-text-muted sm:block">Career outreach, considered</span></div>
                </Link>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
                    {showFeaturesLink && (
                        <Link href={featuresHref} className={linkClass(false)}>
                            Features
                        </Link>
                    )}
                    <Link href="/pricing" className={linkClass(activePath === "/pricing")}>
                        Pricing
                    </Link>
                    <Link href="/docs" className={linkClass(activePath === "/docs")}>
                        Docs
                    </Link>
                </nav>

                <div className="flex items-center gap-3">
                    <Link href="/login" className="btn-ghost text-sm">Login</Link>
                    <Link href="/signup" className="btn-primary text-sm">Get Started</Link>
                </div>
            </div>
        </header>
    );
}
