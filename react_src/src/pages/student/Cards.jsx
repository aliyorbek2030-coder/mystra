import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../lib/auth';
import confetti from '../../lib/confetti';

/* O'quvchi: AI topgan xatolardan so'z kartochkalari (takrorlash) */

const KEY = 'mys_cards_known';
const loadKnown = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const saveKnown = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ignore */ } };

export default function Cards() {
  const [cards, setCards] = useState(null);
  const [err, setErr] = useState('');
  const [known, setKnown] = useState(loadKnown);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);

  useEffect(() => { apiRequest('/my/cards').then(setCards).catch(e => setErr(e.message)); }, []);
  const deck = useMemo(() => (cards || []).filter(c => !known[c.id]), [cards, known]);
  const card = deck[i % Math.max(1, deck.length)];

  const answer = ok => {
    setFlip(false);
    if (ok) {
      const k = { ...known, [card.id]: Date.now() };
      setKnown(k); saveKnown(k);
      if (deck.length === 1) confetti();
    } else setI(v => v + 1);
  };

  return (
    <div style={{ padding: '24px 20px 40px', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18, fontFamily: "'Onest',system-ui,sans-serif", color: '#12131A' }}>
      <header>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#5B4BFF', textTransform: 'uppercase', letterSpacing: '.08em' }}>Takrorlash</div>
        <h1 style={{ margin: 0, fontFamily: "'Fredoka','Onest',sans-serif", fontWeight: 600, fontSize: 32 }}>Xatolarim kartochkalari</h1>
        <p style={{ margin: '6px 0 0', color: '#5B6070', fontSize: 14 }}>AI sening vazifalaringdan topgan xatolar. Kartani bos — to'g'ri javobni ko'r.</p>
      </header>

      {err && <div style={{ color: '#B91C1C' }}>{err}</div>}
      {cards && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 10, background: '#EEF0F3', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${cards.length ? (cards.length - deck.length) / cards.length * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg,#ECFF9E,#9BC31A)', borderRadius: 99, transition: 'width .4s' }} />
          </div>
          <b style={{ fontSize: 14 }}>{cards.length - deck.length} / {cards.length}</b>
        </div>
      )}

      {cards && cards.length === 0 && (
        <div style={{ background: '#fff', border: '1px dashed #D9DCE3', borderRadius: 24, padding: 36, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 22, fontWeight: 600 }}>Hali kartochka yo'q</div>
          <p style={{ color: '#5B6070', margin: '6px 0 0' }}>Yozma vazifa topshirganingda, AI topgan xatolar shu yerda kartochkaga aylanadi.</p>
        </div>
      )}
      {cards && cards.length > 0 && deck.length === 0 && (
        <div className="pop-in" style={{ borderRadius: 24, padding: 32, textAlign: 'center', background: 'linear-gradient(135deg,#ECFF9E,#D4F74A)' }}>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 26, fontWeight: 700 }}>Barakalla! Hammasini bilasan</div>
          <button type="button" className="btn" style={{ marginTop: 14 }} onClick={() => { setKnown({}); saveKnown({}); setI(0); }}>Qaytadan boshlash</button>
        </div>
      )}

      {card && (
        <>
          <button
            type="button"
            onClick={() => setFlip(f => !f)}
            aria-label={flip ? 'Savolga qaytish' : "Javobni ko'rish"}
            className="pop-in"
            key={card.id + String(flip)}
            style={{
              border: 0, cursor: 'pointer', font: 'inherit', textAlign: 'center', minHeight: 260, borderRadius: 28, padding: 28,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
              color: flip ? '#12131A' : '#fff',
              background: flip ? 'linear-gradient(135deg,#ECFF9E,#D4F74A)' : 'linear-gradient(135deg,#8B7CFF,#5B4BFF 55%,#C026D3)',
              boxShadow: '0 16px 36px rgba(91,75,255,.25)',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', opacity: 0.8 }}>{flip ? "To'g'ri" : 'Xato'}</span>
            <span style={{ fontFamily: "'Fredoka','Onest',sans-serif", fontSize: 32, fontWeight: 600, textDecoration: flip ? 'none' : 'line-through', textDecorationThickness: 2 }}>{flip ? card.right : card.wrong}</span>
            {flip && card.why && <span style={{ fontSize: 15, lineHeight: 1.5, maxWidth: 420 }}>{card.why}</span>}
            {!flip && <span style={{ fontSize: 13, opacity: 0.85 }}>Bos — to'g'risini ko'r</span>}
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button type="button" className="btn" style={{ height: 52, color: '#9A3412', borderColor: '#FDBA74' }} onClick={() => answer(false)}>Yana takrorlayman</button>
            <button type="button" className="btn btn-p" style={{ height: 52 }} onClick={() => answer(true)}>Bilaman ✓</button>
          </div>
        </>
      )}
    </div>
  );
}
