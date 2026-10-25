import React from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import Footer from '../components/Footer';
import { experienceData, servicesList, industriesList } from '../data/projects';

export default function AboutPage({ onNavigate }) {
  return (
    <div className="about-page">
      {/* About Hero */}
      <section className="about-page-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.12, 0.23, 0.5, 1] }}
        >
          <div className="section-label" style={{ marginBottom: '20px' }}>
            About
          </div>
          <h1 className="about-page-lead">
            Born in sunny Barcelona, working globally in New York. I design strategic digital experiences that turn attention into action.
          </h1>
        </motion.div>

        {/* Hero Portrait Image */}
        <motion.div
          className="about-portrait-wrap"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.12, 0.23, 0.5, 1], delay: 0.2 }}
        >
          <img
            src="/images/about-portrait-1.jpg"
            alt="Paul Michel in studio"
            className="about-portrait-img"
          />
        </motion.div>

        {/* Narrative Bio */}
        <div className="about-bio-grid">
          <div>
            <h2 className="about-title">Bio</h2>
            <a
              href="#cv"
              onClick={(e) => {
                e.preventDefault();
                alert('CV Download: Paul_Michel_CV_2026.pdf');
              }}
              className="read-bio-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Download size={14} /> Download my CV
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <p className="about-lead" style={{ fontSize: '20px', lineHeight: '1.6' }}>
              Born in Barcelona and shaped by its vibrant creative culture, I developed an early fascination with art, architecture, and visual storytelling. I later studied at the British School of Design and Arts, where I refined my approach to creative direction and learned to balance bold ideas with thoughtful, functional design.
            </p>
            <p className="hero-text" style={{ fontSize: '18px', lineHeight: '1.6', color: 'var(--color-dark)' }}>
              Today, I work remotely from New York as a creative art director and web designer, collaborating with brands and people around the world. My work blends strategy, storytelling, typography, and digital design to create distinctive visual identities and web experiences that feel both relevant and timeless.
            </p>
          </div>
        </div>

        {/* Experience Timeline */}
        <div style={{ padding: '80px 0', borderTop: '1px dashed var(--color-dashed)' }}>
          <h2 className="about-title" style={{ marginBottom: '40px' }}>Experience</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {experienceData.map((item, idx) => (
              <motion.div
                key={idx}
                className="experience-item"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
              >
                <span className="experience-period">{item.period}</span>
                <span className="experience-role-company">
                  <strong>{item.role}</strong> at {item.company}
                  <span style={{ color: 'var(--color-gray)', marginLeft: '8px', fontSize: '14px' }}>
                    ({item.location})
                  </span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Secondary Portrait / Workspace */}
        <motion.div
          className="about-portrait-wrap"
          style={{ aspectRatio: '16 / 9', marginTop: '40px' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src="/images/about-portrait-2.jpg"
            alt="Studio Environment"
            className="about-portrait-img"
            style={{ objectPosition: 'center' }}
          />
        </motion.div>

        {/* Services & Industries Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '60px',
            padding: '80px 0 40px',
            borderTop: '1px dashed var(--color-dashed)'
          }}
        >
          <div>
            <h2 className="about-title">Services</h2>
            <ul className="about-list">
              {servicesList.map((service, idx) => (
                <li key={idx} className="about-list-item">
                  {service}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="about-title">Industries</h2>
            <ul className="about-list">
              {industriesList.map((industry, idx) => (
                <li key={idx} className="about-list-item">
                  {industry}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
