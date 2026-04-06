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
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-text-primary">OutreachPro</span>
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
