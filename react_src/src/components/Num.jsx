import { useEffect, useRef, useState } from 'react';

// Matndagi raqamlarni 0 dan qiymatigacha "sanab" chiqaradi: "15 / 15", "18,4 mln", "92%"
const reduce = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function Num({ value, duration = 900 }) {
  const text = String(value ?? '');
  const parts = text.split(/(\d+(?:[.,]\d+)?)/);
  const [t, setT] = useState(reduce() ? 1 : 0);
  const raf = useRef(0);

  useEffect(() => {
    if (reduce()) { setT(1); return undefined; }
    const start = performance.now();
    const tick = now => {
      const k = Math.min(1, (now - start) / duration);
      setT(1 - Math.pow(1 - k, 3)); // ease-out
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    setT(0);
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [text, duration]);

  return (
    <span aria-label={text}>
      <span aria-hidden="true">
        {parts.map((p, i) => {
          if (i % 2 === 0) return p;
          const sep = p.includes(',') ? ',' : '.';
          const num = parseFloat(p.replace(',', '.'));
          const dec = (p.split(/[.,]/)[1] || '').length;
          const cur = (num * t).toFixed(dec).replace('.', sep);
          return cur;
        })}
      </span>
    </span>
  );
}
