import React from 'react';
import { motion } from 'framer-motion';
import HeroTitleLiquid from '../components/HeroTitleLiquid';
import ProjectCard from '../components/ProjectCard';
import TextRing3D from '../components/TextRing3D';
import Marquee from '../components/Marquee';
import Footer from '../components/Footer';
import { projects, servicesList, industriesList } from '../data/projects';

export default function HomePage({ onSelectProject, onNavigate, onCardHoverStart, onCardHoverEnd }) {
  // Show first 4 featured projects on home
  const featuredProjects = projects.slice(0, 4);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content-wrap">
          {/* Giant Hero Brand Title with Interactive Water Ripple */}
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
                <span className="highlight">Art director</span> at{' '}
                <span className="highlight">Spotify</span> currently based in{' '}
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

      {/* Featured Work Grid */}
      <section className="work-section" id="work">
        <div className="projects-grid">
          {featuredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={onSelectProject}
              onHoverStart={onCardHoverStart}
              onHoverEnd={onCardHoverEnd}
            />
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="about-grid">
          <motion.div
            className="about-left-col"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease: [0.12, 0.23, 0.5, 1] }}
          >
            <h2 className="about-title">About me</h2>
            <p className="about-lead">
              I&rsquo;m a creative art director who turns bold ideas into thoughtful, engaging digital experiences. I combine bold visuals, intuitive layouts, and strategic thinking to create websites that feel unique, work seamlessly, and help brands stand out.
            </p>
          </motion.div>

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
      </section>

      {/* 3D Interactive Text Ring */}
      <section className="clients-3d-wrap">
        <TextRing3D
          texts={['NIKE', 'GOOGLE', 'CHANEL', 'NETFLIX', 'FRAMER', 'NIKE', 'GOOGLE', 'CHANEL', 'NETFLIX', 'FRAMER']}
          tilt={15}
          depthTilt={-2}
          rotations={1.2}
        />
      </section>

      {/* Running Marquee */}
      <Marquee items={['NIKE', 'GOOGLE', 'CHANEL', 'NETFLIX', 'FRAMER']} />

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
