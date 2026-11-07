import React, { useEffect } from 'react';
import { ReactLenis, useLenis } from 'lenis/react';

export { useLenis };

function LenisGlobalSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (lenis) {
      window.__lenisInstance = lenis;
      return () => {
        if (window.__lenisInstance === lenis) {
          delete window.__lenisInstance;
        }
      };
    }
  }, [lenis]);

  return null;
}

export default function SmoothScroll({ children }) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.1,
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.0,
        infinite: false,
        autoResize: true
      }}
    >
      <LenisGlobalSync />
      {children}
    </ReactLenis>
  );
}
