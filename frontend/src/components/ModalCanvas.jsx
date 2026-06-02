// components/ModalCanvas.jsx
// Animated canvas rendered INSIDE a modal backdrop overlay.
// Position absolute so it fills only the modal backdrop area.
import { useEffect, useRef } from "react";

export default function ModalCanvas() {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const parent = canvas.parentElement;

    let W = parent.offsetWidth;
    let H = parent.offsetHeight;
    canvas.width  = W;
    canvas.height = H;

    const ro = new ResizeObserver(() => {
      W = parent.offsetWidth;
      H = parent.offsetHeight;
      canvas.width  = W;
      canvas.height = H;
    });
    ro.observe(parent);

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    parent.addEventListener("mousemove", onMouseMove);

    const COLORS = [
      "rgba(74,184,63,",
      "rgba(96,165,250,",
      "rgba(165,180,252,",
      "rgba(45,212,191,",
    ];

    // ── Particles
    const NUM = 120;
    const particles = Array.from({ length: NUM }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r:  Math.random() * 2.2 + 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.4,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.04 + 0.01,
    }));

    // ── Meteors
    function mkMeteor() {
      const ang = Math.PI / 5 + Math.random() * (Math.PI / 6);
      const spd = 6 + Math.random() * 7;
      return {
        x: Math.random() * W * 1.4 - W * 0.2,
        y: -30 - Math.random() * 150,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        len: 70 + Math.random() * 100,
        alpha: 0, life: 0,
        maxLife: 50 + Math.random() * 35,
        color: COLORS[Math.floor(Math.random() * 3)],
        width: 1.4 + Math.random() * 0.8,
        delay: Math.random() * 220,
      };
    }
    const meteors = Array.from({ length: 4 }, mkMeteor);

    // ── Ripples
    const ripples = [];
    const ri = setInterval(() => {
      if (ripples.length < 4)
        ripples.push({ x: Math.random() * W, y: Math.random() * H,
          r: 0, maxR: 90 + Math.random() * 70, alpha: 0.35,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          speed: 1.5 + Math.random() * 1.8 });
    }, 2500);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Particles + constellation
      particles.forEach((p, idx) => {
        const dx = mx - p.x, dy = my - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 160) { p.vx += (dx/dist)*0.06; p.vy += (dy/dist)*0.06; }
        p.vx *= 0.98; p.vy *= 0.98;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        p.pulse += p.pulseSpeed;
        const a = p.alpha * (0.65 + 0.35 * Math.sin(p.pulse));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + a + ")";
        ctx.fill();

        // Glow
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        gr.addColorStop(0, p.color + (a * 0.4) + ")");
        gr.addColorStop(1, p.color + "0)");
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = gr; ctx.fill();

        // Constellation lines
        for (let j = idx + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx2 = p.x - q.x, dy2 = p.y - q.y;
          const d2  = Math.sqrt(dx2*dx2 + dy2*dy2);
          if (d2 < 115) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = p.color + ((1 - d2/115) * 0.25) + ")";
            ctx.lineWidth = 0.6; ctx.stroke();
          }
        }

        // Mouse lines
        if (dist < 130) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my);
          ctx.strokeStyle = p.color + ((1 - dist/130) * 0.35) + ")";
          ctx.lineWidth = 0.8; ctx.stroke();
        }
      });

      // Meteors
      meteors.forEach((m, idx) => {
        if (m.delay > 0) { m.delay--; return; }
        m.life++; m.x += m.vx; m.y += m.vy;
        if (m.life < 8) m.alpha = m.life / 8;
        else if (m.life > m.maxLife - 8) m.alpha = (m.maxLife - m.life) / 8;
        else m.alpha = 1;
        const spd = Math.sqrt(m.vx*m.vx + m.vy*m.vy);
        const tx = m.x - m.vx*(m.len/spd), ty = m.y - m.vy*(m.len/spd);
        const mg = ctx.createLinearGradient(tx, ty, m.x, m.y);
        mg.addColorStop(0,   m.color + "0)");
        mg.addColorStop(0.7, m.color + (m.alpha*0.6) + ")");
        mg.addColorStop(1,   m.color + (m.alpha*0.9) + ")");
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = mg; ctx.lineWidth = m.width;
        ctx.lineCap = "round"; ctx.stroke();
        const hg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.width*4);
        hg.addColorStop(0, m.color + (m.alpha*0.9) + ")");
        hg.addColorStop(1, m.color + "0)");
        ctx.beginPath(); ctx.arc(m.x, m.y, m.width*2, 0, Math.PI*2);
        ctx.fillStyle = hg; ctx.fill();
        if (m.life >= m.maxLife || m.x > W+100 || m.y > H+100)
          meteors[idx] = { ...mkMeteor(), delay: 60 + Math.random() * 160 };
      });

      // Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += rp.speed; rp.alpha -= 0.007;
        if (rp.alpha <= 0 || rp.r >= rp.maxR) { ripples.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI*2);
        ctx.strokeStyle = rp.color + rp.alpha + ")";
        ctx.lineWidth = 1; ctx.stroke();
      }

      // Cursor glow
      if (mx > 0 && mx < W) {
        const cg = ctx.createRadialGradient(mx, my, 0, mx, my, 80);
        cg.addColorStop(0, "rgba(74,184,63,0.12)");
        cg.addColorStop(1, "rgba(74,184,63,0)");
        ctx.beginPath(); ctx.arc(mx, my, 80, 0, Math.PI*2);
        ctx.fillStyle = cg; ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(ri);
      ro.disconnect();
      parent.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
    />
  );
}
