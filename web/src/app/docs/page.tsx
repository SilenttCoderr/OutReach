"use client";

import Link from "next/link";
import { useState } from "react";
import {
    Zap,
    Book,
    Rocket,
    FileSpreadsheet,
    Mail,
    CreditCard,
    HelpCircle,
    ChevronRight,
    ExternalLink,
    Copy,
    Check
} from "lucide-react";

const sections = [
    { id: "getting-started", label: "Getting Started", icon: Rocket },
    { id: "csv-format", label: "CSV Format", icon: FileSpreadsheet },
    { id: "generating-emails", label: "Generating Emails", icon: Mail },
    { id: "credits", label: "Credits & Billing", icon: CreditCard },
    { id: "troubleshooting", label: "Troubleshooting", icon: HelpCircle },
];

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState("getting-started");
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-bg-base">
            {/* Navbar */}
            <header className="fixed top-0 w-full z-50 border-b border-border bg-bg-base/95 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-text-primary">OutreachPro</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
                        <Link href="/#features" className="hover:text-text-primary transition-colors">Features</Link>
                        <Link href="/pricing" className="hover:text-text-primary transition-colors">Pricing</Link>
                        <Link href="/docs" className="text-text-primary">Docs</Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="btn-ghost text-sm">Login</Link>
                        <Link href="/signup" className="btn-primary text-sm">Get Started</Link>
                    </div>
                </div>
            </header>

            <div className="flex pt-16">
                {/* Sidebar */}
                <aside className="hidden lg:block w-64 shrink-0 border-r border-border h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto p-4">
                    <div className="flex items-center gap-2 mb-6 px-3">
                        <Book className="w-5 h-5 text-accent" />
                        <span className="font-semibold text-text-primary">Documentation</span>
                    </div>
                    <nav className="space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === section.id
                                        ? "bg-accent/10 text-accent"
                                        : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                                    }`}
                            >
                                <section.icon className="w-4 h-4" />
                                {section.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
                    {/* Mobile Navigation */}
                    <div className="lg:hidden mb-8">
                        <select
                            value={activeSection}
                            onChange={(e) => setActiveSection(e.target.value)}
                            className="input w-full"
                        >
                            {sections.map((section) => (
                                <option key={section.id} value={section.id}>
                                    {section.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Getting Started */}
                    {activeSection === "getting-started" && (
                        <div className="space-y-8 animate-in">
                            <div>
                                <h1 className="text-3xl font-bold text-text-primary mb-4">Getting Started</h1>
                                <p className="text-text-secondary text-lg">
                                    Get up and running with OutreachPro in under 5 minutes.
                                </p>
                            </div>

                            <div className="card p-6 space-y-4">
                                <h2 className="text-xl font-semibold text-text-primary">Step 1: Sign Up</h2>
                                <p className="text-text-secondary">
                                    Create an account using your Google account. You'll get 10 free credits to start.
                                </p>
                                <Link href="/signup" className="btn-primary inline-flex text-sm">
                                    Create Account <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="card p-6 space-y-4">
                                <h2 className="text-xl font-semibold text-text-primary">Step 2: Connect Gmail</h2>
                                <p className="text-text-secondary">
                                    Authorize OutreachPro to create drafts in your Gmail account. We use OAuth2
                                    for secure access - we never see your password.
                                </p>
                                <div className="flex items-start gap-3 p-4 bg-accent/10 rounded-lg border border-accent/20">
                                    <Zap className="w-5 h-5 text-accent mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-text-primary">Secure by Design</p>
                                        <p className="text-text-secondary">
                                            We only request permission to create drafts. We cannot read or send your emails directly.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="card p-6 space-y-4">
                                <h2 className="text-xl font-semibold text-text-primary">Step 3: Import Contacts</h2>
                                <p className="text-text-secondary">
                                    Upload a CSV file with your prospect list. See the CSV Format section for details.
                                </p>
                            </div>

                            <div className="card p-6 space-y-4">
                                <h2 className="text-xl font-semibold text-text-primary">Step 4: Generate Emails</h2>
                                <p className="text-text-secondary">
                                    Go to Campaigns, upload your resume or context, and click Generate. Our AI will
                                    create personalized emails for each contact.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* CSV Format */}
                    {activeSection === "csv-format" && (
                        <div className="space-y-8 animate-in">
                            <div>
                                <h1 className="text-3xl font-bold text-text-primary mb-4">CSV Format</h1>
                                <p className="text-text-secondary text-lg">
                                    How to format your contact list for import.
                                </p>
                            </div>

                            <div className="card p-6 space-y-4">
                                <h2 className="text-xl font-semibold text-text-primary">Required Columns</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="table-header">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Column Name</th>
                                                <th className="px-4 py-2 text-left">Required</th>
                                                <th className="px-4 py-2 text-left">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="table-row">
                                                <td className="px-4 py-3 font-mono text-accent">recruiter_email</td>
                                                <td className="px-4 py-3"><span className="badge badge-error">Required</span></td>
                                                <td className="px-4 py-3 text-text-secondary">Recipient's email address</td>
                                            </tr>
                                            <tr className="table-row">
                                                <td className="px-4 py-3 font-mono text-accent">recruiter_name</td>
                                                <td className="px-4 py-3"><span className="badge badge-default">Optional</span></td>
                                                <td className="px-4 py-3 text-text-secondary">Recipient's full name</td>
                                            </tr>
                                            <tr className="table-row">
                                                <td className="px-4 py-3 font-mono text-accent">company</td>
                                                <td className="px-4 py-3"><span className="badge badge-default">Optional</span></td>
                                                <td className="px-4 py-3 text-text-secondary">Company name</td>
                                            </tr>
                                            <tr className="table-row">
                                                <td className="px-4 py-3 font-mono text-accent">role</td>
                                                <td className="px-4 py-3"><span className="badge badge-default">Optional</span></td>
                                                <td className="px-4 py-3 text-text-secondary">Job title or role</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="card p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-text-primary">Example CSV</h2>
                                    <button
                                        onClick={() => copyToClipboard(`recruiter_email,recruiter_name,company,role
john@techcorp.com,John Smith,TechCorp,Engineering Manager
jane@startup.io,Jane Doe,Startup Inc,CTO`)}
                                        className="btn-ghost text-sm"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                                <pre className="bg-bg-elevated p-4 rounded-lg overflow-x-auto text-sm font-mono text-text-secondary">
                                    {`recruiter_email,recruiter_name,company,role
john@techcorp.com,John Smith,TechCorp,Engineering Manager
jane@startup.io,Jane Doe,Startup Inc,CTO`}
                                </pre>
                            </div>

                            <div className="card p-6 space-y-4 border-warning/30 bg-warning/5">
                                <h2 className="text-lg font-semibold text-warning">Important Notes</h2>
                                <ul className="space-y-2 text-sm text-text-secondary">
                                    <li>• Column names are case-sensitive</li>
                                    <li>• Duplicate emails are automatically skipped</li>
                                    <li>• Maximum 1000 contacts per upload</li>
                                    <li>• UTF-8 encoding required for special characters</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Generating Emails */}
                    {activeSection === "generating-emails" && (
                        <div className="space-y-8 animate-in">
                            <div>
                                <h1 className="text-3xl font-bold text-text-primary mb-4">Generating Emails</h1>
                                <p className="text-text-secondary text-lg">
                                    How our AI creates personalized emails for each contact.
                                </p>
                            </div>

                            <div className="card p-6 space-y-4">
                                <h2 className="text-xl font-semibold text-text-primary">How It Works</h2>
                                <ol className="space-y-4">
                                    <li className="flex gap-4">
                                        <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 font-semibold">1</span>
                                        <div>
                                            <p className="font-medium text-text-primary">Context Analysis</p>
                                            <p className="text-sm text-text-secondary">AI reads your resume/context and the contact's info</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 font-semibold">2</span>
                                        <div>
                                            <p className="font-medium text-text-primary">Personalization</p>
                                            <p className="text-sm text-text-secondary">Generates unique subject line and body for each recipient</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 font-semibold">3</span>
                                        <div>
                                            <p className="font-medium text-text-primary">Draft Creation</p>
                                            <p className="text-sm text-text-secondary">Email is saved as a draft in your Gmail</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 font-semibold">4</span>
                                        <div>
                                            <p className="font-medium text-text-primary">Review & Send</p>
                                            <p className="text-sm text-text-secondary">Review drafts and send individually or in bulk</p>
                                        </div>
                                    </li>
                                </ol>
                            </div>

                            <div className="card p-6 space-y-4">
                                <h2 className="text-xl font-semibold text-text-primary">AI Personalization</h2>
                                <p className="text-text-secondary">
                                    When enabled, our AI (powered by Gemini 2.5 Flash) analyzes:
                                </p>
                                <ul className="space-y-2 text-sm text-text-secondary">
                                    <li>• Your resume and professional background</li>
                                    <li>• The recipient's company and role</li>
                                    <li>• Industry-specific context</li>
                                    <li>• Best practices for cold outreach</li>
                                </ul>
                            </div>

                            <div className="card p-6 space-y-4">
                                <h2 className="text-xl font-semibold text-text-primary">Tips for Better Results</h2>
                                <ul className="space-y-2 text-text-secondary">
                                    <li>✓ Include a detailed resume with specific achievements</li>
                                    <li>✓ Provide company name and role for each contact</li>
                                    <li>✓ Review and personalize drafts before sending</li>
                                    <li>✓ Start with a small batch to test quality</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Credits */}
                    {activeSection === "credits" && (
                        <div className="space-y-8 animate-in">
                            <div>
                                <h1 className="text-3xl font-bold text-text-primary mb-4">Credits & Billing</h1>
                                <p className="text-text-secondary text-lg">
                                    Understanding how credits work and managing payments.
                                </p>
                            </div>

                            <div className="card p-6 space-y-4">
                                <h2 className="text-xl font-semibold text-text-primary">How Credits Work</h2>
                                <div className="flex items-center gap-4 p-4 bg-bg-elevated rounded-lg">
                                    <div className="text-4xl font-bold text-accent">1</div>
                                    <div>
                                        <p className="font-medium text-text-primary">Credit = 1 AI Email</p>
                                        <p className="text-sm text-text-secondary">Each personalized email generation uses 1 credit</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card p-6 space-y-4">
                                <h2 className="text-xl font-semibold text-text-primary">Credit Packs</h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="p-4 border border-border rounded-lg">
                                        <p className="font-semibold text-text-primary">Starter - $3</p>
                                        <p className="text-sm text-text-secondary">25 credits ($0.12/email)</p>
                                    </div>
                                    <div className="p-4 border border-border rounded-lg">
                                        <p className="font-semibold text-text-primary">Basic - $9</p>
                                        <p className="text-sm text-text-secondary">100 credits ($0.09/email)</p>
                                    </div>
                                    <div className="p-4 border border-accent rounded-lg bg-accent/5">
                                        <p className="font-semibold text-accent">Pro - $19 ⭐</p>
                                        <p className="text-sm text-text-secondary">300 credits ($0.063/email)</p>
                                    </div>
                                    <div className="p-4 border border-border rounded-lg">
                                        <p className="font-semibold text-text-primary">Business - $49</p>
                                        <p className="text-sm text-text-secondary">1000 credits ($0.049/email)</p>
                                    </div>
                                </div>
                                <Link href="/pricing" className="btn-secondary inline-flex text-sm">
                                    View Pricing <ExternalLink className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="card p-6 space-y-4">
                                <h2 className="text-xl font-semibold text-text-primary">Key Points</h2>
                                <ul className="space-y-2 text-text-secondary">
                                    <li>✓ Credits never expire</li>
                                    <li>✓ Buy additional packs anytime (they stack)</li>
                                    <li>✓ New accounts get 10 free credits</li>
                                    <li>✓ Payments via Stripe (all major cards accepted)</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Troubleshooting */}
                    {activeSection === "troubleshooting" && (
                        <div className="space-y-8 animate-in">
                            <div>
                                <h1 className="text-3xl font-bold text-text-primary mb-4">Troubleshooting</h1>
                                <p className="text-text-secondary text-lg">
                                    Common issues and how to fix them.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <TroubleshootingItem
                                    title="Gmail authentication expired"
                                    description="If you see 'Gmail token expired', you need to re-authenticate:"
                                    steps={[
                                        "Go to Settings",
                                        "Click 'Reconnect Gmail'",
                                        "Authorize the app again",
                                    ]}
                                />

                                <TroubleshootingItem
                                    title="Drafts not appearing in Gmail"
                                    description="If generated drafts don't show up in your Gmail:"
                                    steps={[
                                        "Check your Gmail Drafts folder (not inbox)",
                                        "Wait a few seconds and refresh Gmail",
                                        "Ensure you authorized the correct Gmail account",
                                    ]}
                                />

                                <TroubleshootingItem
                                    title="CSV upload fails"
                                    description="If your CSV won't upload:"
                                    steps={[
                                        "Ensure the file is valid CSV format",
                                        "Check that 'recruiter_email' column exists",
                                        "Make sure file is under 10MB",
                                        "Use UTF-8 encoding for special characters",
                                    ]}
                                />

                                <TroubleshootingItem
                                    title="Email generation errors"
                                    description="If emails fail to generate:"
                                    steps={[
                                        "Check you have sufficient credits",
                                        "Ensure Gmail is connected",
                                        "Try with fewer contacts (start with 10)",
                                        "Contact support if issues persist",
                                    ]}
                                />
                            </div>

                            <div className="card p-6 border-accent/30 bg-accent/5">
                                <h2 className="text-lg font-semibold text-text-primary mb-2">Still need help?</h2>
                                <p className="text-text-secondary mb-4">
                                    Contact us at support@outreachpro.com for assistance.
                                </p>
                                <a href="mailto:support@outreachpro.com" className="btn-primary inline-flex text-sm">
                                    Contact Support <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

function TroubleshootingItem({
    title,
    description,
    steps
}: {
    title: string;
    description: string;
    steps: string[];
}) {
    return (
        <div className="card p-6">
            <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
            <p className="text-sm text-text-secondary mb-4">{description}</p>
            <ol className="space-y-2">
                {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-bg-elevated text-text-muted flex items-center justify-center shrink-0 text-xs">
                            {i + 1}
                        </span>
                        <span className="text-text-secondary">{step}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
}
