interface TripCardProps {
    title: string;
    dates: string;
    days: number;
    hours: number;
    minutes: number;
    image: string;
}

export function TripCard({ title, dates, days, hours, minutes, image }: TripCardProps) {
    return (
        <div className="bg-[#1e293b] rounded-2xl overflow-hidden shadow-lg mx-4 mt-2 mb-6 border border-gray-800">
            <div className="h-48 bg-cover bg-center relative" style={{ backgroundImage: `url(${image})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div className="p-4">
                <h3 className="text-xl font-bold mb-1 text-white">{title}</h3>
                <p className="text-gray-400 text-sm mb-4">{dates}</p>

                <div className="flex justify-between px-4 py-2 border-t border-gray-700/50">
                    <div className="text-center">
                        <div className="text-xl font-bold text-white">{days}</div>
                        <div className="text-xs text-gray-500 uppercase">Days</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-white">{hours}</div>
                        <div className="text-xs text-gray-500 uppercase">Hours</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-white">{minutes}</div>
                        <div className="text-xs text-gray-500 uppercase">Minutes</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
