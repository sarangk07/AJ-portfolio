import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import Footer from '../components/Footer';
import { projects } from '../data/projects';

export default function ProjectDetailPage({
  project,
  onBack,
  onSelectProject,
  onNavigate,
  onCardHoverStart,
  onCardHoverEnd
}) {
  if (!project) return null;

  // Next projects excluding current
  const otherProjects = projects.filter((p) => p.id !== project.id).slice(0, 2);

  return (
    <div className="project-detail-page">
      <div className="detail-hero">
        <motion.button
          onClick={onBack}
          className="read-bio-btn"
          style={{ marginBottom: '32px' }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ArrowLeft size={14} /> Back to Works
        </motion.button>

        <motion.h1
          className="detail-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.12, 0.23, 0.5, 1] }}
        >
          {project.title}
        </motion.h1>

        {/* Project Meta Bar */}
        <div className="detail-meta-grid">
          <div className="detail-meta-item">
            <h4>Overview</h4>
            <p>{project.overview}</p>
            {project.extended && (
              <p style={{ marginTop: '16px', color: 'var(--color-gray)', fontSize: '15px' }}>
                {project.extended}
              </p>
            )}
          </div>

          <div className="detail-meta-item">
            <h4>Client</h4>
            <p>{project.client}</p>
          </div>

          <div className="detail-meta-item">
            <h4>Services</h4>
            <p>
              {project.services ? project.services.join(' / ') : project.tags.join(' / ')}
            </p>
          </div>

          <div className="detail-meta-item">
            <h4>Year</h4>
            <p>{project.year}</p>
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="read-bio-btn"
                style={{ marginTop: '20px', display: 'inline-flex', color: 'var(--color-dark)' }}
              >
                View online <ArrowUpRight size={13} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="detail-gallery">
        {project.gallery &&
          project.gallery.map((imgSrc, idx) => (
            <motion.div
              key={idx}
              className="detail-gallery-image"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, ease: [0.12, 0.23, 0.5, 1] }}
            >
              <img
                src={imgSrc}
                alt={`${project.title} mockup ${idx + 1}`}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                loading="lazy"
              />
            </motion.div>
          ))}
      </div>

      {/* More Projects Section */}
      <section style={{ maxWidth: 'var(--site-max-width)', margin: '0 auto 80px', padding: '0 var(--section-pad-x)' }}>
        <h2 className="about-title" style={{ marginBottom: '32px' }}>
          More Projects
        </h2>
        <div className="projects-grid">
          {otherProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onSelect={(selected) => {
                onSelectProject(selected);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
