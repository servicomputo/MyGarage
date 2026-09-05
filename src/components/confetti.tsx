"use client";

import { useEffect, useState } from "react";

interface ConfettiProps {
  show: boolean;
  onDone?: () => void;
}

const COLORS = [
  "oklch(0.62 0.15 162)", // emerald
  "oklch(0.7 0.17 60)",   // amber
  "oklch(0.65 0.2 25)",   // red
  "oklch(0.7 0.17 200)",  // sky
  "oklch(0.65 0.2 300)",  // violet
  "oklch(0.75 0.15 60)",  // yellow
];

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
}

export function Confetti({ show, onDone }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.2,
        duration: 1.2 + Math.random() * 0.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 720,
      }));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setParticles(newParticles);
      const timer = setTimeout(() => {
         
        setParticles([]);
        onDone?.();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  if (!show || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.4}px`,
            backgroundColor: p.color,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
