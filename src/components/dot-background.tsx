"use client";

import { useEffect, useRef } from "react";

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  originalX: number;
  originalY: number;
  radius: number;
}

export default function DotBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Create grid of dots
    const dots: Dot[] = [];
    const spacing = 50; // Space between dots
    const margin = spacing / 2;

    // Calculate number of dots based on canvas size
    const numRows = Math.floor(canvas.height / spacing);
    const numCols = Math.floor(canvas.width / spacing);

    // Create dots in a grid pattern
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const x = margin + col * spacing;
        const y = margin + row * spacing;
        dots.push({
          x,
          y,
          vx: 0,
          vy: 0,
          originalX: x,
          originalY: y,
          radius: 2,
        });
      }
    }

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let isMouseMoving = false;

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isMouseMoving = true;

      // Reset flag after a short delay
      setTimeout(() => {
        isMouseMoving = false;
      }, 100);
    });

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw dots
      dots.forEach((dot) => {
        // Spring force towards original position
        const dx = dot.originalX - dot.x;
        const dy = dot.originalY - dot.y;
        const springForce = 0.1; // Adjust this to change return speed
        const dampening = 0.8; // Adjust this to change bounce smoothness

        dot.vx += dx * springForce;
        dot.vy += dy * springForce;

        // Mouse repulsion
        if (isMouseMoving) {
          const mdx = mouseX - dot.x;
          const mdy = mouseY - dot.y;
          const distance = Math.sqrt(mdx * mdx + mdy * mdy);
          const repulsionRadius = 100; // Radius of mouse influence

          if (distance < repulsionRadius) {
            const force = (1 - distance / repulsionRadius) * 2;
            dot.vx -= (mdx / distance) * force;
            dot.vy -= (mdy / distance) * force;
          }
        }

        // Apply velocity with dampening
        dot.vx *= dampening;
        dot.vy *= dampening;
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Draw dot
        ctx.beginPath();
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto z-0"
      style={{ background: "transparent" }}
    />
  );
}
