import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ViewportImage } from './ViewportDistortion';

export default function ProjectCard({ project, onSelect, onHoverStart, onHoverEnd }) {
  const handleMouseEnter = () => {
    if (onHoverStart) onHoverStart();
  };

  const handleMouseLeave = () => {
    if (onHoverEnd) onHoverEnd();
  };

  return (
    <div
      className="project-card"
      onClick={() => onSelect(project)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Authentic WebGL Viewport Distortion Image */}
      <ViewportImage
        src={project.image}
        alt={project.title}
        radius={14}
        fit="cover"
        className="project-card-image-wrap"
      />

      {/* Top Header: Title + Circular Arrow Badge */}
      <div className="project-card-top-bar">
        <h3 className="project-card-title">{project.title}</h3>
        <div className="project-card-arrow-circle" aria-hidden="true">
          <ArrowUpRight size={15} color="#ffffff" />
        </div>
      </div>

      {/* Bottom Footer: Tag Badges */}
      <div className="project-card-bottom-bar">
        <div className="project-card-tags">
          {project.tags.map((tag, idx) => (
            <span key={idx} className="tag-pill">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
