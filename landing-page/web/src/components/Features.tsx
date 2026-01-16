import { useState } from 'react';
import { Calendar, Users, DollarSign, Camera, Radio } from 'lucide-react';
import './Features.css';
import appMockup from '../assets/app-mockup.png';

const features = [
    {
        id: 'planning',
        icon: <Calendar size={20} />,
        title: 'Constellation Planning',
        headline: 'Intelligent Constellation Planning',
        description: 'AI orchestrates optimal family orbits based on generational preferences and cosmic rhythms. Automatically calibrates for mobility needs across your entire constellation.',
        quote: '"Finally, a vacation where our family constellation stayed in perfect harmony!"',
        author: 'Sarah M., Family Navigator'
    },
    {
        id: 'activities',
        icon: <Users size={20} />,
        title: 'Activity Harmonics',
        headline: 'Universal Activity Harmonics',
        description: 'Anonymous preference collection creates harmony across all family orbits. Quantum algorithm finds activities that align multiple generational interests.',
        quote: '"Even our most distant family member found stellar activities to love!"',
        author: 'David K., Constellation Elder'
    },
    {
        id: 'economics',
        icon: <DollarSign size={20} />,
        title: 'Stellar Economics',
        headline: 'Transparent Stellar Economics',
        description: 'Crystal-clear cost constellations broken down by family orbit. Multiple payment gateways across the financial universe. No awkward money conversations.',
        quote: '"Made splitting costs across our 12-member constellation beautifully simple."',
        author: 'Maria L., Family Mission Control'
    },
    {
        id: 'memories',
        icon: <Camera size={20} />,
        title: 'Memory Galaxy',
        headline: 'Memory Galaxy Creation',
        description: 'Instant photo sharing creates real-time memory constellations. Automated journey documentation builds your family\'s eternal galaxy.',
        quote: '"Grandma finally sees all our cosmic moments without anyone forgetting to share!"',
        author: 'Jennifer R., Memory Curator'
    },
    {
        id: 'radar',
        icon: <Radio size={20} />,
        title: 'Family Radar',
        headline: 'Real-Time Family Radar',
        description: 'Family member location sharing provides universal peace of mind. Instant plan changes propagate across the entire constellation.',
        quote: '"Parents can explore freely knowing our constellation stays connected."',
        author: 'Robert T., Family Commander'
    }
];

const Features = () => {
    const [activeFeature, setActiveFeature] = useState(0);

    return (
        <section id="features" className="features-section">
            <div className="container">
                <div className="features-header">
                    <h2>Why 50,000+ Family Constellations Choose Our Universe</h2>
                </div>

                <div className="features-tabs">
                    {features.map((feature, index) => (
                        <button
                            key={feature.id}
                            className={`feature-tab ${index === activeFeature ? 'active' : ''}`}
                            onClick={() => setActiveFeature(index)}
                        >
                            <div className="tab-icon">{feature.icon}</div>
                            <span>{feature.title}</span>
                        </button>
                    ))}
                </div>

                <div className="feature-content">
                    <div className="feature-visual">
                        <div className="mockup-container">
                            <img src={appMockup} alt={`${features[activeFeature].title} Interface`} />
                            <div className="glow-effect"></div>
                        </div>
                    </div>

                    <div className="feature-text">
                        <h3>{features[activeFeature].headline}</h3>
                        <p className="feature-desc">{features[activeFeature].description}</p>

                        <div className="feature-quote">
                            <div className="stars">★★★★★</div>
                            <p className="quote-text">{features[activeFeature].quote}</p>
                            <p className="quote-author">— {features[activeFeature].author}</p>
                        </div>

                        <button className="btn-primary">Explore Feature</button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
