import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLenis } from './SmoothScroll';

export default function Navbar({ currentPath, onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    const handleScroll = () => {
      const next = window.scrollY > 40;
      setScrolled((prev) => (prev !== next ? next : prev));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Work(06)', path: '/work' },
    { label: 'About', path: '/about' }
  ];

  const handleNavClick = (path) => {
    onNavigate(path);
    setMobileOpen(false);
    if (lenis) {
      lenis.scrollTo(0, { duration: 0.9, immediate: false });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo">
          <button onClick={() => handleNavClick('/')} aria-label="Go to home">
            Paul Michel&trade;
          </button>
        </div>

        <div className="nav-links">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`nav-link ${currentPath === item.path ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="nav-cta">
          <a href="mailto:paul@michel.com" className="nav-link">
            Let&rsquo;s talk
          </a>
        </div>

        <button
          className="mobile-menu-btn font-mono"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle mobile navigation menu"
        >
          {mobileOpen ? 'Close' : 'Menu'}
        </button>
      </nav>

      {/* Mobile Fullscreen Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-nav-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.12, 0.23, 0.5, 1] }}
          >
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className="mobile-nav-link"
              >
                {item.label}
              </button>
            ))}
            <a
              href="mailto:paul@michel.com"
              className="mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              Let&rsquo;s talk &rarr;
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
