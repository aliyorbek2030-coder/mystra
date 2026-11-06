import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/auth';

// Ustoz: har bir o'quvchi uchun ota-ona havolasi va Telegram bot
export default function ParentLinks() {
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');

  const load = () => apiRequest('/parent-links').then(setD).catch(e => setMsg(e.message));
  useEffect(() => { load(); }, []);

  const copy = async (text, label) => {
    try { await navigator.clipboard.writeText(text); setMsg(`${label} nusxalandi ✓`); } catch { setMsg(text); }
  };
  const connect = async () => {
    setBusy(true); setMsg('');
    try { const r = await apiRequest('/telegram/connect', { method: 'POST', body: '{}' }); setMsg(`Bot ulandi: @${r.username} ✓`); load(); }
    catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  };

  const base = window.location.origin;
  const items = (d?.items || []).filter(x => !q || x.student.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <section style={{ background: '#fff', border: '1px solid #E3E5EA', borderRadius: 24, padding: 22, margin: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: '1 1 260px' }}>
          <h2 style={{ margin: 0, fontFamily: "'Fredoka','Onest',sans-serif", fontSize: 22, fontWeight: 600 }}>Ota-ona havolalari</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#5B6070' }}>Ota-ona havolani ochadi va farzandining natijasi, davomati va to'lovini ko'radi. Telegram orqali ulansa, xabarlar avtomatik keladi.</p>
        </div>
        {d && (d.bot.connected ? (
          <span style={{ fontSize: 13, fontWeight: 700, padding: '8px 12px', borderRadius: 12, background: '#E7F6EC', color: '#15803D' }}>Telegram bot: @{d.bot.username}</span>
        ) : (
          <button type="button" className="btn btn-p" disabled={busy} onClick={connect}>{busy ? 'Ulanmoqda…' : 'Telegram botni ulash'}</button>
        ))}
      </div>
      {d && !d.bot.configured && (
        <div style={{ fontSize: 13, background: '#FFF1E6', color: '#9A3412', borderRadius: 12, padding: '10px 12px' }}>
          Bot ulash uchun avval «Sozlamalar»da Telegram bot tokenini kiriting (@BotFather dan olinadi).
        </div>
      )}
      {msg && <div role="status" style={{ fontSize: 13, background: '#ECEAFF', color: '#3F31D9', borderRadius: 12, padding: '10px 12px', overflowWrap: 'anywhere' }}>{msg}</div>}
      <input className="fi" placeholder="O'quvchini qidirish…" value={q} onChange={e => setQ(e.target.value)} aria-label="O'quvchini qidirish" />
      <div style={{ display: 'grid', gap: 8 }}>
        {!d ? <div style={{ color: '#5B6070', fontSize: 14 }}>Yuklanmoqda...</div> : items.length === 0 ? <div style={{ color: '#5B6070', fontSize: 14 }}>Hozircha o'quvchilar mavjud emas.</div> : items.map(x => (
          <div key={x.student.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 14, background: '#F8F9FB', border: '1px solid #EEF0F3' }}>
            <div style={{ flex: '1 1 180px', minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{x.student.name}</div>
              <div style={{ fontSize: 12, color: '#5B6070' }}>{x.group || '—'} · {x.chats ? `Telegram: ${x.chats} ta ota-ona` : 'Telegram ulanmagan'}</div>
            </div>
            <button type="button" className="btn" onClick={() => copy(base + x.path, 'Havola')}>Havolani nusxalash</button>
            {x.telegram && <button type="button" className="btn" onClick={() => copy(x.telegram, 'Telegram havola')}>Telegram havola</button>}
            <a className="btn" href={x.path} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>Ochish</a>
          </div>
        ))}
      </div>
    </section>
  );
}
