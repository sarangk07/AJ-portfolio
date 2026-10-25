import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cylinderSlides } from '../data/projects';

export default function ImageCylinder3D({
  media = cylinderSlides,
  wheelSize = 112,
  aspectRatio = '3.4:4',
  cornerRadius = 7,
  cardOpacity = 95,
  axisGap = 7,
  viewX = 0,
  viewY = -30,
  viewZ = 0,
  perspective = 7,
  sceneScale = 1,
  speed = 27,
  scrollBoost = 12,
  scrollDecay = 0.35
}) {
  const containerRef = useRef(null);
  const cylinderRef = useRef(null);
  const rotRef = useRef(0); // rotation in turns (rotRef.current * 360 = degrees)
  const boostRef = useRef(1); // multiplier from scroll/wheel
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  // Pointer drag state
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragLastYRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const [isGrabbing, setIsGrabbing] = useState(false);

  // Parse aspect ratio (e.g., "3.4:4" -> 0.85)
  const parseAspectRatio = useCallback((ratioStr) => {
    if (!ratioStr) return 3 / 4;
    const clean = String(ratioStr).trim().replace(/\s/g, '');
    const sep = clean.includes(':') ? ':' : clean.includes('/') ? '/' : null;
    if (sep) {
      const parts = clean.split(sep);
      const w = parseFloat(parts[0]);
      const h = parseFloat(parts[1]);
      if (Number.isFinite(w) && Number.isFinite(h) && h > 0) return w / h;
    }
    const val = parseFloat(clean);
    return Number.isFinite(val) && val > 0 ? val : 3 / 4;
  }, []);

  // Measure container dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w > 0 && h > 0) {
        setSize(prev => (Math.abs(prev.width - w) < 0.5 && Math.abs(prev.height - h) < 0.5 ? prev : { width: w, height: h }));
        setIsReady(true);
      }
    };

    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          setSize(prev => (Math.abs(prev.width - w) < 0.5 && Math.abs(prev.height - h) < 0.5 ? prev : { width: w, height: h }));
          setIsReady(true);
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, []);

  // Scroll and wheel boost interaction
  useEffect(() => {
    const boostWheel = (multiplier = 1) => {
      const maxBoost = Math.max(1, scrollBoost);
      const intensity = Math.min(1, Math.max(0.15, multiplier));
      const targetBoost = 1 + (maxBoost - 1) * intensity;
      boostRef.current = Math.max(boostRef.current, targetBoost);
    };

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const curScrollY = window.scrollY;
      const diff = Math.abs(curScrollY - lastScrollY);
      if (diff > 0) {
        boostWheel(Math.min(1, diff / 40));
      }
      lastScrollY = curScrollY;
    };

    const handleWheel = (e) => {
      const delta = Math.abs(e.deltaY);
      if (delta > 0) {
        boostWheel(Math.min(1, delta / 120));
      }
    };

    const handleTouchMove = () => {
      boostWheel(0.8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [scrollBoost]);

  // Main 3D rotation animation loop with off-screen pausing
  useEffect(() => {
    let animId = null;
    let lastTime = performance.now();
    let isIntersecting = true;

    const loop = (currentTime) => {
      animId = null;
      if (!isIntersecting || document.hidden) return;

      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      if (!isDraggingRef.current) {
        // Apply decay to drag velocity if any
        if (Math.abs(dragVelocityRef.current) > 0.01) {
          rotRef.current += (dragVelocityRef.current * dt) / 360;
          dragVelocityRef.current *= Math.exp(-dt / 0.25);
        }

        // Apply decay to scroll boost
        const decay = Math.max(0.02, scrollDecay);
        boostRef.current = 1 + (boostRef.current - 1) * Math.exp(-dt / decay);

        // Constant speed times boost
        const curSpeed = speed * boostRef.current;
        rotRef.current += (curSpeed * dt) / 360;
      }

      // Update cylinder DOM style directly for maximum performance
      const currentDeg = rotRef.current * 360;
      if (cylinderRef.current) {
        cylinderRef.current.style.transform = `rotateX(${currentDeg}deg)`;
      }

      animId = requestAnimationFrame(loop);
    };

    const wakeLoop = () => {
      if (!isIntersecting || document.hidden || animId) return;
      lastTime = performance.now();
      animId = requestAnimationFrame(loop);
    };

    wakeLoop();

    let io = null;
    if (typeof IntersectionObserver !== 'undefined' && containerRef.current) {
      io = new IntersectionObserver(([entry]) => {
        isIntersecting = !!entry?.isIntersecting;
        if (isIntersecting) {
          wakeLoop();
        } else if (animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      }, { threshold: 0.01 });
      io.observe(containerRef.current);
    }

    const handleVisibility = () => {
      if (document.hidden) {
        if (animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      } else {
        wakeLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (io) io.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [speed, scrollDecay]);

  // Pointer drag event handlers for direct tactile interaction
  const onPointerDown = (e) => {
    isDraggingRef.current = true;
    setIsGrabbing(true);
    dragStartYRef.current = e.clientY;
    dragLastYRef.current = e.clientY;
    dragVelocityRef.current = 0;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }
  };

  const onPointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaY = e.clientY - dragLastYRef.current;
    dragLastYRef.current = e.clientY;

    // Convert pixel drag to degree rotation (sensitivity ~0.6)
    const degDelta = deltaY * 0.65;
    rotRef.current += degDelta / 360;
    dragVelocityRef.current = degDelta * 30; // initial momentum for release
  };

  const onPointerUp = (e) => {
    isDraggingRef.current = false;
    setIsGrabbing(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  // Dimensions math from Framer W component
  const measuredW = size.width > 0 ? size.width : 480;
  const measuredH = size.height > 0 ? size.height : 320;
  const j = Math.min(measuredW, measuredH);
  const n = (wheelSize / 100) * j / 2;
  const pOffset = (axisGap / 100) * n;
  const cardHeight = Math.max(1, n - pOffset);
  const cardWidth = cardHeight * parseAspectRatio(aspectRatio);
  const cornerR = Math.max(0, cornerRadius);
  const opacityVal = Math.max(0, Math.min(100, cardOpacity)) / 100;
  const perspectivePx = Math.max(1, j * perspective);

  const count = media.length;
  const step = count > 0 ? 360 / count : 0;

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'visible',
        background: 'transparent',
        perspective: `${perspectivePx}px`,
        perspectiveOrigin: '50% 50%',
        isolation: 'isolate',
        cursor: isGrabbing ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          transformStyle: 'preserve-3d',
          pointerEvents: 'none',
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.25s ease-out'
        }}
      >
        {/* Tilting & View Angle Wrapper */}
        <div
          style={{
            position: 'relative',
            width: 0,
            height: 0,
            transformStyle: 'preserve-3d',
            transform: `
              rotateX(${viewX}deg)
              rotateY(${viewY}deg)
              rotateZ(${viewZ}deg)
              scale(${sceneScale})
            `
          }}
        >
          {/* Rotating Cylinder Wheel */}
          <div
            ref={cylinderRef}
            style={{
              position: 'relative',
              width: 0,
              height: 0,
              transformStyle: 'preserve-3d',
              transform: 'rotateX(0deg)',
              willChange: 'transform'
            }}
          >
            {media.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: 0,
                  height: 0,
                  transformStyle: 'preserve-3d',
                  transform: `rotateX(${idx * step}deg)`
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: -cardWidth / 2,
                    top: pOffset,
                    width: cardWidth,
                    height: cardHeight,
                    transformOrigin: '50% 0%',
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'visible',
                    WebkitBackfaceVisibility: 'visible',
                    overflow: 'hidden',
                    borderRadius: `${cornerR}px`,
                    opacity: opacityVal,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title || ''}
                    draggable={false}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      display: 'block',
                      objectFit: 'cover',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      WebkitUserSelect: 'none'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
