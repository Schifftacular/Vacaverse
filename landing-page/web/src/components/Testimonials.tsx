import './Testimonials.css';
import avatarSarah from '../assets/avatar-sarah.png';
import avatarDavid from '../assets/avatar-david.png';
import avatarMaria from '../assets/avatar-maria.png';

const testimonials = [
    {
        id: 1,
        name: "The Johnson Family",
        role: "Constellation",
        image: avatarDavid, // Using grandfather for family rep
        text: "Vacaverse transformed our family reunion from chaos into a perfect constellation! 23 people, 4 generations, and zero gravitational pull toward drama.",
        stars: 5,
        tag: "Family Reunion"
    },
    {
        id: 2,
        name: "Amanda Chen",
        role: "Family Travel Navigator",
        image: avatarSarah,
        text: "As a single mom navigating trips with my parents and kids, Vacaverse eliminated all the scattered communication chaos. My parents love the intuitive cosmic interface.",
        stars: 5,
        tag: "Multi-Gen Trip"
    },
    {
        id: 3,
        name: "Maria Martinez",
        role: "Mission Control",
        image: avatarMaria,
        text: "We've created 3 family constellations with Vacaverse now. Each adventure gets more harmonious because the app learns our family's cosmic rhythms.",
        stars: 5,
        tag: "Repeat Travelers"
    }
];

const Testimonials = () => {
    return (
        <section id="testimonials" className="testimonials-section">
            <div className="container">
                <div className="testimonials-header">
                    <h2>Stellar Family Feedback</h2>
                    <p>Join the universe of happy families</p>
                </div>

                <div className="testimonials-grid">
                    {testimonials.map((t) => (
                        <div key={t.id} className="testimonial-card">
                            <div className="card-header">
                                <img src={t.image} alt={t.name} className="avatar" />
                                <div>
                                    <div className="author-name">{t.name}</div>
                                    <div className="author-role">{t.role}</div>
                                </div>
                            </div>
                            <div className="stars">
                                {'★'.repeat(t.stars)}
                            </div>
                            <p className="testimonial-text">"{t.text}"</p>
                            <span className="testimonial-tag">{t.tag}</span>
                        </div>
                    ))}
                </div>

                <div className="trust-grid">
                    <div className="trust-item">
                        <h3>4.8⭐</h3>
                        <p>Cosmic Rating</p>
                    </div>
                    <div className="trust-item">
                        <h3>15k+</h3>
                        <p>5-Star Reviews</p>
                    </div>
                    <div className="trust-item">
                        <h3>SOC 2</h3>
                        <p>Certified Secure</p>
                    </div>
                    <div className="trust-item">
                        <h3>50k+</h3>
                        <p>Families Connected</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
