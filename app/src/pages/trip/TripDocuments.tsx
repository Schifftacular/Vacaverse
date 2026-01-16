import React from 'react';
import { useTrip } from '../../contexts/TripContext';
import { FileText, Download, Lock, Plus } from 'lucide-react';

export default function TripDocuments() {
    const { currentTrip } = useTrip();

    // Mock Documents
    const documents = [
        { id: '1', name: 'Flight Itinerary.pdf', type: 'pdf', date: 'Jan 10', size: '2.4 MB' },
        { id: '2', name: 'Hotel Confirmation.pdf', type: 'pdf', date: 'Jan 12', size: '1.1 MB' },
        { id: '3', name: 'Passport Copies.jpg', type: 'image', date: 'Jan 05', size: '3.5 MB', isSecure: true },
    ];

    return (
        <div className="px-4 pb-20">
            <h2 className="text-xl font-bold text-white mb-6">Documents</h2>

            <div className="space-y-3">
                {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between bg-[#1e293b] p-4 rounded-xl border border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.isSecure ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                {doc.isSecure ? <Lock size={20} /> : <FileText size={20} />}
                            </div>
                            <div>
                                <div className="text-white font-medium flex items-center gap-2">
                                    {doc.name}
                                </div>
                                <div className="text-xs text-gray-400">{doc.date} • {doc.size}</div>
                            </div>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                            <Download size={20} />
                        </button>
                    </div>
                ))}
            </div>

            <button className="fixed bottom-6 right-6 w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center shadow-lg text-white">
                <Plus size={24} />
            </button>
        </div>
    );
}
