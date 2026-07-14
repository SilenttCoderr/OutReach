"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Users, Search, Plus, X, Pencil, Trash2 } from "lucide-react";
import { uploadCSV, fetchContacts, addManualContact, updateContact, deleteContact, type Contact } from "@/services/api";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBanner } from "@/components/ui/status-banner";

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    
    // Manual Contact State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [addingManual, setAddingManual] = useState(false);
    const [editingContactId, setEditingContactId] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const [manualForm, setManualForm] = useState<{ name: string; email: string; company: string; role: string }>({
        name: "",
        email: "",
        company: "",
        role: ""
    });

    useEffect(() => {
        void loadContacts();
    }, []);

    useEffect(() => {
        if (!isModalOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialogRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsModalOpen(false);
                resetManualForm();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [isModalOpen]);

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
                text: `Uploaded ${res.contacts_added} new contacts`
            });
            await loadContacts();
        } catch (error: unknown) {
            const messageText = error instanceof Error ? error.message : "Upload failed. Check file format.";
            setMessage({ type: 'error', text: messageText });
        } finally {
            setUploading(false);
        }
    };

    const resetManualForm = () => {
        setManualForm({ name: "", email: "", company: "", role: "" });
        setEditingContactId(null);
    };

    const openAddModal = () => {
        resetManualForm();
        setIsModalOpen(true);
    };

    const openEditModal = (contact: Contact) => {
        setManualForm({
            name: contact.name || "",
            email: contact.email || "",
            company: contact.company || "",
            role: contact.role || "",
        });
        setEditingContactId(String(contact.id || ""));
        setIsModalOpen(true);
    };

    const handleSaveContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingManual(true);
        setMessage(null);
        try {
            if (editingContactId) {
                await updateContact(editingContactId, manualForm.name, manualForm.email, manualForm.company, manualForm.role);
                setMessage({ type: 'success', text: `Updated contact: ${manualForm.name}` });
            } else {
                await addManualContact({
                    recruiter_name: manualForm.name,
                    recruiter_email: manualForm.email,
                    company: manualForm.company,
                    role: manualForm.role,
                });
                setMessage({ type: 'success', text: `Added contact: ${manualForm.name}` });
            }
            setIsModalOpen(false);
            resetManualForm();
            await loadContacts();
        } catch (error: unknown) {
            const messageText = error instanceof Error ? error.message : "Failed to save contact.";
            setMessage({ type: 'error', text: messageText });
        } finally {
            setAddingManual(false);
        }
    };

    const handleDeleteContact = async (contact: Contact) => {
        const id = contact.id ? String(contact.id) : "";
        if (!id) {
            setMessage({ type: "error", text: "Cannot delete contact: missing contact id." });
            return;
        }

        const confirmed = window.confirm(`Delete contact ${contact.name || contact.email}?`);
        if (!confirmed) {
            return;
        }

        try {
            setMessage(null);
            await deleteContact(id);
            setMessage({ type: "success", text: "Contact deleted." });
            await loadContacts();
        } catch (error: unknown) {
            const messageText = error instanceof Error ? error.message : "Failed to delete contact.";
            setMessage({ type: "error", text: messageText });
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="page-container animate-in">
            {/* Header */}
            <div className="section-header flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <p className="coach-kicker">People to reach</p>
                    <h1 className="section-title">Contacts</h1>
                    <p className="section-description">{contacts.length} people in your workspace. Keep the list focused enough to write with intent.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={openAddModal}
                        className="btn-secondary"
                        disabled={uploading}
                    >
                        <Plus className="w-4 h-4" />
                        Add Manually
                    </button>
                    
                    <label className={`btn-primary upload-action ${uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleFileUpload}
                            className="sr-only"
                            aria-label="Upload contacts CSV"
                            disabled={uploading}
                        />
                        {uploading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        {uploading ? "Uploading..." : "Upload CSV"}
                    </label>
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
            <div className="mb-6 max-w-xl">
                <label htmlFor="contact-search" className="data-line">Find someone in your list</label>
                <div className="search-field mt-2">
                <Search aria-hidden="true" />
                <input
                    id="contact-search"
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input"
                />
                </div>
            </div>

            {/* Table */}
            <div className="workspace-table">
                <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="data-line">Your contact list</p><p className="mt-1 text-sm text-text-secondary">Every contact here can become a draft when you are ready.</p></div>
                    <span className="badge badge-default">{filteredContacts.length} shown</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[58rem] table-fixed text-sm">
                        <thead className="table-header">
                            <tr>
                                <th className="px-6 py-3 text-left">Name</th>
                                <th className="px-6 py-3 text-left">Email</th>
                                <th className="px-6 py-3 text-left">Company</th>
                                <th className="px-6 py-3 text-left">Role</th>
                                <th className="px-6 py-3 text-left">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="workspace-empty-icon">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                            <div>
                                                <p className="font-semibold text-text-primary">{contacts.length ? "No matches found" : "Start with a small, focused list"}</p>
                                                <p className="mt-1 text-sm text-text-muted">{contacts.length ? "Try a different name, company, or email." : "Upload a CSV or add one person manually to begin."}</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <tr key={contact.id || contact.email} className="table-row">
                                        <td className="px-6 py-4">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                                                    {contact.name?.split(' ').map(n => n[0]).join('') || '?'}
                                                </div>
                                                <span className="break-words font-medium text-text-primary">{contact.name || "-"}</span>
                                            </div>
                                        </td>
                                        <td className="break-words px-6 py-4 text-text-secondary">{contact.email || "-"}</td>
                                        <td className="break-words px-6 py-4 text-text-primary">{contact.company || "-"}</td>
                                        <td className="break-words px-6 py-4 text-text-secondary">{contact.role || "-"}</td>
                                        <td className="px-6 py-4">
                                            <span className={
                                                contact.status === 'sent' ? 'badge badge-success' :
                                                    contact.status === 'drafted' ? 'badge badge-accent' :
                                                        'badge badge-default'
                                            }>
                                                {contact.status || 'new'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <IconButton
                                                    onClick={() => openEditModal(contact)}
                                                    label={`Edit ${contact.name || contact.email}`}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => void handleDeleteContact(contact)}
                                                    label={`Delete ${contact.name || contact.email}`}
                                                >
                                                    <Trash2 className="w-4 h-4 text-status-error" />
                                                </IconButton>
                                            </div>
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
                <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm">
                    <button type="button" aria-label="Close contact dialog" className="absolute inset-0 cursor-default" onClick={() => { setIsModalOpen(false); resetManualForm(); }} />
                    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title" className="modal-surface relative w-full max-w-md rounded-xl border border-border bg-bg-elevated p-6 shadow-2xl">
                        <IconButton
                            onClick={() => {
                                setIsModalOpen(false);
                                resetManualForm();
                            }}
                            className="absolute right-4 top-4"
                            label="Close add contact dialog"
                        >
                            <X className="w-5 h-5" />
                        </IconButton>
                        
                        <h2 id="contact-dialog-title" className="text-xl font-bold text-text-primary mb-1">{editingContactId ? "Edit Contact" : "Add Contact"}</h2>
                        <p className="text-sm text-text-muted mb-6">
                            {editingContactId ? "Update this prospect record." : "Manually add a prospect to your list."}
                        </p>
                        
                        <form onSubmit={handleSaveContact} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                                <input 
                                    className="input" 
                                    required
                                    value={manualForm.name}
                                    onChange={e => setManualForm({...manualForm, name: e.target.value})}
                                    placeholder="e.g. Sarah Connor"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                                <input 
                                    className="input" 
                                    type="email"
                                    required
                                    value={manualForm.email}
                                    onChange={e => setManualForm({...manualForm, email: e.target.value})}
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
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetManualForm();
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={addingManual}
                                    className={`btn-primary ${addingManual ? 'opacity-70' : ''}`}
                                >
                                    {addingManual ? (editingContactId ? 'Saving...' : 'Adding...') : (editingContactId ? 'Save Changes' : 'Add Contact')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
