import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/auth';
import Num from '../../components/Num';

/* O'quvchi: daraja, haftalik liga va nishonlar */

const CSS = `
.gm{padding:24px 20px 40px;max-width:980px;margin:0 auto;display:flex;flex-direction:column;gap:18px;font-family:'Onest',system-ui,sans-serif;color:#12131A}
.gm-h{font-family:'Fredoka','Onest',sans-serif;font-weight:600;margin:0}
.gm-row{display:flex;flex-wrap:wrap;gap:16px}
.gm-card{background:#fff;border:1px solid #E3E5EA;border-radius:24px;padding:20px;min-width:0}
.gm-badges{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.gm-badge{border-radius:20px;padding:16px 14px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative}
.gm-medal{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.gm-badge.off{background:#F4F5F7}
.gm-badge.off .gm-medal{background:#E3E5EA;color:#9CA0AE}
.gm-bar{height:8px;border-radius:99px;background:#EEF0F3;overflow:hidden;width:100%}
.gm-lb{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:14px}
`;

const PAL = [
  ['#ECEAFF', 'linear-gradient(135deg,#8B7CFF,#5B4BFF)'],
  ['#FFE4D6', 'linear-gradient(135deg,#FFC38F,#F2612E)'],
  ['#ECFCCB', 'linear-gradient(135deg,#ECFF9E,#9BC31A)'],
  ['#E0F2FE', 'linear-gradient(135deg,#BAE6FD,#0EA5E9)'],
  ['#FCE7F3', 'linear-gradient(135deg,#FBCFE8,#DB2777)'],
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
        <div style={{ fontSize: 13, fontWeight: 700, color: '#5B4BFF', textTransform: 'uppercase', letterSpacing: '.08em' }}>Yutuqlar</div>
        <h1 className="gm-h" style={{ fontSize: 32 }}>Mening yutuqlarim</h1>
      </header>

      <div className="gm-row">
        <section className="pop-in" style={{ flex: '1 1 300px', position: 'relative', overflow: 'hidden', borderRadius: 26, padding: 22, color: '#fff', background: 'linear-gradient(135deg,#8B7CFF 0%,#5B4BFF 55%,#C026D3 100%)' }}>
          <div aria-hidden="true" style={{ position: 'absolute', right: -30, bottom: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(212,247,74,.9)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 13, color: '#E4E1FF' }}>Daraja</div>
            <div className="gm-h bounce-in" style={{ fontSize: 56, lineHeight: 1 }}>{level.lvl}</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>{level.xp} XP · keyingi darajagacha {Math.max(0, level.to - level.xp)} XP</div>
            <div className="gm-bar" style={{ background: 'rgba(255,255,255,.25)', marginTop: 10 }}>
              <div className="bar-grow" style={{ width: `${lvPct}%`, height: '100%', background: '#D4F74A', borderRadius: 99 }} />
            </div>
          </div>
        </section>

        <section className="gm-card pop-in" style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="flame" style={{ width: 52, height: 52, borderRadius: 16, background: league.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#5B6070' }}>Haftalik liga</div>
              <div className="gm-h" style={{ fontSize: 24 }}>{league.name} ligasi</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="gm-h" style={{ fontSize: 24 }}><Num value={league.weekXp} /></div>
              <div style={{ fontSize: 12, color: '#5B6070' }}>XP shu hafta</div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 4, marginTop: 14 }}>
            {league.board.map(b => (
              <div key={b.id} className="gm-lb page-in" style={{ background: b.me ? 'linear-gradient(135deg,#ECEAFF,#F5F3FF)' : 'transparent', border: b.me ? '1px solid #C7C2FF' : '1px solid transparent' }}>
                <span style={{ width: 26, height: 26, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, background: b.rank === 1 ? '#FACC15' : b.rank === 2 ? '#E3E5EA' : b.rank === 3 ? '#FDBA74' : '#F4F5F7' }}>{b.rank}</span>
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
          <span style={{ fontWeight: 700, color: '#5B6070' }}>{d.earned} / {badges.length}</span>
        </div>
        <div className="gm-badges stagger">
          {badges.map((b, i) => {
            const [bg, grad] = PAL[i % PAL.length];
            return (
              <div key={b.id} className={'gm-badge' + (b.earned ? ' lift' : ' off')} style={b.earned ? { background: bg } : {}}>
                <div className={'gm-medal' + (b.earned ? ' wiggle' : '')} style={b.earned ? { background: grad, color: '#fff', boxShadow: '0 6px 14px rgba(18,19,26,.15)' } : {}}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICON[b.id]}</svg>
                </div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: '#5B6070', lineHeight: 1.4 }}>{b.desc}</div>
                {!b.earned && b.goal > 1 && (
                  <>
                    <div className="gm-bar"><div style={{ width: `${Math.round(b.value / b.goal * 100)}%`, height: '100%', background: '#5B4BFF', borderRadius: 99 }} /></div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#5B6070' }}>{b.value} / {b.goal}</div>
                  </>
                )}
                {b.earned && <span style={{ fontSize: 11, fontWeight: 800, background: '#12131A', color: '#D4F74A', padding: '3px 9px', borderRadius: 99 }}>Olindi</span>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
