export function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-6 px-4">
            <h2 className="text-lg font-semibold text-brand-teal mb-3">{title}</h2>
            <div className="bg-[#1e293b] rounded-xl p-4 shadow-sm border border-gray-800">
                {children}
            </div>
        </div>
    );
}
