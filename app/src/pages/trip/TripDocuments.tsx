import { useState, useEffect, useRef, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { storage } from '../../lib/client';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { useToast } from '../../contexts/ToastContext';
import {
    getTripItems,
    addTripItem,
    deleteTripItem,
} from '../../services/tripService';
import {
    Plus,
    FileText,
    FileImage,
    Film,
    Archive,
    File,
    Trash2,
    Download,
    Loader2,
} from 'lucide-react';
import { Panel, Button, EmptyState } from '../../components/ui/Concourse';
import type { Trip, TripDocument } from '../../types';

const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage;
    if (mimeType.startsWith('video/')) return Film;
    if (mimeType.includes('pdf') || mimeType.includes('text')) return FileText;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return Archive;
    return File;
};

const formatDate = (timestamp: string): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function TripDocuments() {
    const { trip } = useOutletContext<{ trip: Trip }>();
    const { user } = useAuth();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [docs, setDocs] = useState<TripDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<TripDocument | null>(null);

    const userIds = useMemo(() => {
        const ids = new Set<string>();
        docs.forEach(d => { if (d.uploaded_by) ids.add(d.uploaded_by); });
        return Array.from(ids);
    }, [docs]);

    const { profiles } = useUserProfiles(userIds);

    useEffect(() => {
        if (!trip?.id) return;
        loadDocuments();
    }, [trip?.id]);

    const loadDocuments = async () => {
        try {
            const data = await getTripItems<TripDocument>('documents', trip.id);
            data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setDocs(data);
        } catch (error) {
            console.error('Error loading documents:', error);
            showToast('Failed to load documents', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        // Reset input so same file can be re-selected
        e.target.value = '';
        await handleUpload(file);
    };

    const handleUpload = async (file: File) => {
        if (!user) return;
        const storagePath = `trips/${trip.id}/documents/${Date.now()}_${file.name}`;

        setUploadProgress(0);

        try {
            // Upload to local file storage
            const { error: uploadError } = await storage
                .from('trip-documents')
                .upload(storagePath, file);

            if (uploadError) throw uploadError;

            setUploadProgress(50);

            // Get public URL
            const { data: urlData } = storage
                .from('trip-documents')
                .getPublicUrl(storagePath);

            const storageUrl = urlData.publicUrl;

            setUploadProgress(80);

            // Save metadata to DB
            const newDocId = await addTripItem('documents', {
                trip_id: trip.id,
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
                storage_url: storageUrl,
                storage_path: storagePath,
                uploaded_by: user.id,
            } as Record<string, unknown>);

            const optimisticDoc: TripDocument = {
                id: newDocId,
                trip_id: trip.id,
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
                storage_url: storageUrl,
                storage_path: storagePath,
                uploaded_by: user.id,
                created_at: new Date().toISOString(),
            };
            setDocs(prev => [optimisticDoc, ...prev]);
            showToast('File uploaded!', 'success');
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Upload failed', 'error');
        } finally {
            setUploadProgress(null);
        }
    };

    const handleDelete = async (doc: TripDocument) => {
        setDeletingId(doc.id);
        setConfirmDelete(null);
        try {
            // Try to delete from Storage (best-effort)
            try {
                await storage
                    .from('trip-documents')
                    .remove([doc.storage_path]);
            } catch {
                // Storage file might not exist
            }
            await deleteTripItem('documents', doc.id);
            setDocs(prev => prev.filter(d => d.id !== doc.id));
            showToast('Document deleted', 'success');
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Failed to delete document', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[var(--color-text-secondary)] mt-4">Loading documents...</p>
            </div>
        );
    }

    return (
        <div className="px-4 pb-24">
            <h2 className="cx-h2 text-[var(--color-text-primary)] mb-6">Documents</h2>

            {/* Upload progress bar */}
            {uploadProgress !== null && (
                <Panel className="mb-4 p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Loader2 size={16} className="text-brand-teal animate-spin" />
                        <span className="text-sm text-[var(--color-text-primary)]">Uploading... {uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-[var(--color-bg-primary)] rounded-full h-1.5">
                        <div
                            className="bg-brand-teal h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </Panel>
            )}

            {docs.length === 0 && uploadProgress === null ? (
                <EmptyState
                    icon={<FileText size={48} />}
                    title="No documents yet"
                    hint="Upload travel docs, confirmations, tickets, and anything else the group needs."
                />
            ) : (
                <div className="space-y-3">
                    {docs.map(doc => {
                        const IconComponent = getFileIcon(doc.type);
                        const uploader = profiles.get(doc.uploaded_by);
                        const isDeleting = deletingId === doc.id;

                        return (
                            <Panel key={doc.id} className="p-4 flex items-center gap-3">
                                {/* Icon */}
                                <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-primary)] flex items-center justify-center shrink-0">
                                    <IconComponent size={20} className="text-brand-teal" />
                                </div>

                                {/* Info */}
                                <a
                                    href={doc.storage_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 min-w-0 group"
                                    aria-label={`Open ${doc.name}`}
                                >
                                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-brand-teal transition-colors">
                                        {doc.name}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 tabular-nums">
                                        {formatSize(doc.size)}
                                        {uploader && ` · ${uploader.display_name}`}
                                        {doc.created_at && ` · ${formatDate(doc.created_at)}`}
                                    </p>
                                </a>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <a
                                        href={doc.storage_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-[var(--color-text-muted)] hover:text-brand-teal transition-colors"
                                        aria-label="Download"
                                    >
                                        <Download size={16} />
                                    </a>
                                    <button
                                        onClick={() => setConfirmDelete(doc)}
                                        disabled={isDeleting}
                                        className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-vermilion)] transition-colors disabled:opacity-50"
                                        aria-label="Delete"
                                    >
                                        {isDeleting ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>
                                </div>
                            </Panel>
                        );
                    })}
                </div>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelected}
                accept="*/*"
            />

            {/* FAB */}
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress !== null}
                className="cx-lit fixed bottom-24 right-6 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-[var(--color-carbon)] hover:brightness-110 transition-all disabled:opacity-50"
                aria-label="Upload document"
            >
                <Plus size={24} />
            </button>

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60"
                    onClick={() => setConfirmDelete(null)}
                >
                    <Panel
                        className="p-6 w-full max-w-md"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Delete Document?</h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                            "{confirmDelete.name}" will be permanently deleted.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1"
                                onClick={() => setConfirmDelete(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                size="lg"
                                className="flex-1"
                                onClick={() => handleDelete(confirmDelete)}
                            >
                                Delete
                            </Button>
                        </div>
                    </Panel>
                </div>
            )}
        </div>
    );
}
