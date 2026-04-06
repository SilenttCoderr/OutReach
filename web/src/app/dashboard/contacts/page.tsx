"use client";

import { useState, useEffect } from "react";
import { Upload, Users, Search, Plus, X } from "lucide-react";
import { uploadCSV, fetchContacts, addManualContact, type Recruiter, type ManualContactPayload } from "@/services/api";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBanner } from "@/components/ui/status-banner";

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Recruiter[]>([]);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    
    // Manual Contact State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [addingManual, setAddingManual] = useState(false);
    const [manualForm, setManualForm] = useState<ManualContactPayload>({
        recruiter_name: "",
        recruiter_email: "",
        company: "",
        role: ""
    });

    useEffect(() => {
        void loadContacts();
    }, []);

    async function loadContacts() {
        try {
            const data = await fetchContacts();
            setContacts(data);
        } catch {
            setMessage({ type: "error", text: "Failed to load contacts. Please refresh and try again." });
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
            await loadContacts();
        } catch (error: unknown) {
            const messageText = error instanceof Error ? error.message : "Upload failed. Check file format.";
            setMessage({ type: 'error', text: messageText });
        } finally {
            setUploading(false);
        }
    };

    const handleAddManual = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingManual(true);
        setMessage(null);
        try {
            await addManualContact(manualForm);
            setMessage({ type: 'success', text: `Added contact: ${manualForm.recruiter_name}` });
            setIsModalOpen(false);
            setManualForm({ recruiter_name: "", recruiter_email: "", company: "", role: "" });
            await loadContacts();
        } catch (error: unknown) {
            const messageText = error instanceof Error ? error.message : "Failed to add contact.";
            setMessage({ type: 'error', text: messageText });
        } finally {
            setAddingManual(false);
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

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="btn-secondary"
                        disabled={uploading}
                    >
                        <Plus className="w-4 h-4" />
                        Add Manually
                    </button>
                    
                    <div className="relative">
                        <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
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
                            {uploading ? "Uploading..." : "Upload File"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <StatusBanner
                    type={message.type}
                    message={message.text}
                    className="mb-6"
                />
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
                                filteredContacts.map((contact) => (
                                    <tr key={contact.id || contact.recruiter_email} className="table-row">
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

            {/* Add Contact Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-bg-elevated border border-border rounded-xl w-full max-w-md shadow-2xl p-6 relative">
                        <IconButton
                            onClick={() => setIsModalOpen(false)}
                            className="absolute right-4 top-4"
                            label="Close add contact dialog"
                        >
                            <X className="w-5 h-5" />
                        </IconButton>
                        
                        <h2 className="text-xl font-bold text-text-primary mb-1">Add Contact</h2>
                        <p className="text-sm text-text-muted mb-6">Manually add a prospect to your list.</p>
                        
                        <form onSubmit={handleAddManual} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                                <input 
                                    className="input" 
                                    required
                                    value={manualForm.recruiter_name}
                                    onChange={e => setManualForm({...manualForm, recruiter_name: e.target.value})}
                                    placeholder="e.g. Sarah Connor"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                                <input 
                                    className="input" 
                                    type="email"
                                    required
                                    value={manualForm.recruiter_email}
                                    onChange={e => setManualForm({...manualForm, recruiter_email: e.target.value})}
                                    placeholder="sarah@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Company</label>
                                <input 
                                    className="input" 
                                    required
                                    value={manualForm.company}
                                    onChange={e => setManualForm({...manualForm, company: e.target.value})}
                                    placeholder="e.g. Google"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                                <input 
                                    className="input" 
                                    required
                                    value={manualForm.role}
                                    onChange={e => setManualForm({...manualForm, role: e.target.value})}
                                    placeholder="e.g. Senior Recruiter"
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={addingManual}
                                    className={`btn-primary ${addingManual ? 'opacity-70' : ''}`}
                                >
                                    {addingManual ? 'Adding...' : 'Add Contact'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
