export const ListSkeleton = () => {
    return (
        <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-800/50 rounded-xl" />
            ))}
        </div>
    );
};

export const CardSkeleton = () => {
    return (
        <div className="h-48 bg-gray-800/50 rounded-2xl animate-pulse" />
    );
};

export const GridSkeleton = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                    <CardSkeleton />
                    <div className="h-4 bg-gray-800/50 rounded w-3/4" />
                    <div className="h-4 bg-gray-800/50 rounded w-1/2" />
                </div>
            ))}
        </div>
    );
};
