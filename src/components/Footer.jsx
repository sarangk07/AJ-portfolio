import React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

export default function Footer({ onNavigate }) {
  const handleNav = (path) => {
    if (onNavigate) {
      onNavigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer">
      <div className="footer-top-row">
        <button
          onClick={() => handleNav('/about')}
          className="read-bio-btn"
          aria-label="Read full biography"
        >
          Read Bio <ArrowRight size={14} />
        </button>
      </div>

      <div className="footer-columns-grid">
        {/* Socials */}
        <div className="footer-column">
          <h3 className="footer-column-heading">Socials</h3>
          <div className="footer-link-list">
            <a
              href="https://threads.net"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Threads <ArrowUpRight size={14} opacity={0.6} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Instagram <ArrowUpRight size={14} opacity={0.6} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              LinkedIn <ArrowUpRight size={14} opacity={0.6} />
            </a>
          </div>
        </div>

        {/* Menu */}
        <div className="footer-column">
          <h3 className="footer-column-heading">Menu</h3>
          <div className="footer-link-list">
            <button onClick={() => handleNav('/')} className="footer-link">
              Home
            </button>
            <button onClick={() => handleNav('/work')} className="footer-link">
              Work
            </button>
            <button onClick={() => handleNav('/about')} className="footer-link">
              About
            </button>
          </div>
        </div>

        {/* Contact */}
        <div className="footer-column">
          <h3 className="footer-column-heading">Contact</h3>
          <div className="footer-link-list">
            <a href="mailto:paul@michel.com" className="footer-link">
              paul@michel.com
            </a>
            <a href="tel:+18376528800" className="footer-link">
              +1 837 652 8800
            </a>
          </div>
        </div>
      </div>

      {/* Giant Typography Brand Banner */}
      <div className="footer-banner-wrap">
        <img
          src="/images/paul-michel-banner.svg"
          alt="Paul Michel"
          className="footer-banner-svg"
          loading="lazy"
        />
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom-bar">
        <div>&copy;2026</div>
        <div>
          <a
            href="https://framer.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            Get template <ArrowUpRight size={12} />
          </a>
        </div>
      </div>

      <div className="framer-badge">
        Create a free website with{' '}
        <a href="https://www.framer.com" target="_blank" rel="noopener noreferrer">
          Framer
        </a>
        , the website builder loved by startups, designers and agencies.
      </div>
    </footer>
  );
}
