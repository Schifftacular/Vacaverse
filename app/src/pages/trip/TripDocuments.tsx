import { useState, useEffect, useRef, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { useToast } from '../../contexts/ToastContext';
import {
    getSubCollection,
    addSubCollectionItem,
    deleteSubCollectionItem,
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

const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
        docs.forEach(d => { if (d.uploadedBy) ids.add(d.uploadedBy); });
        return Array.from(ids);
    }, [docs]);

    const { profiles } = useUserProfiles(userIds);

    useEffect(() => {
        if (!trip?.id) return;
        loadDocuments();
    }, [trip?.id]);

    const loadDocuments = async () => {
        try {
            const data = await getSubCollection<TripDocument>(trip.id, 'documents');
            data.sort((a, b) => {
                const aTime = a.createdAt?.seconds ?? 0;
                const bTime = b.createdAt?.seconds ?? 0;
                return bTime - aTime;
            });
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
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        setUploadProgress(0);

        await new Promise<void>((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setUploadProgress(pct);
                },
                (error) => {
                    console.error('Upload error:', error);
                    showToast('Upload failed', 'error');
                    setUploadProgress(null);
                    reject(error);
                },
                async () => {
                    try {
                        const url = await getDownloadURL(uploadTask.snapshot.ref);
                        const newDocId = await addSubCollectionItem(trip.id, 'documents', {
                            name: file.name,
                            size: file.size,
                            type: file.type || 'application/octet-stream',
                            storageUrl: url,
                            uploadedBy: user.uid,
                        } as unknown as Record<string, unknown>);
                        const optimisticDoc: TripDocument = {
                            id: newDocId,
                            name: file.name,
                            size: file.size,
                            type: file.type || 'application/octet-stream',
                            storageUrl: url,
                            uploadedBy: user.uid,
                            createdAt: null,
                        };
                        setDocs(prev => [optimisticDoc, ...prev]);
                        showToast('File uploaded!', 'success');
                        setUploadProgress(null);
                        resolve();
                    } catch (err) {
                        showToast('Failed to save document metadata', 'error');
                        setUploadProgress(null);
                        reject(err);
                    }
                }
            );
        });
    };

    const handleDelete = async (doc: TripDocument) => {
        setDeletingId(doc.id);
        setConfirmDelete(null);
        try {
            // Try to delete from Storage (best-effort — file might have different path)
            try {
                const storageRef = ref(storage, `trips/${trip.id}/documents/${doc.name}`);
                await deleteObject(storageRef);
            } catch {
                // Storage file might not exist at this path (stored with timestamp prefix)
            }
            await deleteSubCollectionItem(trip.id, 'documents', doc.id);
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
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Documents</h2>

            {/* Upload progress bar */}
            {uploadProgress !== null && (
                <div className="mb-4 bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
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
                </div>
            )}

            {docs.length === 0 && uploadProgress === null ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FileText size={48} className="text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No documents yet</h3>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                        Upload travel docs, confirmations, tickets, and anything else the group needs.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {docs.map(doc => {
                        const IconComponent = getFileIcon(doc.type);
                        const uploader = profiles.get(doc.uploadedBy);
                        const isDeleting = deletingId === doc.id;

                        return (
                            <div
                                key={doc.id}
                                className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-4 flex items-center gap-3"
                            >
                                {/* Icon */}
                                <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-primary)] flex items-center justify-center shrink-0">
                                    <IconComponent size={20} className="text-brand-teal" />
                                </div>

                                {/* Info */}
                                <a
                                    href={doc.storageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 min-w-0 group"
                                    aria-label={`Open ${doc.name}`}
                                >
                                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-brand-teal transition-colors">
                                        {doc.name}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                        {formatSize(doc.size)}
                                        {uploader && ` · ${uploader.displayName}`}
                                        {doc.createdAt && ` · ${formatDate(doc.createdAt)}`}
                                    </p>
                                </a>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <a
                                        href={doc.storageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-500 hover:text-brand-teal transition-colors"
                                        aria-label="Download"
                                    >
                                        <Download size={16} />
                                    </a>
                                    <button
                                        onClick={() => setConfirmDelete(doc)}
                                        disabled={isDeleting}
                                        className="p-2 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                        aria-label="Delete"
                                    >
                                        {isDeleting ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>
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
                className="fixed bottom-6 right-6 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-white hover:bg-teal-400 transition-colors disabled:opacity-50"
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
                    <div
                        className="bg-[var(--color-bg-card)] rounded-2xl p-6 w-full max-w-md border border-[var(--color-border)]"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Delete Document?</h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                            "{confirmDelete.name}" will be permanently deleted.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(confirmDelete)}
                                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-400 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
