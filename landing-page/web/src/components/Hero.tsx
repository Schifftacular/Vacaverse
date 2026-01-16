import { ArrowRight, Star } from 'lucide-react';
import './Hero.css';
import heroImage from '../assets/hero.png';
import appMockup from '../assets/app-mockup.png';

const Hero = () => {
    return (
        <section className="hero">
            <div className="container hero-container">
                <div className="hero-content">
                    <div className="hero-trust">
                        <div className="stars">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={16} fill="#F9A825" stroke="#F9A825" />
                            ))}
                        </div>
                        <span>Trusted by 50,000+ Families</span>
                    </div>

                    <h1>Bringing Families Together, One Adventure at a Time</h1>

                    <p className="hero-subtitle">
                        Vacaverse transforms multi-generational trip planning from chaos into cosmic harmony -
                        where every family member finds their perfect orbit.
                    </p>

                    <div className="hero-actions">
                        <button className="btn-primary btn-lg">
                            Launch Your Adventure <ArrowRight size={20} />
                        </button>
                        <button className="btn-secondary btn-lg">
                            Explore Demo Galaxy
                        </button>
                    </div>

                    <div className="hero-features">
                        <div className="feature-item">
                            <span className="feature-icon">🌟</span>
                            <span>Constellation Planning</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">🚀</span>
                            <span>Universal Harmony</span>
                        </div>
                    </div>
                </div>

                <div className="hero-visuals">
                    <div className="image-stack">
                        <img src={heroImage} alt="Happy family on vacation" className="hero-img-main" />
                        <img src={appMockup} alt="Vacaverse App Interface" className="hero-img-app" />

                        <div className="floating-badge">
                            <span className="badge-icon">💫</span>
                            <div className="badge-text">
                                <span className="badge-title">Trip Harmony</span>
                                <span className="badge-value">100%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hero-background"></div>
        </section>
    );
};

export default Hero;
