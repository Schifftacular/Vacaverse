import { Instagram, Twitter, Facebook, Mail } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer-section">
            <div className="container">

                <div className="cta-container">
                    <h2>Launch Your Family's Greatest Adventure</h2>
                    <p>Join 50,000+ family constellations who've discovered cosmic harmony.</p>
                    <div className="footer-buttons">
                        <button className="btn-primary btn-lg">Download on iOS</button>
                        <button className="btn-primary btn-lg">Download on Android</button>
                    </div>
                    <p className="guarantee">⭐ 30-day stellar satisfaction guarantee</p>
                </div>

                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo">
                            <span className="logo-icon">🪐</span> v<span className="logo-highlight">aca</span>verse
                        </div>
                        <p className="brand-mission">
                            Bringing families together, one adventure at a time.
                        </p>
                        <div className="social-links">
                            <a href="#"><Instagram size={20} /></a>
                            <a href="#"><Twitter size={20} /></a>
                            <a href="#"><Facebook size={20} /></a>
                            <a href="mailto:hello@vacaverse.com"><Mail size={20} /></a>
                        </div>
                    </div>

                    <div className="footer-links">
                        <div className="link-column">
                            <h4>Product</h4>
                            <a href="#">Features</a>
                            <a href="#">Pricing</a>
                            <a href="#">Demo Galaxy</a>
                            <a href="#">Test Flight</a>
                        </div>
                        <div className="link-column">
                            <h4>Company</h4>
                            <a href="#">About Us</a>
                            <a href="#">Mission Control</a>
                            <a href="#">Careers</a>
                            <a href="#">Press</a>
                        </div>
                        <div className="link-column">
                            <h4>Legal</h4>
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                            <a href="#">Security</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Vacaverse Inc. All rights reserved across the universe.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
