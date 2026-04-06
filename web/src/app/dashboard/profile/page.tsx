"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchProfile, upsertProfile, type UserProfile, checkAuthStatus } from "@/services/api";
import { Save, Plus, X, UserCircle } from "lucide-react";
import { StatusBanner } from "@/components/ui/status-banner";

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

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
                const authData = await checkAuthStatus();
                if (!authData.authenticated) {
                    router.push("/login");
                    return;
                }
                const data = await fetchProfile();
                setProfile({
                    ...data,
                    // Ensure arrays have at least one empty string if empty
                    key_skills: data.key_skills?.length ? data.key_skills : [""],
                    highlights: data.highlights?.length ? data.highlights : [""]
                });
            } catch (err: unknown) {
                console.error("Failed to load profile:", err);
                setError(getErrorMessage(err, "Failed to load profile."));
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [router]);

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

    return (
        <div className="page-container animate-in">
            <div className="section-header">
                <h1 className="section-title">Your Profile</h1>
                <p className="section-description">
                    Configure your personal details used to tailor generated emails to your experience and voice.
                </p>
            </div>

            <div className="max-w-3xl">
                {error && (
                    <StatusBanner type="error" message={error} className="mb-6" />
                )}
                
                {success && (
                    <StatusBanner type="success" message="Profile saved successfully!" className="mb-6" />
                )}

                <div className="card">
                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        
                        {/* Basic Information */}
                        <div>
                            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <UserCircle className="w-5 h-5 text-accent" />
                                Basic Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-text-secondary">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={profile.full_name}
                                        onChange={e => setProfile({...profile, full_name: e.target.value})}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-text-secondary">Email Sign-off</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={profile.email_sign_off}
                                        onChange={e => setProfile({...profile, email_sign_off: e.target.value})}
                                        placeholder="e.g. Best regards,"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-text-secondary">Current Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={profile.current_title}
                                        onChange={e => setProfile({...profile, current_title: e.target.value})}
                                        placeholder="e.g. Software Engineer"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-text-secondary">Current Company</label>
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

                        <hr className="border-border" />

                        {/* Education */}
                        <div>
                            <h2 className="text-lg font-semibold text-text-primary mb-4">Education</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-text-secondary">Degree / Major</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={profile.degree}
                                        onChange={e => setProfile({...profile, degree: e.target.value})}
                                        placeholder="e.g. B.S. in Computer Science"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-text-secondary">University</label>
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

                        <hr className="border-border" />

                        {/* Experience & Summary */}
                        <div>
                            <h2 className="text-lg font-semibold text-text-primary mb-4">Experience Narrative</h2>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-text-secondary">Experience Summary</label>
                                    <p className="text-xs text-text-muted mb-2">A 1-2 sentence elevator pitch of your experience used in the emails.</p>
                                    <textarea
                                        required
                                        className="input-field min-h-[100px] resize-y leading-[1.7] tracking-wide"
                                        value={profile.experience_summary}
                                        onChange={e => setProfile({...profile, experience_summary: e.target.value})}
                                        placeholder="e.g. Over the past 3 years, I've developed scalable microservices in Go and optimized database performance, leading to a 30% reduction in latency."
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-text-secondary">Key Highlights</label>
                                    </div>
                                    <p className="text-xs text-text-muted">Specific impressive metrics, built systems, or achievements for the AI to dynamically adapt to the recruiter company profile.</p>
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
                                                className="p-2 text-text-muted hover:text-error transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        onClick={() => addArrayItem('highlights')}
                                        className="text-sm text-accent hover:underline flex items-center gap-1 mt-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add Highlight
                                    </button>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-text-secondary">Core Skills</label>
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
                                                className="p-2 text-text-muted hover:text-error transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        onClick={() => addArrayItem('key_skills')}
                                        className="text-sm text-accent hover:underline flex items-center gap-1 mt-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add Skill
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-4 flex items-center justify-end border-t border-border">
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
            </div>
        </div>
    );
}
