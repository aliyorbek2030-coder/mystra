// Yengil konfetti effekti (kutubxonasiz). Ishlatish: confetti() yoki confetti({ y: 0.3 })
const COLORS = ['#5B4BFF', '#D4F74A', '#FF7A45', '#38BDF8', '#F472B6', '#FACC15'];

export default function confetti({ count = 140, x = 0.5, y = 0.35 } = {}) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = (canvas.width = window.innerWidth * dpr);
  const H = (canvas.height = window.innerHeight * dpr);
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2;
    const v = (6 + Math.random() * 10) * dpr;
    return {
      x: W * x, y: H * y,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v - 8 * dpr,
      w: (6 + Math.random() * 6) * dpr, h: (8 + Math.random() * 8) * dpr,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
      c: COLORS[(Math.random() * COLORS.length) | 0],
    };
  });
  let frame = 0;
  const tick = () => {
    frame += 1;
    ctx.clearRect(0, 0, W, H);
    parts.forEach(p => {
      p.vy += 0.35 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - frame / 150);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (frame < 150) requestAnimationFrame(tick); else canvas.remove();
  };
  requestAnimationFrame(tick);
}
