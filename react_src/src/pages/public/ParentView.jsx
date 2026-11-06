import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../../lib/config';
import LangSwitch from '../../components/LangSwitch';

/* Ota-ona kabineti — login talab qilinmaydi, maxsus havola orqali ochiladi */

const CSS = `
.pv{min-height:100vh;font-family:'Onest',system-ui,sans-serif;color:#18181B;padding:20px 16px 48px;max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.pv-card{background:#fff;border:1px solid #E4E4E7;border-radius:12px;padding:18px}
.pv-h{font-weight:600}
.pv-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.pv-tile{border-radius:18px;padding:14px}
.pv-tile .l{font-size:12px;font-weight:500;color:#71717A}
.pv-tile .v{font-size:22px;font-weight:600;margin-top:4px}
.pv-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #F4F4F5}
.pv-seg{display:inline-flex;background:#F4F4F5;border-radius:12px;padding:3px}
.pv-seg button{border:0;background:transparent;font:inherit;font-size:13px;font-weight:700;height:34px;padding:0 14px;border-radius:9px;cursor:pointer;color:#52525B}
.pv-seg button.on{background:#fff;color:#18181B;box-shadow:0 1px 3px rgba(0,0,0,.08)}
@media (max-width:520px){.pv-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;

const PAY = { paid: ["To'langan", '#E7F6EC', '#15803D'], partial: ['Qisman', '#FFF1E6', '#9A3412'], unpaid: ["To'lanmagan", '#FEF2F2', '#B91C1C'] };

export default function ParentView() {
  const { token } = useParams();
  const [period, setPeriod] = useState('week');
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setD(null); setErr('');
    fetch(`${API_URL}/parent/${encodeURIComponent(token)}${period === 'month' ? '?p=month' : ''}`)
      .then(r => r.json().then(j => (r.ok ? j : Promise.reject(new Error(j.error || 'Xatolik')))))
      .then(setD)
      .catch(e => setErr(e.message));
  }, [token, period]);

  if (err) {
    return (
      <div className="pv"><style>{CSS}</style>
        <div className="pv-card" style={{ textAlign: 'center', padding: 36 }}>
          <h1 className="pv-h" style={{ fontSize: 24, margin: '0 0 8px' }}>Havola ishlamayapti</h1>
          <p style={{ color: '#71717A', margin: 0 }}>{err}. Ustozdan yangi havola so'rang.</p>
        </div>
      </div>
    );
  }
  if (!d) return <div className="pv"><style>{CSS}</style><div className="pv-card" style={{ height: 160 }} /></div>;

  const present = d.attendance.filter(a => a.v === 'p').length;
  const pay = PAY[d.payment.status] || PAY.unpaid;

  return (
    <div className="pv">
      <style>{CSS}</style>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#18181B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>m</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#71717A' }}>Ota-ona kabineti</div>
          <div className="pv-h" style={{ fontSize: 18 }}>MYSTRA</div>
        </div>
        <LangSwitch />
      </header>

      <section style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, padding: 22, color: '#18181B', background: '#fff', border: '1px solid #E4E4E7' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 13, color: '#71717A' }}>{d.student.group || 'Guruh'} · {d.student.level}</div>
          <h1 className="pv-h" style={{ fontSize: 24, margin: '4px 0 10px' }}>{d.student.name}</h1>
          <div className="pv-seg" style={{ background: '#F4F4F5' }}>
            {[['week', 'Hafta'], ['month', 'Oy']].map(([id, l]) => (
              <button key={id} type="button" className={period === id ? 'on' : ''} onClick={() => setPeriod(id)}>{l}</button>
            ))}
          </div>
        </div>
      </section>

      <div className="pv-grid">
        <div className="pv-tile" style={{ background: '#fff', border: '1px solid #E4E4E7', color: '#18181B' }}><div className="l">O'rtacha natija</div><div className="v">{d.avg != null ? `${d.avg}%` : '—'}</div></div>
        <div className="pv-tile" style={{ background: '#fff', border: '1px solid #E4E4E7', color: '#18181B' }}><div className="l">Ketma-ket kunlar</div><div className="v">{d.streak.streak}</div></div>
        <div className="pv-tile" style={{ background: '#fff', border: '1px solid #E4E4E7', color: '#18181B' }}><div className="l">Davomat</div><div className="v">{d.attendance.length ? `${present}/${d.attendance.length}` : '—'}</div></div>
        <div className="pv-tile" style={{ background: '#fff', border: '1px solid #E4E4E7', color: '#18181B' }}><div className="l">Guruhdagi o'rni</div><div className="v">{d.rank || '—'}</div></div>
        <div className="pv-tile" style={{ background: '#fff', border: '1px solid #E4E4E7', color: '#18181B' }}><div className="l">Sertifikatlar</div><div className="v">{d.certificates}</div></div>
        <div className="pv-tile" style={{ background: '#fff', border: '1px solid #E4E4E7', color: pay[2] }}><div className="l">To'lov</div><div className="v" style={{ fontSize: 18, marginTop: 10 }}>{pay[0]}</div></div>
      </div>

      <div className="pv-card">
        <h2 className="pv-h" style={{ fontSize: 18, margin: '0 0 6px' }}>Natijalar</h2>
        {d.results.length === 0 ? <p style={{ color: '#71717A', margin: '8px 0 0' }}>Bu davrda natija yo'q</p> : d.results.map((r, i) => (
          <div className="pv-row" key={i}>
            <div style={{ fontSize: 12, color: '#71717A', width: 82 }}>{r.date}</div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600, minWidth: 0 }}>{r.title}{r.extra ? ' ⭐' : ''}</div>
            <span style={{ fontWeight: 600, fontSize: 13, padding: '4px 10px', borderRadius: 99, background: '#F4F4F5' }}>{r.score}%</span>
          </div>
        ))}
      </div>

      <div className="pv-card">
        <h2 className="pv-h" style={{ fontSize: 18, margin: '0 0 10px' }}>Davomat</h2>
        {d.attendance.length === 0 ? <p style={{ color: '#71717A', margin: 0 }}>Davomat belgilanmagan</p> : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {d.attendance.map(a => (
              <span key={a.date} title={a.date} style={{ fontSize: 13, fontWeight: 700, padding: '8px 10px', borderRadius: 12, background: a.v === 'p' ? '#E7F6EC' : '#FEF2F2', color: a.v === 'p' ? '#15803D' : '#B91C1C' }}>
                {a.date.slice(5).replace('-', '.')} · {a.v === 'p' ? 'Keldi' : 'Kelmadi'}
              </span>
            ))}
          </div>
        )}
      </div>
      <p style={{ textAlign: 'center', fontSize: 12, color: '#71717A', margin: 0 }}>Bu sahifa faqat siz uchun. Havolani boshqalarga yubormang.</p>
    </div>
  );
}
