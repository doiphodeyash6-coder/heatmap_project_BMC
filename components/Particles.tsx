'use client';

import { useEffect, useState } from 'react';

export default function Particles() {

  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // generate ONLY on client
    const generated = [...Array(20)].map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 2 + Math.random() * 3,
    }));

    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute w-2 h-2 bg-white/20 rounded-full animate-ping"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}