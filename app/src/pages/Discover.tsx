import { Search, Heart, SlidersHorizontal, Palmtree, Mountain, Building2 } from 'lucide-react';
import { useState } from 'react';

interface Destination {
    id: string;
    name: string;
    subtitle: string;
    priceLevel: string;
    image: string;
    isFavorite: boolean;
}

const destinations: Destination[] = [
    {
        id: '1',
        name: 'Bali, Indonesia',
        subtitle: 'Island of gods',
        priceLevel: '$$',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=600',
        isFavorite: true,
    },
    {
        id: '2',
        name: 'Swiss Alps',
        subtitle: 'Alpine scenery',
        priceLevel: '$$$',
        image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&q=80&w=600',
        isFavorite: true,
    },
    {
        id: '3',
        name: 'Kyoto, Japan',
        subtitle: 'Tranquil gardens',
        priceLevel: '$$$',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=600',
        isFavorite: false,
    },
    {
        id: '4',
        name: 'Santorini, Greece',
        subtitle: 'Iconic sunsets',
        priceLevel: '$$$$',
        image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&q=80&w=600',
        isFavorite: false,
    },
];

const categories = [
    { icon: Palmtree, label: 'Beach Escapes' },
    { icon: Mountain, label: 'Mountain' },
    { icon: Building2, label: 'City' },
];

function DestinationCard({ destination }: { destination: Destination }) {
    const [isFav, setIsFav] = useState(destination.isFavorite);

    return (
        <div className="bg-[#1e293b] rounded-2xl overflow-hidden border border-gray-800">
            <div className="relative h-36">
                <img src={destination.image} alt={destination.name} className="w-full h-full object-cover" />
                <button
                    onClick={() => setIsFav(!isFav)}
                    className="absolute top-2 right-2 p-2 bg-black/30 rounded-full"
                >
                    <Heart
                        size={20}
                        className={isFav ? 'fill-red-500 text-red-500' : 'text-white'}
                    />
                </button>
            </div>
            <div className="p-3">
                <h3 className="font-bold text-white">{destination.name}</h3>
                <p className="text-sm text-gray-400">{destination.subtitle}</p>
                <p className="text-sm text-brand-teal mt-1">{destination.priceLevel}</p>
            </div>
        </div>
    );
}

export default function Discover() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Beach Escapes');

    return (
        <div className="pb-8">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-[#0f172a] sticky top-0 z-10">
                <div className="w-10 h-10 rounded-full bg-brand-teal flex items-center justify-center">
                    <span className="text-white font-bold text-lg">V</span>
                </div>
                <h1 className="text-xl font-bold text-white">Discover</h1>
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Avatar" className="w-full h-full object-cover" />
                </div>
            </div>

            <div className="px-4">
                {/* Search */}
                <div className="relative mb-4">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Where to next?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1e293b] border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                    />
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {categories.map(({ icon: Icon, label }) => (
                        <button
                            key={label}
                            onClick={() => setActiveCategory(label)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === label
                                    ? 'bg-[#1e293b] text-white border border-gray-600'
                                    : 'bg-transparent text-gray-400 border border-gray-700 hover:border-gray-600'
                                }`}
                        >
                            <Icon size={16} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Header with Sort/Filter */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Popular Destinations</h2>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300">
                            <SlidersHorizontal size={16} />
                            Sort
                        </button>
                        <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300 border border-gray-600 px-3 py-1 rounded-lg">
                            Filter
                        </button>
                    </div>
                </div>

                {/* Destination Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {destinations.map((dest) => (
                        <DestinationCard key={dest.id} destination={dest} />
                    ))}
                </div>
            </div>
        </div>
    );
}
