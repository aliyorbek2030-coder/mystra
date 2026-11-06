import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, useAuth } from '../../lib/auth';

/* MYSTRA 2.0 — ustozning bosh sahifasi (real ma'lumotlar bilan) */

const CSS = `
.ov{padding:28px 32px 48px;max-width:1240px;margin:0 auto;display:flex;flex-direction:column;gap:20px}
.ov-head{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.ov-date{font-size:13px;color:#71717A}
.ov-title{margin:2px 0 0;font-size:24px;font-weight:600;color:#18181B}
.ov-btn{height:38px;padding:0 14px;border-radius:10px;font:inherit;font-weight:500;font-size:14px;display:inline-flex;align-items:center;gap:8px;text-decoration:none;cursor:pointer;border:1px solid #E4E4E7;background:#fff;color:#18181B}
.ov-btn:hover{background:#F4F4F5}
.ov-btn.p{background:#4F46E5;border-color:#4F46E5;color:#fff}
.ov-btn.p:hover{background:#4338CA}
.ov-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.ov-kpi{position:relative;border-radius:12px;padding:16px 18px;text-decoration:none;display:block;background:#fff;border:1px solid #E4E4E7;color:#18181B}
a.ov-kpi:hover{border-color:#D4D4D8}
.ov-kpi-ic{position:absolute;right:14px;top:14px;color:#A1A1AA}
.ov-kpi-l{font-size:13px;font-weight:500;color:#71717A}
.ov-kpi-v{font-size:28px;font-weight:600;margin-top:8px;line-height:1.1;letter-spacing:-0.02em}
.ov-kpi-s{font-size:12px;margin-top:6px;color:#71717A}
.ov-row{display:flex;flex-wrap:wrap;gap:12px}
.ov-card{background:#fff;border:1px solid #E4E4E7;border-radius:12px;padding:20px;box-sizing:border-box;min-width:0}
.ov-card h2{margin:0;font-size:15px;font-weight:600;color:#18181B}
.ov-ai{background:#fff;border:1px solid #E4E4E7;border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:2px;box-sizing:border-box;min-width:0;color:#18181B}
.ov-ai-item{padding:12px 0;border-top:1px solid #F4F4F5;display:flex;flex-direction:column;gap:6px}
.ov-ai-item:first-of-type{border-top:0}
.ov-ai-tag{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#71717A !important}
.ov-ai-text{font-size:14px;line-height:1.5;color:#3F3F46}
.ov-ai-btn{align-self:flex-start;font-size:13px;font-weight:600;color:#4F46E5;text-decoration:none}
.ov-ai-btn:hover{text-decoration:underline}
.ov-bars{height:200px;display:flex;align-items:flex-end;gap:14px;margin-top:20px;border-bottom:1px solid #E4E4E7}
.ov-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:6px;min-width:0}
.ov-bar{width:100%;max-width:40px;border-radius:6px 6px 0 0;min-height:4px;background:#4F46E5 !important}
.ov-bar-lbl{flex:1;text-align:center;font-size:12px;color:#71717A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.ov-table{width:100%;border-collapse:collapse;font-size:14px;min-width:520px}
.ov-table th{text-align:left;color:#71717A;font-size:12px;font-weight:500;padding:8px}
.ov-table td{padding:10px 8px;border-top:1px solid #F4F4F5;vertical-align:middle}
.ov-ava{width:32px;height:32px;border-radius:99px;background:#F4F4F5 !important;color:#3F3F46;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ov-pill{display:inline-block;font-size:12px;font-weight:600;padding:2px 8px;border-radius:99px;background:#F4F4F5 !important;color:#18181B}
.ov-empty{padding:24px 8px;text-align:center;color:#71717A;font-size:14px}
.ov-rank{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid #F4F4F5}
.ov-skel{background:#F4F4F5;border-radius:12px}
@media (max-width:860px){.ov{padding:20px 16px 32px}.ov-title{font-size:22px}}
`;

const BAR_GRAD = ['#4F46E5'];
const COLORS = ['#4F46E5', '#E5582E', '#0E7490', '#15803D', '#9333EA', '#B45309'];
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const DAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

const initials = name => (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
const colorFor = id => COLORS[[...String(id || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

function money(n) {
    const v = Number(n) || 0;
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + ' mln';
    if (v >= 1e3) return Math.round(v / 1e3) + ' ming';
    return String(v);
}

function greeting() {
    const h = new Date().getHours();
    if (h < 11) return 'Xayrli tong';
    if (h < 18) return 'Xayrli kun';
    return 'Xayrli kech';
}

const KPI_IC = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    check: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
    star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
    coin: <><circle cx="12" cy="12" r="9" /><path d="M14.5 9a2.5 2.5 0 0 0-2.5-1.5c-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2A2.5 2.5 0 0 1 9.5 15M12 6v1.5M12 16.5V18" /></>,
};

function Kpi({ label, value, sub, grad, icon, to }) {
    const body = (
        <>
            <div className="ov-kpi-ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{KPI_IC[icon]}</svg></div>
            <div className="ov-kpi-l">{label}</div>
            <div className="ov-kpi-v">{value}</div>
            {sub && <div className="ov-kpi-s">{sub}</div>}
        </>
    );
    const cls = 'ov-kpi';
    return to ? <Link to={to} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

export default function Overview() {
    const { user } = useAuth();
    const [d, setD] = useState(null);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setError('');
        try {
            const safe = p => apiRequest(p).catch(() => null);
            const [students, ratings, signups, review, payments, groups] = await Promise.all([
                safe('/students'), safe('/rating'), safe('/signups'), safe('/review'), safe('/payments'), safe('/groups'),
            ]);
            setD({
                students: Array.isArray(students) ? students : [],
                ratings: Array.isArray(ratings) ? ratings : [],
                signups: Array.isArray(signups) ? signups : [],
                review: { days: review?.days || [], extra: review?.extra || [] },
                payments: Array.isArray(payments) ? payments : [],
                groups: Array.isArray(groups) ? groups : [],
            });
        } catch (e) {
            setError(e?.message || "Ma'lumotlarni yuklab bo'lmadi");
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const now = new Date();
    const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()}-${MONTHS[now.getMonth()]}`;
    const firstName = (user?.name || '').split(' ')[0];

    if (error) {
        return (
            <div className="ov"><style>{CSS}</style>
                <div className="ov-card"><p style={{ margin: 0, color: '#DC2626' }}>{error}</p>
                    <button className="ov-btn" style={{ marginTop: 12 }} onClick={load}>Qayta urinish</button></div>
            </div>
        );
    }

    if (!d) {
        return (
            <div className="ov"><style>{CSS}</style>
                <div className="ov-skel" style={{ height: 70 }} />
                <div className="ov-kpis">{[0, 1, 2, 3].map(i => <div key={i} className="ov-skel" style={{ height: 130 }} />)}</div>
                <div className="ov-skel" style={{ height: 320 }} />
            </div>
        );
    }

    const { students, ratings, signups, review, payments, groups } = d;
    const active = students.filter(s => s.sub?.active).length;
    const expiring = students.filter(s => s.sub?.active && s.sub.days <= 3);
    const expired = students.filter(s => s.sub && !s.sub.active);
    const queue = [
        ...review.days.map(x => ({ id: 'd' + x.id, student: x.student, title: `${x.day} — kunlik vazifalar`, score: x.total, items: x.items?.length || 0 })),
        ...review.extra.map(x => ({ id: 'e' + x.id, student: x.student, title: x.title || "Qo'shimcha vazifa", score: x.ai?.score, items: 1 })),
    ];
    const rated = ratings.filter(r => Number(r.score) > 0);
    const avgRating = rated.length ? Math.round(rated.reduce((a, r) => a + Number(r.avg || r.score || 0), 0) / rated.length) : 0;
    const paidSum = payments.reduce((a, p) => a + (Number(p.paid) || 0), 0);
    const paidCount = payments.filter(p => p.status === 'paid').length;
    const debtors = payments.filter(p => p.status !== 'paid' && (Number(p.netPrice) || 0) > 0);
    const payPct = payments.length ? Math.round(paidCount / payments.length * 100) : 0;
    const top = rated.slice(0, 5);

    const perGroup = groups.map(g => ({ label: g.name, n: students.filter(s => s.groupId === g.id).length }));
    const maxN = Math.max(1, ...perGroup.map(g => g.n));

    const insights = [];
    if (queue.length) insights.push({ tag: 'Tekshirish', color: '#71717A', text: `${queue.length} ta ish tekshirishni kutmoqda. AI ularga dastlabki baho qo'ydi.`, to: '/review', btn: 'Tekshirishga o‘tish' });
    if (signups.length) insights.push({ tag: 'Yangi so‘rov', color: '#A5B4FC', text: `${signups.length} ta yangi o'quvchi ro'yxatdan o'tishni kutmoqda.`, to: '/signups', btn: "So'rovlarni ko'rish" });
    if (expiring.length) insights.push({ tag: 'Obuna', color: '#FDBA74', text: `${expiring.length} ta o'quvchining obunasi 3 kun ichida tugaydi: ${expiring.slice(0, 3).map(s => s.name.split(' ')[0]).join(', ')}${expiring.length > 3 ? '…' : ''}.`, to: '/payment', btn: "To'lovlarga o'tish" });
    if (expired.length) insights.push({ tag: 'Diqqat', color: '#FDBA74', text: `${expired.length} ta o'quvchining obunasi tugagan — ular vazifa topshira olmaydi.`, to: '/people', btn: "O'quvchilarni ko'rish" });
    if (debtors.length) insights.push({ tag: 'To‘lov', color: '#FDBA74', text: `Bu oy ${debtors.length} ta o'quvchi to'lovni hali to'liq qilmagan.`, to: '/payment', btn: 'Qarzdorlar' });
    if (top[0] && Number(top[0].score) >= 95) insights.push({ tag: 'Muvaffaqiyat', color: '#A5B4FC', text: `${top[0].student?.name} reytingda birinchi — ${top[0].score} ball.`, to: '/reports', btn: 'Hisobotni ochish' });

    return (
        <div className="ov">
            <style>{CSS}</style>

            <header className="ov-head">
                <div style={{ flex: '1 1 260px' }}>
                    <div className="ov-date">{dateStr}</div>
                    <h1 className="ov-title">{greeting()}, {firstName}</h1>
                </div>
                <button type="button" className="ov-btn" onClick={() => { setD(null); load(); }} aria-label="Yangilash">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
                    Yangilash
                </button>
                <Link to="/aitask" className="ov-btn p">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                    Yangi vazifa
                </Link>
            </header>

            <section className="ov-kpis" aria-label="Asosiy ko'rsatkichlar">
                <Kpi grad="g-violet" icon="users" label="Faol o'quvchilar" value={`${active} / ${students.length}`} to="/people"
                    sub={students.length === 0 ? 'Hali o\u2018quvchi yo\u2018q' : expired.length ? `${expired.length} ta obunasi tugagan` : 'Hammasi faol'} />
                <Kpi grad="g-lime" icon="check" label="Tekshirish kutmoqda" value={queue.length} to="/review"
                    sub={queue.length ? 'AI dastlabki baho qo‘ydi' : 'Navbat bo‘sh'} />
                <Kpi grad="g-sky" icon="star" label="O'rtacha natija" value={avgRating ? `${avgRating}%` : '—'} to="/reports"
                    sub={rated.length ? `${rated.length} o'quvchi bo'yicha` : 'Hali natija yo‘q'} />
                <Kpi grad="g-orange" icon="coin" label="Shu oy tushum" value={money(paidSum)} to="/payment"
                    sub={`so'm · ${paidCount} ta to'liq to'lov`} />
            </section>

            <section className="ov-row">
                <div className="ov-card" style={{ flex: '2 1 480px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h2 style={{ flex: 1 }}>Guruhlar bo'yicha o'quvchilar</h2>
                        <Link to="/people" style={{ fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Guruhlar →</Link>
                    </div>
                    {perGroup.length === 0 ? (
                        <div className="ov-empty">Hali guruh yo'q. <Link to="/people">Birinchi guruhni yarating</Link></div>
                    ) : (
                        <>
                            <div className="ov-bars">
                                {perGroup.map(g => (
                                    <div className="ov-bar-col" key={g.label}>
                                        <div style={{ fontSize: 12, fontWeight: 700 }}>{g.n}</div>
                                        <div className="ov-bar" style={{ height: Math.round(g.n / maxN * 170), background: BAR_GRAD[perGroup.indexOf(g) % BAR_GRAD.length], animationDelay: `${perGroup.indexOf(g) * 60}ms` }} />
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                                {perGroup.map(g => <div className="ov-bar-lbl" key={g.label} title={g.label}>{g.label}</div>)}
                            </div>
                        </>
                    )}
                </div>

                <div className="ov-ai" style={{ flex: '1 1 320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /></svg>
                        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Bugun nimaga e'tibor berish kerak</h2>
                    </div>
                    {insights.length === 0 ? (
                        <div className="ov-ai-item"><div className="ov-ai-text">Hammasi joyida: navbat bo'sh, to'lovlar va obunalar tartibda.</div></div>
                    ) : insights.slice(0, 4).map(i => (
                        <div className="ov-ai-item" key={i.tag + i.text}>
                            <div className="ov-ai-tag" style={{ color: i.color }}>{i.tag}</div>
                            <div className="ov-ai-text">{i.text}</div>
                            <Link to={i.to} className="ov-ai-btn">{i.btn}</Link>
                        </div>
                    ))}
                </div>
            </section>

            <section className="ov-row">
                <div className="ov-card" style={{ flex: '2 1 480px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <h2 style={{ flex: 1 }}>Tekshirish navbati</h2>
                        <Link to="/review" style={{ fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Hammasini ochish →</Link>
                    </div>
                    {queue.length === 0 ? (
                        <div className="ov-empty">Navbat bo'sh — barcha ishlar tekshirilgan.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="ov-table">
                                <thead><tr><th>O'quvchi</th><th>Vazifa</th><th>AI ball</th><th /></tr></thead>
                                <tbody>
                                    {queue.slice(0, 6).map(q => (
                                        <tr key={q.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div className="ov-ava" style={{ background: colorFor(q.student?.id) }}>{initials(q.student?.name)}</div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{q.student?.name}</div>
                                                        <div style={{ fontSize: 12, color: '#71717A' }}>{q.student?.level}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{q.title}{q.items > 1 ? <span style={{ color: '#71717A' }}> · {q.items} ta</span> : null}</td>
                                            <td style={{ fontWeight: 700 }}>{q.score ?? '—'}</td>
                                            <td style={{ textAlign: 'right' }}><Link to="/review" style={{ fontWeight: 600, textDecoration: 'none' }}>Ko'rish</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="ov-card">
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <h2 style={{ flex: 1 }}>Shu oy to'lovlari</h2>
                            <span style={{ fontWeight: 700 }}>{payPct}%</span>
                        </div>
                        <div style={{ height: 10, background: '#F4F4F5', borderRadius: 99, margin: '14px 0 12px', overflow: 'hidden' }}>
                            <div style={{ width: `${payPct}%`, height: '100%', background: '#15803D', borderRadius: 99 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#71717A' }}>
                            <span>{paidCount} ta to'lagan</span><span>{debtors.length} ta qarzdor</span>
                        </div>
                        <Link to="/payment" className="ov-btn" style={{ marginTop: 14, width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>To'lovlarni boshqarish</Link>
                    </div>

                    <div className="ov-card">
                        <h2 style={{ marginBottom: 6 }}>Reyting TOP-5</h2>
                        {top.length === 0 ? <div className="ov-empty">Hali natija yo'q</div> : top.map((r, i) => (
                            <div className="ov-rank" key={r.student?.id || i}>
                                <div style={{ width: 22, fontWeight: 800 }}>{i + 1}</div>
                                <div className="ov-ava" style={{ background: colorFor(r.student?.id), width: 32, height: 32, fontSize: 12 }}>{initials(r.student?.name)}</div>
                                <div style={{ flex: 1, fontWeight: 600, fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.student?.name}</div>
                                <span className="ov-pill" style={{ background: '#F4F4F5', color: '#18181B' }}>{r.score}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
