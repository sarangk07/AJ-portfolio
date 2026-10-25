import React from 'react';

export default function Marquee({
  items = ['NIKE', 'GOOGLE', 'CHANEL', 'NETFLIX', 'FRAMER', 'SPOTIFY']
}) {
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div className="marquee-container" aria-hidden="true">
      <div className="marquee-track">
        {repeated.map((brand, i) => (
          <span key={i} className="marquee-item">
            {brand}
          </span>
        ))}
      </div>
    </div>
  );
}
