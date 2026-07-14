"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchProfile, upsertProfile, type UserProfile } from "@/services/api";
import { ArrowRight, BriefcaseBusiness, GraduationCap, MessageSquareText, Save, Plus, Sparkles, UserCircle, X } from "lucide-react";
import { StatusBanner } from "@/components/ui/status-banner";

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function hasSubmittedProfile(profile: UserProfile): boolean {
    return Boolean(
        profile.full_name.trim() ||
        profile.current_title.trim() ||
        profile.experience_summary.trim() ||
        profile.key_skills.some((skill) => skill.trim()) ||
        profile.highlights.some((highlight) => highlight.trim()),
    );
}

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [viewMode, setViewMode] = useState(false);

    const [profile, setProfile] = useState<UserProfile>({
        full_name: "",
        current_title: "",
        current_company: "",
        degree: "",
        university: "",
        experience_summary: "",
        key_skills: [""],
        highlights: [""],
        preferred_roles: [],
        email_sign_off: "Best regards,"
    });

    useEffect(() => {
        async function loadProfile() {
            try {
                const data = await fetchProfile();
                const normalizedProfile: UserProfile = {
                    ...data,
                    // Ensure arrays have at least one empty string if empty
                    key_skills: data.key_skills?.length ? data.key_skills : [""],
                    highlights: data.highlights?.length ? data.highlights : [""]
                };
                setProfile(normalizedProfile);
                setViewMode(hasSubmittedProfile(normalizedProfile));
            } catch (err: unknown) {
                console.error("Failed to load profile:", err);
                setError(getErrorMessage(err, "Failed to load profile."));
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess(false);

        try {
            // Clean up arrays: remove empty strings
            const cleanedProfile = {
                ...profile,
                key_skills: profile.key_skills.filter(s => s.trim() !== ""),
                highlights: profile.highlights.filter(h => h.trim() !== "")
            };
            
            await upsertProfile(cleanedProfile);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            
            // Re-pad arrays if they're empty now
            setProfile({
                ...cleanedProfile,
                key_skills: cleanedProfile.key_skills.length ? cleanedProfile.key_skills : [""],
                highlights: cleanedProfile.highlights.length ? cleanedProfile.highlights : [""]
            });
            setViewMode(true);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Failed to save profile."));
        } finally {
            setSaving(false);
        }
    };

    const handleArrayChange = (field: 'key_skills' | 'highlights', index: number, value: string) => {
        const newArray = [...profile[field]];
        newArray[index] = value;
        setProfile({ ...profile, [field]: newArray });
    };

    const addArrayItem = (field: 'key_skills' | 'highlights') => {
        setProfile({ ...profile, [field]: [...profile[field], ""] });
    };

    const removeArrayItem = (field: 'key_skills' | 'highlights', index: number) => {
        const newArray = profile[field].filter((_, i) => i !== index);
        if (newArray.length === 0) newArray.push("");
        setProfile({ ...profile, [field]: newArray });
    };

    if (loading) {
        return (
            <div className="page-container animate-in">
                <div className="section-header">
                    <div className="h-8 w-48 bg-bg-elevated rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-96 bg-bg-elevated rounded animate-pulse"></div>
                </div>
                <div className="max-w-3xl">
                    <div className="card p-6 space-y-8 animate-pulse">
                        <div className="space-y-4">
                            <div className="h-6 w-32 bg-bg-elevated rounded mb-4"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="h-10 w-full bg-bg-elevated rounded"></div>
                                <div className="h-10 w-full bg-bg-elevated rounded"></div>
                                <div className="h-10 w-full bg-bg-elevated rounded"></div>
                                <div className="h-10 w-full bg-bg-elevated rounded"></div>
                            </div>
                        </div>
                        <hr className="border-border" />
                        <div className="space-y-4">
                            <div className="h-6 w-32 bg-bg-elevated rounded mb-4"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="h-10 w-full bg-bg-elevated rounded"></div>
                                <div className="h-10 w-full bg-bg-elevated rounded"></div>
                            </div>
                        </div>
                        <hr className="border-border" />
                        <div className="space-y-4">
                            <div className="h-6 w-48 bg-bg-elevated rounded mb-4"></div>
                            <div className="h-24 w-full bg-bg-elevated rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const hasSavedData = hasSubmittedProfile(profile);

    return (
        <div className="page-container animate-in">
            <div className="section-header flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                <p className="coach-kicker">Your foundation</p>
                <h1 className="section-title mt-3">Make every draft sound more like you.</h1>
                <p className="section-description">
                    Configure your personal details used to tailor generated emails to your experience and voice.
                </p>
                </div>
                {viewMode && hasSavedData && <button type="button" onClick={() => setViewMode(false)} className="btn-secondary text-sm">Refine profile</button>}
            </div>

            <div className="workspace-layout with-rail">
                <div className="min-w-0">
                {error && (
                    <StatusBanner type="error" message={error} className="mb-6" />
                )}
                
                {success && (
                    <StatusBanner type="success" message="Profile saved successfully!" className="mb-6" />
                )}

                {viewMode && hasSavedData && (
                    <div className="coach-panel p-5 sm:p-7 space-y-6 mb-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-text-primary">{profile.full_name || "Profile"}</h2>
                                <p className="text-text-secondary mt-1">
                                    {[profile.current_title, profile.current_company].filter(Boolean).join(" at ") || "No title/company added yet"}
                                </p>
                            </div>
                            <span className="badge badge-success">Ready for drafts</span>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-text-primary mb-2">Education</h3>
                            <p className="text-sm text-text-secondary">
                                {[profile.degree, profile.university].filter(Boolean).join(" - ") || "No education details added yet"}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-text-primary mb-2">Experience Summary</h3>
                            <p className="text-sm text-text-secondary whitespace-pre-wrap">
                                {profile.experience_summary || "No summary added yet"}
                            </p>
                        </div>

                        <div className="grid gap-6 border-t border-border pt-6 md:grid-cols-2">
                            <div>
                                <h3 className="text-sm font-semibold text-text-primary mb-2">Core Skills</h3>
                                <ul className="flex flex-wrap gap-2">
                                    {profile.key_skills.filter((skill) => skill.trim()).length ? (
                                        profile.key_skills
                                            .filter((skill) => skill.trim())
                                            .map((skill) => (
                                                <li key={skill} className="badge badge-default">
                                                    {skill}
                                                </li>
                                            ))
                                    ) : (
                                        <li className="text-sm text-text-muted">No skills added yet</li>
                                    )}
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-text-primary mb-2">Highlights</h3>
                                <ul className="space-y-1 text-sm text-text-secondary">
                                    {profile.highlights.filter((highlight) => highlight.trim()).length ? (
                                        profile.highlights
                                            .filter((highlight) => highlight.trim())
                                            .map((highlight) => (
                                                <li key={highlight}>- {highlight}</li>
                                            ))
                                    ) : (
                                        <li className="text-text-muted">No highlights added yet</li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="text-sm text-text-secondary">
                            Sign-off: <span className="text-text-primary">{profile.email_sign_off || "Best regards,"}</span>
                        </div>
                    </div>
                )}

                {(!viewMode || !hasSavedData) && (
                    <div className="coach-panel">
                        <form onSubmit={handleSubmit} className="p-5 space-y-8 sm:p-7">
                        
                        {/* Basic Information */}
                        <div className="workspace-section">
                            <h2 className="workspace-section-title flex items-center gap-2"><UserCircle className="w-5 h-5 text-accent" /> The details people should recognize</h2>
                            <p className="workspace-section-copy mb-5">These details set the voice and signature used throughout your outreach.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="field-stack">
                                    <label className="field-label">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={profile.full_name}
                                        onChange={e => setProfile({...profile, full_name: e.target.value})}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="field-stack">
                                    <label className="field-label">Email Sign-off</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={profile.email_sign_off}
                                        onChange={e => setProfile({...profile, email_sign_off: e.target.value})}
                                        placeholder="e.g. Best regards,"
                                    />
                                </div>
                                <div className="field-stack">
                                    <label className="field-label">Current Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={profile.current_title}
                                        onChange={e => setProfile({...profile, current_title: e.target.value})}
                                        placeholder="e.g. Software Engineer"
                                    />
                                </div>
                                <div className="field-stack">
                                    <label className="field-label">Current Company</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={profile.current_company}
                                        onChange={e => setProfile({...profile, current_company: e.target.value})}
                                        placeholder="e.g. TechCorp (optional)"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="surface-divider" />

                        {/* Education */}
                        <div className="workspace-section">
                            <h2 className="workspace-section-title flex items-center gap-2"><GraduationCap className="w-5 h-5 text-accent" /> Education that adds context</h2>
                            <p className="workspace-section-copy mb-5">Include the background that is relevant to the people you want to reach.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="field-stack">
                                    <label className="field-label">Degree / Major</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={profile.degree}
                                        onChange={e => setProfile({...profile, degree: e.target.value})}
                                        placeholder="e.g. B.S. in Computer Science"
                                    />
                                </div>
                                <div className="field-stack">
                                    <label className="field-label">University</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={profile.university}
                                        onChange={e => setProfile({...profile, university: e.target.value})}
                                        placeholder="e.g. Stanford University"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="surface-divider" />

                        {/* Experience & Summary */}
                        <div className="workspace-section">
                            <h2 className="workspace-section-title flex items-center gap-2"><BriefcaseBusiness className="w-5 h-5 text-accent" /> The story behind your work</h2>
                            <p className="workspace-section-copy mb-5">Give the draft generator the real details it needs to make an informed introduction.</p>
                            <div className="space-y-4">
                                <div className="field-stack">
                                    <label className="field-label">Experience Summary</label>
                                    <p className="field-help">A one- or two-sentence introduction that appears in your outreach.</p>
                                    <textarea
                                        required
                                        className="input-field min-h-28 resize-y leading-relaxed"
                                        value={profile.experience_summary}
                                        onChange={e => setProfile({...profile, experience_summary: e.target.value})}
                                        placeholder="e.g. Over the past 3 years, I've developed scalable microservices in Go and optimized database performance, leading to a 30% reduction in latency."
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="field-label">Key Highlights</label>
                                    </div>
                                    <p className="field-help">Add specific outcomes, projects, or milestones that make your experience memorable.</p>
                                    {profile.highlights.map((highlight, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                className="input-field flex-1"
                                                value={highlight}
                                                onChange={e => handleArrayChange('highlights', index, e.target.value)}
                                                placeholder="e.g. Led migration to Next.js reducing load time by 40%"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => removeArrayItem('highlights', index)}
                                                className="rounded-lg p-2 text-text-muted hover:bg-error/10 hover:text-error transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        onClick={() => addArrayItem('highlights')}
                                        className="action-link mt-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add Highlight
                                    </button>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between">
                                        <label className="field-label">Core Skills</label>
                                    </div>
                                    {profile.key_skills.map((skill, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                className="input-field flex-1"
                                                value={skill}
                                                onChange={e => handleArrayChange('key_skills', index, e.target.value)}
                                                placeholder="e.g. Python, React, PostgreSQL"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => removeArrayItem('key_skills', index)}
                                                className="rounded-lg p-2 text-text-muted hover:bg-error/10 hover:text-error transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        onClick={() => addArrayItem('key_skills')}
                                        className="action-link mt-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add Skill
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-5 flex items-center justify-end gap-3 border-t border-border">
                            {hasSavedData && (
                                <button
                                    type="button"
                                    onClick={() => setViewMode(true)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" /> Save Profile
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                    </div>
                )}
                </div>
                <aside className="workspace-rail">
                    <p className="data-line">Why this matters</p>
                    <div className="mt-4 space-y-5 text-sm">
                        <div><Sparkles className="h-5 w-5 text-accent" /><p className="mt-3 font-semibold text-text-primary">Better context, better first drafts</p><p className="mt-1 leading-6 text-text-secondary">Your profile is used to give every draft a clear point of view.</p></div>
                        <div className="border-t border-border pt-4"><MessageSquareText className="h-5 w-5 text-accent" /><p className="mt-3 font-semibold text-text-primary">You still have the final word</p><p className="mt-1 leading-6 text-text-secondary">Every generated message stays editable in Drafts before it is sent.</p><Link href="/dashboard/drafts" className="action-link mt-2">Open review desk <ArrowRight className="h-4 w-4" /></Link></div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
