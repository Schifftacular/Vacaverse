import { FileText, Plus } from 'lucide-react';

export default function TripDocuments() {
    return (
        <div className="px-4 pb-20">
            <h2 className="text-xl font-bold text-white mb-6">Documents</h2>

            <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText size={48} className="text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No documents yet</h3>
                <p className="text-gray-400 text-sm">Upload travel documents, confirmations, and tickets here.</p>
                <p className="text-gray-500 text-xs mt-2">Document upload coming soon.</p>
            </div>

            <button className="fixed bottom-6 right-6 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-white opacity-50 cursor-not-allowed">
                <Plus size={24} />
            </button>
        </div>
    );
}
