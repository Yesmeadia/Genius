"use client";

import React, { useRef, useEffect } from "react";

const MATH_SYMBOLS = [
  "π", "∑", "∫", "√", "∞", "Δ", "θ", "φ", "λ", "α", "β", "γ",
  "±", "≠", "≈", "≤", "≥", "÷", "×", "²", "³", "∂", "∇", "∈",
  "⊕", "∀", "∃", "ℝ", "ℕ", "ℤ", "∩", "∪", "∏", "⌀", "∠",
  "1+1", "e²", "f(x)", "ax²", "n!", "log", "sin", "cos", "tan",
];

export default function MathCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface MathParticle {
      x: number; y: number;
      vx: number; vy: number;
      symbol: string;
      fontSize: number;
      alpha: number; 
      baseAlpha: number;
      da: number;
      rotation: number; rotSpeed: number;
      layer: number; // 0, 1, 2 for parallax
      blur: number;
    }

    const count = 65;
    const particles: MathParticle[] = Array.from({ length: count }, () => {
      const layer = Math.floor(Math.random() * 3); // 0: back, 1: mid, 2: front
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * (0.1 + layer * 0.1),
        vy: (Math.random() - 0.5) * (0.1 + layer * 0.1),
        symbol: MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)],
        fontSize: 8 + layer * 6 + Math.random() * 4,
        alpha: 0,
        baseAlpha: 0.03 + (2 - layer) * 0.04,
        da: 0.001 + Math.random() * 0.002,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * (0.002 + layer * 0.002),
        layer,
        blur: layer === 0 ? 3 : layer === 1 ? 1 : 0,
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        
        // Pulse alpha
        p.alpha += p.da;
        if (p.alpha > p.baseAlpha || p.alpha < 0.01) p.da *= -1;

        if (p.x < -100) p.x = canvas.width + 100;
        if (p.x > canvas.width + 100) p.x = -100;
        if (p.y < -100) p.y = canvas.height + 100;
        if (p.y > canvas.height + 100) p.y = -100;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        if (p.blur > 0) {
          ctx.filter = `blur(${p.blur}px)`;
        }
        
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.font = `${p.fontSize}px 'Georgia', serif`;
        ctx.fillStyle = "#64748b"; // slate-500
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.symbol, 0, 0);
        ctx.restore();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
