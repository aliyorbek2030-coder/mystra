// Yorqin / Tungi mavzu almashtirgich
import { useState } from 'react';

const KEY = 'mys_mode';
export function getMode() {
  try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}
export function applyMode(mode) {
  document.documentElement.dataset.mode = mode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#0E0F14' : '#5B4BFF');
}

const SUN = <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>;
const MOON = <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />;

export default function ThemeSwitch({ style }) {
  const [mode, setMode] = useState(getMode);
  const set = m => {
    setMode(m);
    try { localStorage.setItem(KEY, m); } catch { /* ignore */ }
    applyMode(m);
  };
  const dark = mode === 'dark';
  return (
    <div role="group" aria-label="Mavzu" style={{ display: 'inline-flex', gap: 2, padding: 3, borderRadius: 12, background: dark ? '#1F2230' : '#EEF0F3', ...style }}>
      {[['light', 'Yorqin', SUN], ['dark', 'Tungi', MOON]].map(([id, label, icon]) => {
        const on = mode === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            title={label}
            onClick={() => !on && set(id)}
            style={{
              border: 0, cursor: on ? 'default' : 'pointer', font: 'inherit', fontSize: 12, fontWeight: 700,
              height: 30, padding: '0 10px', borderRadius: 9, display: 'inline-flex', alignItems: 'center', gap: 6,
              background: on ? (id === 'dark' ? 'linear-gradient(135deg,#3A3F5C,#1F2230)' : 'linear-gradient(135deg,#FFE29A,#FFC38F)') : 'transparent',
              color: on ? (id === 'dark' ? '#E4E1FF' : '#7C2D12') : (dark ? '#9CA0AE' : '#4A4E5C'),
              transition: 'background .2s, color .2s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
            {label}
          </button>
        );
      })}
    </div>
  );
}
