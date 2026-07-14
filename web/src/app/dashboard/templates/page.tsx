import Link from "next/link";
import { ArrowRight, FilePenLine, Sparkles, UserRound } from "lucide-react";

export default function TemplatesPage() {
    return (
        <div className="page-container animate-in">
            <div className="max-w-3xl">
                <p className="coach-kicker">Your voice first</p>
                <h1 className="section-title mt-3">Templates</h1>
                <p className="section-description">OutreachPro uses the context in your profile to shape each draft. There is no separate template library to maintain yet.</p>

                <div className="coach-panel mt-8 p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="rounded-xl bg-accent/15 p-3 text-accent">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-text-primary">Personalization starts with the details you share.</h2>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">Keep your background, highlights, and target roles current. Campaigns use that information to create drafts you can review and edit before sending.</p>
                        </div>
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <Link href="/dashboard/profile" className="card p-4 group hover:-translate-y-0.5">
                            <UserRound className="h-5 w-5 text-accent" />
                            <h3 className="mt-3 font-semibold text-text-primary">Refine your profile</h3>
                            <p className="mt-1 text-sm text-text-secondary">Add the context that makes each note sound like you.</p>
                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">Open profile <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
                        </Link>
                        <Link href="/dashboard/campaigns" className="card p-4 group hover:-translate-y-0.5">
                            <FilePenLine className="h-5 w-5 text-accent" />
                            <h3 className="mt-3 font-semibold text-text-primary">Create draft messages</h3>
                            <p className="mt-1 text-sm text-text-secondary">Start a campaign, then review every draft in your workspace.</p>
                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">Open campaigns <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
