import { useEffect, useRef } from 'react';

export interface ThemeConfig {
  id: string;
  name: string;
  bgGradient: string;
  textGradient: string;
  particleColor: string[];
  ambientGlow: string;
  subtextColor: string;
  badgeBg: string;
  isDark: boolean;
}

export const THEMES: Record<string, ThemeConfig> = {
  aurora: {
    id: 'aurora',
    name: 'Cosmic Aurora',
    bgGradient: 'bg-radial-[at_top_center] from-slate-900 via-[#0a1128] to-[#030712]',
    textGradient: 'bg-gradient-to-r from-emerald-300 via-teal-200 to-indigo-300',
    particleColor: ['rgba(52, 211, 153, 0.6)', 'rgba(45, 212, 191, 0.5)', 'rgba(129, 140, 248, 0.5)', 'rgba(167, 139, 250, 0.4)'],
    ambientGlow: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 75%)',
    subtextColor: 'text-emerald-100/80',
    badgeBg: 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300',
    isDark: true,
  },
  gold: {
    id: 'gold',
    name: 'Midnight Gold',
    bgGradient: 'bg-radial-[at_top_center] from-[#181512] via-[#0d0c0a] to-[#050505]',
    textGradient: 'bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300',
    particleColor: ['rgba(251, 191, 36, 0.65)', 'rgba(245, 158, 11, 0.5)', 'rgba(253, 230, 138, 0.4)', 'rgba(217, 119, 6, 0.3)'],
    ambientGlow: 'radial-gradient(circle, rgba(245, 158, 11, 0.14) 0%, rgba(180, 83, 9, 0.06) 50%, transparent 75%)',
    subtextColor: 'text-amber-100/80',
    badgeBg: 'bg-amber-950/40 border-amber-500/20 text-amber-300',
    isDark: true,
  },
  cyber: {
    id: 'cyber',
    name: 'Neon Cyber',
    bgGradient: 'bg-radial-[at_top_center] from-[#110e28] via-[#080718] to-[#030209]',
    textGradient: 'bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-400',
    particleColor: ['rgba(34, 211, 238, 0.7)', 'rgba(232, 121, 249, 0.6)', 'rgba(56, 189, 248, 0.5)', 'rgba(244, 114, 182, 0.4)'],
    ambientGlow: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(217, 70, 239, 0.1) 50%, transparent 75%)',
    subtextColor: 'text-cyan-100/80',
    badgeBg: 'bg-cyan-950/40 border-cyan-500/20 text-cyan-300',
    isDark: true,
  },
  oceanic: {
    id: 'oceanic',
    name: 'Oceanic Indigo',
    bgGradient: 'bg-radial-[at_top_center] from-[#091e3a] via-[#051124] to-[#020611]',
    textGradient: 'bg-gradient-to-r from-sky-200 via-blue-100 to-indigo-300',
    particleColor: ['rgba(56, 189, 248, 0.6)', 'rgba(99, 102, 241, 0.5)', 'rgba(147, 197, 253, 0.4)', 'rgba(125, 211, 252, 0.5)'],
    ambientGlow: 'radial-gradient(circle, rgba(14, 165, 233, 0.16) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 75%)',
    subtextColor: 'text-sky-100/80',
    badgeBg: 'bg-sky-950/40 border-sky-500/20 text-sky-300',
    isDark: true,
  },
  minimal: {
    id: 'minimal',
    name: 'Pure Daylight',
    bgGradient: 'bg-gradient-to-b from-stone-50 via-slate-100 to-stone-200',
    textGradient: 'bg-gradient-to-r from-slate-900 via-stone-800 to-slate-900',
    particleColor: ['rgba(71, 85, 105, 0.25)', 'rgba(100, 116, 139, 0.2)', 'rgba(148, 163, 184, 0.3)', 'rgba(30, 41, 59, 0.15)'],
    ambientGlow: 'radial-gradient(circle, rgba(203, 213, 225, 0.5) 0%, rgba(226, 232, 240, 0.2) 60%, transparent 80%)',
    subtextColor: 'text-slate-600',
    badgeBg: 'bg-slate-200/60 border-slate-300 text-slate-800',
    isDark: false,
  },
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

interface AmbientBackgroundProps {
  theme: ThemeConfig;
  particleDensity?: 'calm' | 'lively' | 'dense';
}

export function AmbientBackground({ theme, particleDensity = 'lively' }: AmbientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const burstsRef = useRef<BurstParticle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    const countMap = {
      calm: 35,
      lively: 65,
      dense: 110,
    };
    const count = countMap[particleDensity];
    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < count; i++) {
        const color = theme.particleColor[i % theme.particleColor.length];
        const baseSize = Math.random() * 2.8 + 1.2;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          size: baseSize,
          baseSize,
          color,
          alpha: Math.random() * 0.5 + 0.3,
          pulseSpeed: Math.random() * 0.025 + 0.01,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    initParticles();

    // Mouse listener
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      // Spawn burst of 18 shimmering particles on click
      const clickX = e.clientX;
      const clickY = e.clientY;
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.5 + 1.2;
        const color = theme.particleColor[Math.floor(Math.random() * theme.particleColor.length)];
        burstsRef.current.push({
          x: clickX,
          y: clickY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3 + 2,
          color,
          alpha: 1,
          decay: Math.random() * 0.018 + 0.015,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110) {
            const lineAlpha = (1 - dist / 110) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = theme.isDark ? `rgba(255, 255, 255, ${lineAlpha})` : `rgba(0, 0, 0, ${lineAlpha * 0.7})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // Update and draw normal particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.pulsePhase += p.pulseSpeed;
        const pulsedSize = p.baseSize + Math.sin(p.pulsePhase) * 0.8;

        // Interaction with mouse cursor
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            const force = (1 - dist / 130) * 0.025;
            p.vx -= (dx / dist) * force * 15;
            p.vy -= (dy / dist) * force * 15;
          }
        }

        // Apply friction
        p.vx *= 0.985;
        p.vy *= 0.985;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around bounds
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Draw particle with soft halo
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, pulsedSize), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = theme.isDark ? 10 : 3;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      // Update and draw bursts
      for (let i = burstsRef.current.length - 1; i >= 0; i--) {
        const b = burstsRef.current[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.96;
        b.vy *= 0.96;
        b.alpha -= b.decay;

        if (b.alpha <= 0) {
          burstsRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, b.alpha);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = b.color;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, particleDensity]);

  return (
    <div className={`fixed inset-0 pointer-events-none select-none transition-colors duration-1000 ${theme.bgGradient}`}>
      {/* Dynamic ambient radial glow */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: theme.ambientGlow }}
      />
      {/* Fine particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
