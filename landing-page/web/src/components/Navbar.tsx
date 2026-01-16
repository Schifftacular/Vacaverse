import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="container navbar-container">
                <a href="#" className="logo">
                    <span className="logo-icon">🪐</span> v<span className="logo-highlight">aca</span>verse
                </a>

                <div className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </div>

                <div className={`nav-links ${isOpen ? 'active' : ''}`}>
                    <a href="#features" onClick={() => setIsOpen(false)}>Features</a>
                    <a href="#how-it-works" onClick={() => setIsOpen(false)}>How It Works</a>
                    <a href="#testimonials" onClick={() => setIsOpen(false)}>Testimonials</a>
                    <button className="btn-primary">Download</button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
