import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/auth';

/* Ustoz/admin: moliya paneli */

const CSS = `
.fn{padding:28px 32px 48px;max-width:1300px;margin:0 auto;display:flex;flex-direction:column;gap:20px;font-family:'Onest',system-ui,sans-serif;color:#18181B}
.fn-h{font-weight:600;margin:0}
.fn-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}
.fn-kpi{position:relative;border-radius:12px;padding:16px 18px;background:#fff;border:1px solid #E4E4E7}
.fn-kpi .l{font-size:13px;font-weight:500;color:#71717A}
.fn-kpi .v{font-size:28px;font-weight:600;margin-top:8px;line-height:1.1}
.fn-kpi .s{font-size:12px;margin-top:6px;color:#71717A}
.fn-card{background:#fff;border:1px solid #E4E4E7;border-radius:12px;padding:22px;min-width:0;box-sizing:border-box}
.fn-chart{height:240px;display:flex;align-items:flex-end;gap:18px;margin-top:20px;border-bottom:1px solid #E4E4E7}
.fn-col{flex:1;display:flex;align-items:flex-end;justify-content:center;gap:6px;height:100%}
.fn-bar{width:22px;border-radius:9px 9px 3px 3px;min-height:4px;transform-origin:bottom;animation:fnbar .7s cubic-bezier(.3,1.4,.6,1) both}
@keyframes fnbar{from{transform:scaleY(0)}}
.fn-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #F4F4F5;flex-wrap:wrap}
@media (max-width:860px){.fn{padding:20px 16px 32px}.fn-chart{gap:8px}.fn-bar{width:14px}}
`;

const MON = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
const fmt = n => (Number(n) || 0).toLocaleString('ru-RU').replace(/,/g, ' ');
const short = n => { const v = Number(n) || 0; return v >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + ' mln' : v >= 1e3 ? Math.round(v / 1e3) + ' ming' : String(v); };

export default function Finance() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => apiRequest('/finance').then(setD).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);

  const remind = async () => {
    setBusy(true); setMsg('');
    try { const r = await apiRequest('/finance/remind', { method: 'POST', body: '{}' }); setMsg(`Eslatma yuborildi: ${r.sent} ta o'quvchi`); }
    catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };

  if (err) return <div className="fn"><style>{CSS}</style><div className="fn-card" style={{ color: '#B91C1C' }}>{err}</div></div>;
  if (!d) return <div className="fn"><style>{CSS}</style><div className="fn-card" style={{ height: 200 }} /></div>;

  const c = d.current;
  const max = Math.max(1, ...d.months.map(m => Math.max(m.paid, m.expected)));
  const pct = c.expected ? Math.round(c.paid / c.expected * 100) : 0;

  return (
    <div className="fn">
      <style>{CSS}</style>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '.08em' }}>Moliya</div>
          <h1 className="fn-h" style={{ fontSize: 24 }}>Tushum va qarzdorlik</h1>
        </div>
        <Link to="/payment" className="btn">To'lovlarni kiritish</Link>
      </header>

      <section className="fn-kpis">
        <div className="fn-kpi"><div className="l">Shu oy tushum</div><div className="v">{short(c.paid)}</div><div className="s">so'm · {pct}% reja</div></div>
        <div className="fn-kpi"><div className="l">Kutilgan tushum</div><div className="v">{short(c.expected)}</div><div className="s">{c.students} ta o'quvchi</div></div>
        <div className="fn-kpi"><div className="l">Qarzdorlik</div><div className="v">{short(c.debt)}</div><div className="s">{d.debtors.length} ta qarzdor</div></div>
        <div className="fn-kpi"><div className="l">O'tgan oyga nisbatan</div><div className="v">{c.growth == null ? '—' : `${c.growth > 0 ? '+' : ''}${c.growth}%`}</div><div className="s">+{c.newStudents} yangi o'quvchi</div></div>
      </section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <section className="fn-card" style={{ flex: '2 1 520px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            <h2 className="fn-h" style={{ fontSize: 15, flex: 1 }}>Oxirgi 6 oy</h2>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#52525B' }}><i style={{ width: 12, height: 12, borderRadius: 4, background: '#4F46E5', display: 'inline-block' }} />Tushgan</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#52525B' }}><i style={{ width: 12, height: 12, borderRadius: 4, background: '#D4D4D8', display: 'inline-block' }} />Kutilgan</span>
          </div>
          <div className="fn-chart" role="img" aria-label="Oxirgi 6 oy tushumi">
            {d.months.map((m, i) => (
              <div className="fn-col" key={m.ym} title={`${m.ym}: ${fmt(m.paid)} / ${fmt(m.expected)} so'm`}>
                <div className="fn-bar" style={{ height: Math.round(m.expected / max * 200), background: '#D4D4D8', animationDelay: `${i * 50}ms` }} />
                <div className="fn-bar" style={{ height: Math.round(m.paid / max * 200), background: '#4F46E5', animationDelay: `${i * 50 + 80}ms` }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 8 }}>
            {d.months.map(m => <div key={m.ym} style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#71717A' }}>{MON[Number(m.ym.slice(5)) - 1]}</div>)}
          </div>
        </section>

        <section className="fn-card" style={{ flex: '1 1 300px' }}>
          <h2 className="fn-h" style={{ fontSize: 15, marginBottom: 6 }}>Darajalar bo'yicha</h2>
          {d.byLevel.length === 0 ? <p style={{ color: '#71717A' }}>Hozircha o'quvchilar mavjud emas.</p> : d.byLevel.map(l => (
            <div key={l.level} className="fn-row">
              <span style={{ fontWeight: 800, width: 70 }}>{l.level}</span>
              <span style={{ flex: 1, fontSize: 13, color: '#71717A' }}>{l.students} ta o'quvchi</span>
              <span style={{ fontWeight: 700 }}>{short(l.paid)}</span>
              <div style={{ width: '100%', height: 6, background: '#F4F4F5', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${l.expected ? Math.min(100, l.paid / l.expected * 100) : 0}%`, height: '100%', background: '#9BC31A' }} />
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="fn-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h2 className="fn-h" style={{ fontSize: 15, flex: 1 }}>Qarzdorlar</h2>
          <button type="button" className="btn btn-p" disabled={busy || !d.debtors.length} onClick={remind}>{busy ? 'Yuborilmoqda...' : 'Hammasiga eslatma yuborish'}</button>
        </div>
        {msg && <div role="status" style={{ fontSize: 13, background: '#EEF2FF', color: '#4338CA', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>{msg}</div>}
        {d.debtors.length === 0 ? <p style={{ color: '#15803D', fontWeight: 600 }}>Qarzdor yo'q — hammasi to'lagan!</p> : d.debtors.map(x => (
          <div key={x.student.id} className="fn-row">
            <span style={{ flex: '1 1 180px', fontWeight: 700 }}>{x.student.name}</span>
            <span style={{ fontSize: 13, color: '#71717A', width: 120 }}>{x.group || '—'}</span>
            <span style={{ fontSize: 13, color: '#71717A' }}>{fmt(x.paid)} / {fmt(x.net)}</span>
            <span style={{ fontWeight: 800, color: '#B91C1C', minWidth: 110, textAlign: 'right' }}>−{fmt(x.debt)} so'm</span>
          </div>
        ))}
      </section>
    </div>
  );
}
