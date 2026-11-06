import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/auth';

/* O'quvchi: daraja, haftalik liga va nishonlar */

const CSS = `
.gm{padding:24px 20px 40px;max-width:980px;margin:0 auto;display:flex;flex-direction:column;gap:18px;font-family:'Onest',system-ui,sans-serif;color:#18181B}
.gm-h{font-weight:600;margin:0}
.gm-row{display:flex;flex-wrap:wrap;gap:16px}
.gm-card{background:#fff;border:1px solid #E4E4E7;border-radius:12px;padding:20px;min-width:0}
.gm-badges{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.gm-badge{border-radius:12px;padding:16px 14px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative}
.gm-medal{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.gm-badge.off{background:#F4F4F5}
.gm-badge.off .gm-medal{background:#E4E4E7;color:#9CA0AE}
.gm-bar{height:8px;border-radius:99px;background:#F4F4F5;overflow:hidden;width:100%}
.gm-lb{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:14px}
`;

const PAL = [
  ['#FFFFFF', '#EEF2FF'],
  ['#FFFFFF', '#EEF2FF'],
  ['#FFFFFF', '#EEF2FF'],
  ['#FFFFFF', '#EEF2FF'],
  ['#FFFFFF', '#EEF2FF'],
];

const ICON = {
  first: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  perfect: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  streak3: <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 3s1-3 0-7z" />,
  streak7: <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 3s1-3 0-7z" />,
  streak30: <><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 3s1-3 0-7z" /><path d="M12 14v4" /></>,
  xp100: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  xp500: <><path d="M2 4h20l-2 14H4z" /><path d="M8 4l4 6 4-6" /></>,
  cert1: <><circle cx="12" cy="9" r="6" /><path d="M8.5 14l-1.5 7 5-3 5 3-1.5-7" /></>,
  cert5: <><circle cx="12" cy="9" r="6" /><path d="M8.5 14l-1.5 7 5-3 5 3-1.5-7M12 6v6M9 9h6" /></>,
  extra5: <path d="M12 3v18M3 12h18" />,
  att: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 15l2 2 5-5" /></>,
};

export default function Game() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { apiRequest('/my/game').then(setD).catch(e => setErr(e.message)); }, []);

  if (err) return <div className="gm"><style>{CSS}</style><div className="gm-card" style={{ color: '#B91C1C' }}>{err}</div></div>;
  if (!d) return <div className="gm"><style>{CSS}</style><div className="gm-card" style={{ height: 180 }} /></div>;

  const { level, league, badges } = d;
  const lvPct = Math.round(((level.xp - level.from) / Math.max(1, level.to - level.from)) * 100);

  return (
    <div className="gm">
      <style>{CSS}</style>
      <header>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '.08em' }}>Yutuqlar</div>
        <h1 className="gm-h" style={{ fontSize: 24 }}>Mening yutuqlarim</h1>
      </header>

      <div className="gm-row">
        <section style={{ flex: '1 1 300px', position: 'relative', overflow: 'hidden', borderRadius: 12, padding: 22, color: '#18181B', background: '#fff', border: '1px solid #E4E4E7' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 13, color: '#71717A' }}>Daraja</div>
            <div className="gm-h" style={{ fontSize: 40, lineHeight: 1.1 }}>{level.lvl}</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>{level.xp} XP · keyingi darajagacha {Math.max(0, level.to - level.xp)} XP</div>
            <div className="gm-bar" style={{ background: '#EEF2FF', marginTop: 10 }}>
              <div style={{ width: `${lvPct}%`, height: '100%', background: '#4F46E5', borderRadius: 99 }} />
            </div>
          </div>
        </section>

        <section className="gm-card" style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: league.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#71717A' }}>Haftalik liga</div>
              <div className="gm-h" style={{ fontSize: 24 }}>{league.name} ligasi</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="gm-h" style={{ fontSize: 24 }}>{league.weekXp}</div>
              <div style={{ fontSize: 12, color: '#71717A' }}>XP shu hafta</div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 4, marginTop: 14 }}>
            {league.board.map(b => (
              <div key={b.id} className="gm-lb" style={{ background: b.me ? '#EEF2FF' : 'transparent', border: b.me ? '1px solid #E0E7FF' : '1px solid transparent' }}>
                <span style={{ width: 26, height: 26, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, background: b.rank === 1 ? '#FACC15' : b.rank === 2 ? '#E4E4E7' : b.rank === 3 ? '#FDBA74' : '#F4F4F5' }}>{b.rank}</span>
                <span style={{ flex: 1, fontWeight: b.me ? 800 : 600, fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}{b.me ? ' (sen)' : ''}</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{b.xp} XP</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="gm-card">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
          <h2 className="gm-h" style={{ fontSize: 22, flex: 1 }}>Nishonlar</h2>
          <span style={{ fontWeight: 700, color: '#71717A' }}>{d.earned} / {badges.length}</span>
        </div>
        <div className="gm-badges">
          {badges.map((b, i) => {
            const [bg, grad] = PAL[i % PAL.length];
            return (
              <div key={b.id} className={'gm-badge' + (b.earned ? '' : ' off')} style={{ background: '#fff', border: '1px solid #E4E4E7' }}>
                <div className="gm-medal" style={b.earned ? { background: grad, color: '#4F46E5', border: '1px solid #E0E7FF' } : {}}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICON[b.id]}</svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: '#71717A', lineHeight: 1.4 }}>{b.desc}</div>
                {!b.earned && b.goal > 1 && (
                  <>
                    <div className="gm-bar"><div style={{ width: `${Math.round(b.value / b.goal * 100)}%`, height: '100%', background: '#4F46E5', borderRadius: 99 }} /></div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#71717A' }}>{b.value} / {b.goal}</div>
                  </>
                )}
                {b.earned && <span style={{ fontSize: 11, fontWeight: 600, background: '#EEF2FF', color: '#4338CA', padding: '3px 9px', borderRadius: 99 }}>Olindi</span>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
