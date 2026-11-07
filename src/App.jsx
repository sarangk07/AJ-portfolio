import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import WorkPage from './pages/WorkPage';
import AboutPage from './pages/AboutPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import { ViewportDistortionProvider } from './components/ViewportDistortion';
import SmoothScroll from './components/SmoothScroll';
import { projects } from './data/projects';

export default function App() {
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedProject, setSelectedProject] = useState(null);

  // Sync with URL Hash / Path on Mount and changes
  useEffect(() => {
    const handleUrlChange = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      
      if (hash.startsWith('/projects/')) {
        const slug = hash.replace('/projects/', '');
        const found = projects.find((p) => p.slug === slug);
        if (found) {
          setSelectedProject(found);
          setCurrentPath('/projects/' + slug);
          return;
        }
      }

      if (['/', '/work', '/about'].includes(hash)) {
        setCurrentPath(hash);
        setSelectedProject(null);
      } else {
        setCurrentPath('/');
        setSelectedProject(null);
      }
    };

    handleUrlChange();
    window.addEventListener('hashchange', handleUrlChange);
    return () => window.removeEventListener('hashchange', handleUrlChange);
  }, []);

  const navigateTo = (path) => {
    window.location.hash = path;
    setCurrentPath(path);
    setSelectedProject(null);
    if (window.__lenisInstance) {
      window.__lenisInstance.scrollTo(0, { duration: 0.9, immediate: false });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    const path = `/projects/${project.slug}`;
    window.location.hash = path;
    setCurrentPath(path);
    if (window.__lenisInstance) {
      window.__lenisInstance.scrollTo(0, { duration: 0.9, immediate: false });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToWorks = () => {
    navigateTo('/work');
  };

  return (
    <SmoothScroll>
      <ViewportDistortionProvider>
        <div className="app-container">
          {/* Persistent Navigation Bar */}
          <Navbar currentPath={currentPath} onNavigate={navigateTo} />

          {/* Main Content with smooth page transition */}
          <main className="main-content">
            <AnimatePresence mode="wait">
              {selectedProject ? (
                <motion.div
                  key={selectedProject.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: [0.12, 0.23, 0.5, 1] }}
                >
                  <ProjectDetailPage
                    project={selectedProject}
                    onBack={handleBackToWorks}
                    onSelectProject={handleSelectProject}
                    onNavigate={navigateTo}
                  />
                </motion.div>
              ) : currentPath === '/work' ? (
                <motion.div
                  key="work"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: [0.12, 0.23, 0.5, 1] }}
                >
                  <WorkPage
                    onSelectProject={handleSelectProject}
                    onNavigate={navigateTo}
                  />
                </motion.div>
              ) : currentPath === '/about' ? (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: [0.12, 0.23, 0.5, 1] }}
                >
                  <AboutPage onNavigate={navigateTo} />
                </motion.div>
              ) : (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: [0.12, 0.23, 0.5, 1] }}
                >
                  <HomePage
                    onSelectProject={handleSelectProject}
                    onNavigate={navigateTo}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </ViewportDistortionProvider>
    </SmoothScroll>
  );
}
