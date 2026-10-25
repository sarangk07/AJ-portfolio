import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CustomCursor({ isCardHovered }) {
  const [visible, setVisible] = useState(false);
  const [hasPointer] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(pointer: fine)').matches : false
  );

  const springConfig = { damping: 28, stiffness: 220, mass: 0.4 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  const dotConfig = { damping: 45, stiffness: 600 };
  const dotX = useSpring(0, dotConfig);
  const dotY = useSpring(0, dotConfig);

  const visibleRef = useRef(false);

  useEffect(() => {
    if (!hasPointer) return;

    const onPointerMove = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      dotX.set(e.clientX);
      dotY.set(e.clientY);
      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }
    };

    const onMouseLeave = () => {
      visibleRef.current = false;
      setVisible(false);
    };

    const onMouseEnter = () => {
      visibleRef.current = true;
      setVisible(true);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave, { passive: true });
    document.addEventListener('mouseenter', onMouseEnter, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [cursorX, cursorY, dotX, dotY, hasPointer]);

  if (!hasPointer || !visible) return null;

  return (
    <>
      {/* Center dot (hidden when card is hovered) */}
      {!isCardHovered && (
        <motion.div
          className="custom-cursor-dot"
          style={{
            x: dotX,
            y: dotY
          }}
        />
      )}

      {/* Trailing Ring */}
      <motion.div
        className={`custom-cursor-ring ${isCardHovered ? 'active-card' : ''}`}
        style={{
          x: cursorX,
          y: cursorY
        }}
      >
        {isCardHovered && <span className="cursor-card-label">VIEW</span>}
      </motion.div>
    </>
  );
}
