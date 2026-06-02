// components/AnimatedBackground.jsx
// Canvas-based animated background shared across all pages.
import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W;
      canvas.height = H;
    };
    window.addEventListener("resize", onResize);

    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Colour palette
    const COLORS = [
      "rgba(74,184,63,",
      "rgba(96,165,250,",
      "rgba(165,180,252,",
      "rgba(45,212,191,",
    ];

    // ── Particles
    const NUM_PARTICLES = 130;
    const particles = Array.from({ length: NUM_PARTICLES }, () => {
      const vx = (Math.random() - 0.5) * 0.6;
      const vy = (Math.random() - 0.5) * 0.6;
      return {
        x:    Math.random() * W,
        y:    Math.random() * H,
        baseVx: vx,
        baseVy: vy,
        vx:   vx,
        vy:   vy,
        r:    Math.random() * 2.5 + 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.5 + 0.45,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.04 + 0.01,
      };
    });

    // ── Meteors
    function createMeteor() {
      const angle = Math.PI / 5 + Math.random() * (Math.PI / 6);
      const speed = 8 + Math.random() * 8;
      return {
        x: Math.random() * W * 1.5 - W * 0.25,
        y: -20 - Math.random() * 200,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 80 + Math.random() * 120,
        alpha: 0, life: 0,
        maxLife: 55 + Math.random() * 40,
        color: COLORS[Math.floor(Math.random() * 3)],
        width: 1.5 + Math.random() * 1,
        delay: Math.random() * 280,
      };
    }
    const meteors = Array.from({ length: 5 }, createMeteor);

    // ── Waves
    const waves = Array.from({ length: 4 }, (_, i) => ({
      amplitude: 28 + i * 16,
      frequency: 0.003 + i * 0.001,
      speed:     0.007 + i * 0.004,
      phase:     (i * Math.PI) / 2,
      y:         H * 0.55 + i * 55,
      color:     COLORS[i % COLORS.length],
      alpha:     0.035 + i * 0.008,
      width:     1 + i * 0.25,
    }));

    // ── Ripples
    const ripples = [];
    function addRipple(x, y) {
      ripples.push({
        x, y, r: 0,
        maxR: 110 + Math.random() * 80,
        alpha: 0.35,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        speed: 1.8 + Math.random() * 2,
      });
    }
    const rippleInterval = setInterval(() => {
      if (ripples.length < 5)
        addRipple(Math.random() * W, Math.random() * H);
    }, 2400);

    // ── Energy beams
    const beams = Array.from({ length: 3 }, (_, i) => ({
      x1: Math.random() * W, y1: Math.random() * H,
      x2: Math.random() * W, y2: Math.random() * H,
      vx1: (Math.random() - 0.5) * 0.35, vy1: (Math.random() - 0.5) * 0.35,
      vx2: (Math.random() - 0.5) * 0.35, vy2: (Math.random() - 0.5) * 0.35,
      color: COLORS[i % COLORS.length],
      alpha: 0.05 + Math.random() * 0.05,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // Canvas is transparent — body CSS handles the dark background

      // Waves
      waves.forEach(w => {
        w.phase += w.speed;
        ctx.beginPath();
        ctx.moveTo(0, w.y);
        for (let x = 0; x <= W; x += 4)
          ctx.lineTo(x, w.y + Math.sin(x * w.frequency + w.phase) * w.amplitude);
        ctx.strokeStyle = w.color + w.alpha + ")";
        ctx.lineWidth   = w.width;
        ctx.stroke();
      });

      // Energy beams
      beams.forEach(b => {
        b.x1 += b.vx1; b.y1 += b.vy1;
        b.x2 += b.vx2; b.y2 += b.vy2;
        if (b.x1 < 0 || b.x1 > W) b.vx1 *= -1;
        if (b.y1 < 0 || b.y1 > H) b.vy1 *= -1;
        if (b.x2 < 0 || b.x2 > W) b.vx2 *= -1;
        if (b.y2 < 0 || b.y2 > H) b.vy2 *= -1;
        const g = ctx.createLinearGradient(b.x1, b.y1, b.x2, b.y2);
        g.addColorStop(0,   b.color + "0)");
        g.addColorStop(0.5, b.color + b.alpha + ")");
        g.addColorStop(1,   b.color + "0)");
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.strokeStyle = g;
        ctx.lineWidth   = 1;
        ctx.stroke();
      });

      // Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += rp.speed;
        rp.alpha -= 0.007;
        if (rp.alpha <= 0 || rp.r >= rp.maxR) { ripples.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = rp.color + rp.alpha + ")";
        ctx.lineWidth   = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r * 0.55, 0, Math.PI * 2);
        ctx.strokeStyle = rp.color + (rp.alpha * 0.35) + ")";
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      }

      // Particles + constellation
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particles.forEach((p, idx) => {
        const dx = mx - p.x, dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          p.vx += (dx / dist) * 0.055;
          p.vy += (dy / dist) * 0.055;
        }
        
        // Decay back to base velocity instead of zero
        p.vx += (p.baseVx - p.vx) * 0.02;
        p.vy += (p.baseVy - p.vy) * 0.02;

        p.x += p.vx;  p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        p.pulse += p.pulseSpeed;
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + a + ")";
        ctx.fill();

        // Glow
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
        gr.addColorStop(0, p.color + (a * 0.35) + ")");
        gr.addColorStop(1, p.color + "0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();

        // Constellation lines
        for (let j = idx + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx2 = p.x - q.x, dy2 = p.y - q.y;
          const d2  = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = p.color + ((1 - d2 / 120) * 0.28) + ")";
            ctx.lineWidth   = 0.7;
            ctx.stroke();
          }
        }

        // Mouse lines
        if (dist < 140) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = p.color + ((1 - dist / 140) * 0.3) + ")";
          ctx.lineWidth   = 0.7;
          ctx.stroke();
        }
      });

      // Meteors
      meteors.forEach((m, idx) => {
        if (m.delay > 0) { m.delay--; return; }
        m.life++;
        m.x += m.vx; m.y += m.vy;
        if (m.life < 10)           m.alpha = m.life / 10;
        else if (m.life > m.maxLife - 10) m.alpha = (m.maxLife - m.life) / 10;
        else                       m.alpha = 1;

        const spd = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        const tx  = m.x - m.vx * (m.len / spd);
        const ty  = m.y - m.vy * (m.len / spd);
        const mg  = ctx.createLinearGradient(tx, ty, m.x, m.y);
        mg.addColorStop(0,   m.color + "0)");
        mg.addColorStop(0.7, m.color + (m.alpha * 0.55) + ")");
        mg.addColorStop(1,   m.color + (m.alpha * 0.9)  + ")");
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = mg;
        ctx.lineWidth   = m.width;
        ctx.lineCap     = "round";
        ctx.stroke();

        const hg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.width * 4);
        hg.addColorStop(0, m.color + (m.alpha * 0.9) + ")");
        hg.addColorStop(1, m.color + "0)");
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.width * 2, 0, Math.PI * 2);
        ctx.fillStyle = hg;
        ctx.fill();

        if (m.life >= m.maxLife || m.x > W + 100 || m.y > H + 100)
          meteors[idx] = { ...createMeteor(), delay: 80 + Math.random() * 200 };
      });

      // Cursor glow
      if (mx > 0 && mx < W) {
        const cg = ctx.createRadialGradient(mx, my, 0, mx, my, 90);
        cg.addColorStop(0, "rgba(74,184,63,0.10)");
        cg.addColorStop(0.5,"rgba(96,165,250,0.05)");
        cg.addColorStop(1, "rgba(74,184,63,0)");
        ctx.beginPath();
        ctx.arc(mx, my, 90, 0, Math.PI * 2);
        ctx.fillStyle = cg;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(rippleInterval);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0, zIndex: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
