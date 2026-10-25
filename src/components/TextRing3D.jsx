import React, { useRef, useState, useEffect } from 'react';
import { useScroll, useSpring, useTransform } from 'framer-motion';

export default function TextRing3D({
  texts = ['NIKE', 'GOOGLE', 'CHANEL', 'NETFLIX', 'FRAMER', 'NIKE', 'GOOGLE', 'CHANEL', 'NETFLIX', 'FRAMER'],
  tilt = 15,
  depthTilt = -2,
  perspectiveRatio = 1.4,
  textScale = 6,
  rotations = 1.2
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 500 });
  const ringRef = useRef(null);
  const dragOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const currentDrag = useRef(0);

  // Resize measurement
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 1000,
          height: containerRef.current.clientHeight || 500
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Scroll driven rotation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

  const scrollRotation = useTransform(scrollYProgress, [0, 1], [0, 360 * rotations]);
  const smoothScrollRotation = useSpring(scrollRotation, {
    stiffness: 90,
    damping: 25,
    mass: 0.25
  });

  // Direct GPU transform update on scroll change (0 React re-renders)
  useEffect(() => {
    const unsubscribe = smoothScrollRotation.on('change', (latest) => {
      if (ringRef.current) {
        ringRef.current.style.transform = `rotateY(${latest + dragOffsetRef.current}deg)`;
      }
    });
    return () => unsubscribe();
  }, [smoothScrollRotation]);

  // Mouse / Touch Drag interaction
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    dragStartX.current = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    currentDrag.current = dragOffsetRef.current;
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const diff = (clientX - dragStartX.current) * 0.4;
    dragOffsetRef.current = currentDrag.current + diff;
    if (ringRef.current) {
      ringRef.current.style.transform = `rotateY(${smoothScrollRotation.get() + dragOffsetRef.current}deg)`;
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // 3D Geometry calculations
  const A = Math.max(320, Math.min(dimensions.width, dimensions.height * 1.8));
  const count = texts.length;
  const radius = A * 0.42;
  const perspective = Math.max(800, A * perspectiveRatio);
  const fontSize = Math.max(28, (A * textScale) / 100);

  return (
    <div
      ref={containerRef}
      className="text-ring-section"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        perspective: `${perspective}px`,
        touchAction: 'none'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transformStyle: 'preserve-3d',
          transform: `rotateZ(${tilt}deg) rotateX(${depthTilt}deg)`
        }}
      >
        <div
          ref={ringRef}
          style={{
            position: 'absolute',
            transformStyle: 'preserve-3d',
            transform: 'rotateY(0deg)',
            willChange: 'transform'
          }}
        >
          {texts.map((text, idx) => {
            const angleDeg = (idx * 360) / count;
            const angleRad = (angleDeg * Math.PI) / 180;
            const x = Math.sin(angleRad) * radius;
            const z = Math.cos(angleRad) * radius;

            return (
              <div
                key={`${idx}-${text}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  width: '0px',
                  height: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translate3d(${x}px, 0px, ${z}px) rotateY(${angleDeg}deg)`,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'visible',
                  WebkitBackfaceVisibility: 'visible',
                  pointerEvents: 'none'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: `${fontSize}px`,
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    color: 'var(--color-dark)',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    userSelect: 'none',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.03))'
                  }}
                >
                  {text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
