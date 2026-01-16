import { Map, Heart, Camera } from 'lucide-react';
import './ValueProp.css';

const ValueProp = () => {
    return (
        <section className="value-prop container">
            <div className="value-header">
                <h2>When Family Planning Feels Like Lost in Space</h2>
                <p className="section-subtitle">
                    Multi-generational family vacation planning shouldn't feel like navigating a black hole.
                    Endless group texts, conflicting preferences, and family members drifting apart.
                </p>
            </div>

            <div className="value-grid">
                <div className="value-card">
                    <div className="icon-wrapper blue">
                        <Map size={32} color="#2B5CE6" />
                    </div>
                    <h3>From Chaos to Cosmic Order</h3>
                    <p>
                        Our orbital planning system brings every family member into perfect alignment.
                        One universe replaces scattered communications - everyone sees their role.
                    </p>
                </div>

                <div className="value-card">
                    <div className="icon-wrapper orange">
                        <Heart size={32} color="#FF7B42" />
                    </div>
                    <h3>Every Star Matters</h3>
                    <p>
                        Advanced preference harmony ensures grandma's cultural experiences and
                        teens' adventure quests both find their place in your vacation galaxy.
                    </p>
                </div>

                <div className="value-card">
                    <div className="icon-wrapper gold">
                        <Camera size={32} color="#F9A825" />
                    </div>
                    <h3>Eternal Memory Galaxy</h3>
                    <p>
                        Real-time sharing and journey documentation creates a living constellation
                        of memories that your family can explore together forever.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default ValueProp;
