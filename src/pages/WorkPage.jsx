import React from 'react';
import { motion } from 'framer-motion';
import ProjectCard from '../components/ProjectCard';
import ImageCylinder3D from '../components/ImageCylinder3D';
import Footer from '../components/Footer';
import { projects } from '../data/projects';

export default function WorkPage({ onSelectProject, onNavigate, onCardHoverStart, onCardHoverEnd }) {
  return (
    <div className="work-page">
      {/* 2-Column Work Hero Section */}
      <section className="work-hero-section">
        <div className="work-hero-columns">
          <motion.div
            className="work-hero-left"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="work-hero-title">
              Selected<br />Work
            </h1>
            <p className="work-hero-sub">
              A <span className="highlight">curated</span> collection of projects built around <span className="highlight">strong</span> ideas and <span className="highlight">distinctive</span> design.
            </p>
          </motion.div>

          <motion.div
            className="work-hero-right"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="work-hero-cylinder-box">
              <ImageCylinder3D />
            </div>
          </motion.div>
        </div>
      </section>

      {/* All Projects Grid */}
      <section className="work-section" style={{ paddingTop: '0' }}>
        <div className="projects-grid">
          {projects.map((project) => (
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

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
