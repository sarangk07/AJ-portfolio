import React from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import HeroTitleLiquid from '../components/HeroTitleLiquid';
import TextRing3D from '../components/TextRing3D';
import Footer from '../components/Footer';
import { ViewportImage, ViewportBackground } from '../components/ViewportDistortion';
import { experienceData, servicesList, industriesList } from '../data/projects';

export default function AboutPage({ onNavigate }) {
  return (
    <div className="about-page">
      {/* 1. Hero Section with Big Animated Main Text */}
      <section className="hero-section">
        <div className="hero-content-wrap">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.12, 0.23, 0.5, 1] }}
          >
            <HeroTitleLiquid />
          </motion.div>

          {/* Dual Column Subtitle row */}
          <div className="hero-grid">
            <motion.div
              className="hero-column left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.12, 0.23, 0.5, 1], delay: 0.15 }}
            >
              <p className="hero-text">
                Born in sunny <span className="highlight">Barcelona</span>, working{' '}
                <span className="highlight">globally</span> in{' '}
                <span className="highlight">New York</span>.
              </p>
            </motion.div>

            <motion.div
              className="hero-column right"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.12, 0.23, 0.5, 1], delay: 0.25 }}
            >
              <p className="hero-text">
                I design <span className="highlight">strategic</span> digital experiences
                that turn <span className="highlight">attention</span> into{' '}
                <span className="highlight">action</span>.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Media Section (2 - 1 Layout): Top (Bio Card on Left + Image on Right), Bottom (Fullwidth Image) */}
      <section className="about-media-section">
        <div className="about-top-row">
          {/* Left Column: Bio with Black Background & White Text */}
          <motion.div
            className="about-bio-card"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease: [0.12, 0.23, 0.5, 1] }}
          >
            <ViewportBackground color="#111111" radius={12} />
            <div>
              <h2 className="about-title">Bio</h2>
              <div className="about-bio-text">
                <p>
                  Born in Barcelona and shaped by its vibrant creative culture, I developed an early fascination with art, architecture, and visual storytelling. I later studied at the British School of Design and Arts, where I refined my approach to creative direction and learned to balance bold ideas with thoughtful, functional design.
                </p>
                <p>
                  Today, I work remotely from New York as a creative art director and web designer, collaborating with brands and people around the world. My work blends strategy, storytelling, typography, and digital design to create distinctive visual identities and web experiences that feel both relevant and timeless.
                </p>
              </div>
            </div>

            <a
              href="#cv"
              onClick={(e) => {
                e.preventDefault();
                alert('CV Download: Paul_Michel_CV_2026.pdf');
              }}
              className="cv-download-btn"
            >
              <Download size={14} /> Download my CV
            </a>
          </motion.div>

          {/* Right Column: Portrait Image 1 */}
          <motion.div
            className="about-portrait-card"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease: [0.12, 0.23, 0.5, 1] }}
          >
            <ViewportImage
              src="/images/about-portrait-1.jpg"
              alt="Paul Michel"
              radius={12}
              fit="cover"
              className="about-portrait-img-wrap"
            />
          </motion.div>
        </div>

        {/* Bottom: Fullwidth Image 2 */}
        <motion.div
          className="about-fullwidth-image-wrap"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: [0.12, 0.23, 0.5, 1] }}
        >
          <ViewportImage
            src="/images/about-portrait-2.jpg"
            alt="Paul Michel Studio Environment"
            radius={12}
            fit="cover"
            className="about-fullwidth-img-wrap"
          />
        </motion.div>
      </section>

      {/* 3. Experience Section with Black BG & Spinning Circle Text Animation (TextRing3D) */}
      <section className="about-section" id="experience">
        <div className="about-card">
          <ViewportBackground color="#111111" radius={12} />
          <div className="about-grid">
            {/* Column Left: Experience Table */}
            <motion.div
              className="about-left-col"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, ease: [0.12, 0.23, 0.5, 1] }}
            >
              <h2 className="about-title">Experience</h2>
              <div className="about-experience-table">
                {experienceData.map((item, idx) => (
                  <div key={idx} className="about-exp-row">
                    <div className="about-exp-role">
                      <strong>{item.role}</strong> at {item.company}
                    </div>
                    <div className="about-exp-period">{item.period}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Column Right: Services & Industries */}
            <motion.div
              className="about-columns-wrap"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, ease: [0.12, 0.23, 0.5, 1], delay: 0.15 }}
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
            </motion.div>
          </div>

          {/* 3D Interactive Text Ring (Spinning circle text animation) */}
          <div className="clients-3d-wrap">
            <TextRing3D
              texts={['NIKE', 'GOOGLE', 'CHANEL', 'NETFLIX', 'FRAMER', 'NIKE', 'GOOGLE', 'CHANEL', 'NETFLIX', 'FRAMER']}
              tilt={15}
              depthTilt={-2}
              rotations={1.2}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
