"use client";

import { useState, useEffect } from "react";
import { Upload, CheckCircle, AlertCircle, Users, Search } from "lucide-react";
import { uploadCSV, fetchContacts, type Recruiter } from "@/services/api";

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Recruiter[]>([]);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadContacts();
    }, []);

    async function loadContacts() {
        try {
            const data = await fetchContacts();
            setContacts(data);
        } catch (error) {
            console.error("Failed to load contacts", error);
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage(null);

        try {
            const res = await uploadCSV(file);
            setMessage({
                type: 'success',
                text: `Uploaded ${res.new_added} new contacts (${res.already_exists} duplicates skipped)`
            });
            loadContacts();
        } catch (error) {
            setMessage({ type: 'error', text: "Upload failed. Check file format." });
        } finally {
            setUploading(false);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.recruiter_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.recruiter_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="page-container animate-in">
            {/* Header */}
            <div className="section-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="section-title">Contacts</h1>
                    <p className="section-description">{contacts.length} prospects in your list</p>
                </div>

                <div className="relative">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                    />
                    <button className={`btn-primary ${uploading ? 'opacity-50' : ''}`}>
                        {uploading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        {uploading ? "Uploading..." : "Upload CSV"}
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-success/10 border border-success/30'
                        : 'bg-error/10 border border-error/30'
                    }`}>
                    {message.type === 'success'
                        ? <CheckCircle className="w-5 h-5 text-success" />
                        : <AlertCircle className="w-5 h-5 text-error" />
                    }
                    <span className={message.type === 'success' ? 'text-success' : 'text-error'}>
                        {message.text}
                    </span>
                </div>
            )}

            {/* Search */}
            <div className="mb-6 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10"
                />
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="table-header">
                            <tr>
                                <th className="px-6 py-3 text-left">Name</th>
                                <th className="px-6 py-3 text-left">Email</th>
                                <th className="px-6 py-3 text-left">Company</th>
                                <th className="px-6 py-3 text-left">Role</th>
                                <th className="px-6 py-3 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center">
                                                <Users className="w-6 h-6 text-text-muted" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-text-primary">No contacts found</p>
                                                <p className="text-sm text-text-muted">Upload a CSV to get started</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map((contact, i) => (
                                    <tr key={i} className="table-row">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                                                    {contact.recruiter_name?.split(' ').map(n => n[0]).join('') || '?'}
                                                </div>
                                                <span className="font-medium text-text-primary">{contact.recruiter_name || "-"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary">{contact.recruiter_email}</td>
                                        <td className="px-6 py-4 text-text-primary">{contact.company || "-"}</td>
                                        <td className="px-6 py-4 text-text-secondary">{contact.role || "-"}</td>
                                        <td className="px-6 py-4">
                                            <span className={
                                                contact.status === 'sent' ? 'badge badge-success' :
                                                    contact.status === 'drafted' ? 'badge badge-accent' :
                                                        'badge badge-default'
                                            }>
                                                {contact.status || 'new'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
