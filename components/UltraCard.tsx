'use client';

import { useState } from 'react';

export default function UltraCard({
  children,
  bg,
}: {
  children: React.ReactNode;
  bg: string;
}) {
  const [style, setStyle] = useState({});

  const handleMove = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = (y / rect.height - 0.5) * 10;
    const rotateY = (x / rect.width - 0.5) * -10;

    setStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
    });
  };

  const reset = () => {
    setStyle({ transform: 'rotateX(0deg) rotateY(0deg)' });
  };

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className="relative rounded-3xl overflow-hidden shadow-2xl transition duration-300 will-change-transform"
      style={style}
    >
      {/* background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ backgroundImage: `url(${bg})` }}
      />

      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />

      {/* glow */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-white/10 blur-2xl transition" />

      <div className="relative z-10 p-10 text-white">
        {children}
      </div>
    </div>
  );
}