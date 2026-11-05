import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../lib/auth';
import { adjScore } from '../../lib/helpers';

// --- DIZAYN (MYSTRA 2.0) ---
const RV_CSS = `
.rv{padding:28px 32px 48px;max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:20px;font-family:'Onest',system-ui,sans-serif;color:#12131A}
.rv-eyebrow{font-size:13px;font-weight:700;color:#5B4BFF;text-transform:uppercase;letter-spacing:.08em}
.rv-title{margin:4px 0 2px;font-size:30px;font-weight:700;letter-spacing:-.02em}
.rv-sub{margin:0;color:#5B6070;font-size:14px}
.rv-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.rv-stat{background:#fff;border:1px solid #E3E5EA;border-radius:18px;padding:16px 18px;display:flex;align-items:center;gap:14px}
.rv-stat-ic{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.rv-stat-v{font-size:24px;font-weight:800;letter-spacing:-.02em;line-height:1}
.rv-stat-l{font-size:13px;color:#5B6070;margin-top:4px}
.rv-tabs{display:flex;gap:6px;background:#fff;border:1px solid #E3E5EA;border-radius:14px;padding:5px;align-self:flex-start;flex-wrap:wrap}
.rv-tab{border:0;background:transparent;font:inherit;font-size:14px;font-weight:600;color:#5B6070;height:40px;padding:0 16px;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:8px}
.rv-tab.on{background:#12131A;color:#fff}
.rv-tab .n{font-size:12px;font-weight:700;min-width:22px;height:20px;padding:0 6px;border-radius:99px;background:#EEF0F3;color:#12131A;display:inline-flex;align-items:center;justify-content:center}
.rv-tab.on .n{background:#D4F74A}
.rv-card{background:#fff;border:1px solid #E3E5EA;border-radius:22px;overflow:hidden}
.rv-card-h{display:flex;align-items:center;gap:14px;padding:18px 22px;border-bottom:1px solid #EEF0F3;flex-wrap:wrap}
.rv-ava{width:44px;height:44px;border-radius:99px;color:#fff;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.rv-score{width:64px;height:64px;border-radius:99px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.rv-score-in{width:50px;height:50px;border-radius:99px;background:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px}
.rv-item{padding:18px 22px;border-bottom:1px solid #EEF0F3;display:flex;flex-direction:column;gap:12px}
.rv-item-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.rv-chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;padding:5px 10px;border-radius:99px;background:#ECEAFF;color:#3F31D9}
.rv-step{display:inline-flex;align-items:center;border:1px solid #E3E5EA;border-radius:12px;overflow:hidden;background:#fff}
.rv-step button{width:36px;height:38px;border:0;background:#F8F9FB;font:inherit;font-size:18px;cursor:pointer;color:#12131A}
.rv-step button:hover{background:#EEF0F3}
.rv-step input{width:52px;height:38px;border:0;text-align:center;font:inherit;font-weight:700;font-size:15px;color:#12131A;outline:none;-moz-appearance:textfield}
.rv-step input::-webkit-outer-spin-button,.rv-step input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.rv-ai{background:#12131A;color:#E6E7EE;border-radius:14px;padding:12px 14px;font-size:13px;line-height:1.55;display:flex;gap:10px}
.rv-ai b{color:#D4F74A;font-weight:700}
.rv-foot{display:flex;align-items:center;gap:10px;padding:16px 22px;background:#F8F9FB;flex-wrap:wrap}
.rv-btn{height:44px;padding:0 18px;border-radius:12px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;border:1px solid transparent}
.rv-btn.p{background:#5B4BFF;color:#fff}.rv-btn.p:hover{background:#4A3AF0}
.rv-btn.w{background:#fff;color:#9A3412;border-color:#FDBA74}.rv-btn.w:hover{background:#FFF7ED}
.rv-btn.s{background:#fff;color:#12131A;border-color:#E3E5EA}.rv-btn.s:hover{border-color:#C9CCD6}
.rv-btn:disabled{opacity:.6;cursor:wait}
.rv-empty{background:#fff;border:1px dashed #D9DCE3;border-radius:22px;padding:44px 20px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px}
.rv-empty-ic{width:72px;height:72px;border-radius:22px;display:flex;align-items:center;justify-content:center}
.rv-empty h3{margin:6px 0 0;font-size:18px;font-weight:700}
.rv-empty p{margin:0;color:#5B6070;font-size:14px;max-width:420px;line-height:1.5}
.rv-subs{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.rv-subc{background:#fff;border:1px solid #E3E5EA;border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:12px}
.rv-pill{display:inline-block;font-size:12px;font-weight:700;padding:4px 10px;border-radius:99px}
.rv-banner{border-radius:14px;padding:12px 16px;font-size:14px;display:flex;align-items:center;gap:10px}
@media (max-width:860px){.rv{padding:20px 16px 32px}.rv-title{font-size:24px}.rv-card-h,.rv-item,.rv-foot{padding-left:16px;padding-right:16px}}
`;

const COLORS = ['#5B4BFF', '#E5582E', '#0E7490', '#15803D', '#9333EA', '#B45309'];
const colorFor = id => COLORS[[...String(id || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
const initialsOf = name => (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

const Svg = ({ d, size = 20, color = 'currentColor', width = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const I = {
    check: <path d="M5 12l5 5L20 7" />,
    star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
    spark: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    back: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
    clip: <path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7" />,
    award: <><circle cx="12" cy="9" r="6" /><path d="M8.5 14l-1.5 7 5-3 5 3-1.5-7" /></>,
    refresh: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>,
    x: <path d="M6 6l12 12M18 6L6 18" />,
};

const Empty = ({ icon, bg, color, title, children }) => (
    <div className="rv-empty">
        <div className="rv-empty-ic" style={{ background: bg }}><Svg d={icon} size={34} color={color} /></div>
        <h3>{title}</h3>
        <p>{children}</p>
    </div>
);

import { API_ROOT as API_BASE } from '../../lib/config';

const mediaUrl = (path) => {
    if (!path) return '';

    if (/^(https?:|data:|blob:)/i.test(path)) {
        return path;
    }

    return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

const AuthenticatedFile = ({ path, name, type }) => {
    const [src, setSrc] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!path) {
            setSrc('');
            setError('');
            return undefined;
        }

        let cancelled = false;
        let objectUrl = null;
        const controller = new AbortController();

        setSrc('');
        setError('');

        const url = mediaUrl(path);

        // Data URLs and existing blob URLs don't require authentication.
        if (/^(data:|blob:)/i.test(url)) {
            setSrc(url);

            return () => {
                cancelled = true;
            };
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(url, API_BASE);
        } catch {
            setError('Fayl manzili noto‘g‘ri.');
            return undefined;
        }

        const apiOrigin = new URL(API_BASE).origin;
        const headers = {};

        // Only send the authentication token to our own backend.
        if (parsedUrl.origin === apiOrigin) {
            const token = localStorage.getItem('mys_token');

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
        }

        fetch(url, {
            headers,
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) {
                    if (
                        response.status === 401 ||
                        response.status === 403
                    ) {
                        throw new Error(
                            'Ruxsat berilmadi. Qayta tizimga kiring.'
                        );
                    }

                    throw new Error(
                        `Faylni yuklab bo‘lmadi (${response.status}).`
                    );
                }

                return response.blob();
            })
            .then((blob) => {
                if (cancelled) return;

                objectUrl = URL.createObjectURL(blob);
                setSrc(objectUrl);
            })
            .catch((err) => {
                if (
                    err.name !== 'AbortError' &&
                    !cancelled
                ) {
                    setError(
                        err.message || 'Faylni ochib bo‘lmadi.'
                    );
                }
            });

        return () => {
            cancelled = true;
            controller.abort();

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [path]);

    if (error) {
        return (
            <p
                role="alert"
                style={{
                    color: '#DC2626',
                    fontSize: 13,
                    margin: '4px 0',
                    overflowWrap: 'anywhere',
                }}
            >
                {error}
            </p>
        );
    }

    if (!src) {
        return (
            <span style={{ color: '#5B6070', fontSize: 13 }}>
                Fayl yuklanmoqda...
            </span>
        );
    }

    if (type === 'audio') {
        return (
            <audio
                controls
                preload="metadata"
                src={src}
                style={{
                    display: 'block',
                    width: '100%',
                    marginTop: 6,
                }}
            >
                Brauzeringiz audio faylni qo‘llab-quvvatlamaydi.
            </audio>
        );
    }

    if (type === 'image') {
        return (
            <a
                href={src}
                target="_blank"
                rel="noreferrer"
            >
                <img
                    src={src}
                    alt={name || 'O‘quvchi yuborgan rasm'}
                    style={{
                        display: 'block',
                        maxWidth: '100%',
                        maxHeight: 400,
                        objectFit: 'contain',
                        borderRadius: 12,
                        border: '1px solid #E3E5EA',
                    }}
                />
            </a>
        );
    }

    return (
        <a
            href={src}
            target="_blank"
            rel="noreferrer"
            download={name || undefined}
            style={{ color: '#12131A', fontSize: 13 }}
        >
            Ochish / yuklab olish
        </a>
    );
};

const Media = ({ s }) => (
    <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
        {s.text && (
            <p
                style={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    margin: 0,
                    padding: '14px 16px',
                    background: '#F8F9FB',
                    border: '1px solid #EEF0F3',
                    borderRadius: 14,
                    fontSize: 15,
                    lineHeight: 1.7,
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    color: '#1E2030',
                }}
            >
                {s.text}
            </p>
        )}

        {s.audio && (
            <div>
                <b style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Svg d={I.mic} size={16} /> O‘quvchining ovozli javobi</b>

                <AuthenticatedFile
                    path={s.audio}
                    name="Ovozli javob"
                    type="audio"
                />
            </div>
        )}

        {(Array.isArray(s.files) ? s.files : []).map((f, i) => {
            const path = f.u || f.d;

            if (!path) return null;

            const isImage =
                (f.mime || '').startsWith('image/') ||
                /^data:image\//i.test(path);

            return (
                <div
                    key={`${f.n || 'file'}-${i}`}
                    style={{ marginTop: 6 }}
                >
                    {isImage ? (
                        <AuthenticatedFile
                            path={path}
                            name={f.n || 'O‘quvchi yuborgan rasm'}
                            type="image"
                        />
                    ) : (
                        <div style={{ fontSize: 13 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}><Svg d={I.clip} size={16} />{f.n || 'Yuborilgan fayl'}</span>

                            <AuthenticatedFile
                                path={path}
                                name={f.n || 'student-submission'}
                                type="file"
                            />
                        </div>
                    )}
                </div>
            );
        })}
    </div>
);

export default function Review() {
    const [days, setDays] = useState([]);
    const [extra, setExtra] = useState([]);
    const [students, setStudents] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [scores, setScores] = useState({});
    const [busy, setBusy] = useState({});
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [tab, setTab] = useState('days');
    const [loaded, setLoaded] = useState(false);

    const loadData = useCallback(async () => {
        setError('');

        try {
            const [reviewData, studentsData] = await Promise.all([
                apiRequest('/review'),
                apiRequest('/students'),
            ]);

            setDays(reviewData.days || []);
            setExtra(reviewData.extra || []);

            setStudents(
                Array.isArray(studentsData)
                    ? studentsData
                    : studentsData.students || []
            );

            setSubscriptions([]);
            setLoaded(true);
        } catch (e) {
            setError(
                e.message || 'Ma’lumotlarni yuklashda xatolik'
            );
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const runAction = async (key, action, successText) => {
        if (busy[key]) return;

        setBusy((prev) => ({
            ...prev,
            [key]: true,
        }));

        setError('');
        setMessage('');

        try {
            await action();

            setMessage(successText);

            await loadData();
        } catch (e) {
            setError(
                e.message || 'Amalni bajarishda xatolik'
            );
        } finally {
            setBusy((prev) => ({
                ...prev,
                [key]: false,
            }));
        }
    };

    const changeScore = (id, value) => {
        setScores((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const getScore = (submission) => {
        const value = scores[submission.id];

        if (value !== undefined) {
            return value;
        }

        return (
            submission.suggested?.score ??
            submission.ai?.score ??
            0
        );
    };

    const approveDay = (day) => {
        const key = `day-${day.id}`;

        return runAction(
            key,
            async () => {
                const submittedScores = {};

                (day.items || []).forEach((item) => {
                    submittedScores[item.id] = Math.max(
                        0,
                        Math.min(
                            100,
                            Number(getScore(item)) || 0
                        )
                    );
                });

                await apiRequest(
                    `/review/days/${day.id}/approve`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            scores: submittedScores,
                        }),
                    }
                );
            },
            'Kunlik vazifalar tasdiqlandi ✓'
        );
    };

    const returnDay = (day) => {
        const key = `return-day-${day.id}`;

        return runAction(
            key,
            () =>
                apiRequest(
                    `/review/days/${day.id}/return`,
                    {
                        method: 'POST',
                        body: JSON.stringify({}),
                    }
                ),
            'Vazifalar qayta topshirish uchun qaytarildi'
        );
    };

    const approveExtra = (submission) => {
        const key = `extra-${submission.id}`;

        return runAction(
            key,
            () =>
                apiRequest(
                    `/review/submissions/${submission.id}/approve`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            final: Math.max(
                                0,
                                Math.min(
                                    100,
                                    Number(getScore(submission)) || 0
                                )
                            ),
                        }),
                    }
                ),
            'Vazifa tasdiqlandi ✓'
        );
    };

    const returnExtra = (submission) => {
        const key = `return-extra-${submission.id}`;

        return runAction(
            key,
            () =>
                apiRequest(
                    `/review/submissions/${submission.id}/return`,
                    {
                        method: 'POST',
                        body: JSON.stringify({}),
                    }
                ),
            'Vazifa qayta topshirish uchun qaytarildi'
        );
    };

    const extendSubscription = (student) => {
        const key = `sub-${student.id}`;

        return runAction(
            key,
            () =>
                apiRequest(
                    `/subscriptions/${student.id}/extend`,
                    {
                        method: 'POST',
                        body: JSON.stringify({}),
                    }
                ),
            `${student.name} obunasi 30 kunga uzaytirildi`
        );
    };

    const person = (item) => {
        if (item.student) return item.student;

        return (
            students.find(
                (student) => student.id === item.studentId
            ) || {}
        );
    };

    const studentId = (item) =>
        item.student?.id || item.studentId;

    const isBusy = (key) => Boolean(busy[key]);

    const scoreRing = (v) => {
        const n = Math.max(0, Math.min(100, Number(v) || 0));
        const c = n >= 95 ? '#9BC31A' : n >= 70 ? '#5B4BFF' : '#E5582E';
        return (
            <div className="rv-score" style={{ background: `conic-gradient(${c} ${n * 3.6}deg, #EEF0F3 0)` }} role="img" aria-label={`Umumiy ${n}%`}>
                <div className="rv-score-in">{n}%</div>
            </div>
        );
    };

    const Stepper = ({ id, value }) => (
        <div className="rv-step">
            <button type="button" aria-label="Kamaytirish" onClick={() => changeScore(id, Math.max(0, (Number(value) || 0) - 5))}>−</button>
            <input type="number" min="0" max="100" aria-label="Ustoz bahosi, foiz" value={value} onChange={(e) => changeScore(id, e.target.value)} />
            <button type="button" aria-label="Oshirish" onClick={() => changeScore(id, Math.min(100, (Number(value) || 0) + 5))}>+</button>
        </div>
    );

    const Head = ({ student, meta, right }) => (
        <div className="rv-card-h">
            <div className="rv-ava" style={{ background: colorFor(student.id) }}>{initialsOf(student.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{student.name || 'O‘quvchi'}</div>
                <div style={{ fontSize: 13, color: '#5B6070' }}>{meta}</div>
            </div>
            {right}
        </div>
    );

    const AiNote = ({ ai }) => (ai?.feedback ? (
        <div className="rv-ai">
            <Svg d={I.spark} size={18} color="#D4F74A" />
            <div><b>AI izohi.</b> {ai.feedback}</div>
        </div>
    ) : null);

    const expiring = students.filter(s => s.sub && (!s.sub.active || s.sub.days <= 3));

    const TABS = [
        ['days', 'Kunlik vazifalar', days.length],
        ['extra', 'Extra work', extra.length],
        ['subs', 'Obunalar', expiring.length],
    ];

    return (
        <div className="rv">
            <style>{RV_CSS}</style>

            <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
                <div style={{ flex: '1 1 300px' }}>
                    <div className="rv-eyebrow">Tekshirish markazi</div>
                    <h1 className="rv-title">O‘quvchilarning yangi ishlari</h1>
                    <p className="rv-sub">AI har bir ishga dastlabki baho qo‘yadi — siz tekshirib, bir bosishda tasdiqlaysiz.</p>
                </div>
                <button type="button" className="rv-btn s" onClick={loadData}><Svg d={I.refresh} size={18} /> Yangilash</button>
            </header>

            <section className="rv-stats" aria-label="Qisqa ko‘rsatkichlar">
                {[
                    [I.check, '#ECEAFF', '#5B4BFF', days.length, 'kunlik ish kutmoqda'],
                    [I.star, '#FEF3C7', '#B45309', extra.length, 'extra work kutmoqda'],
                    [I.clock, '#FFF1E6', '#C2410C', expiring.length, 'obunasi tugayapti'],
                    [I.spark, '#ECFCCB', '#4D7C0F', [...days.flatMap(d => d.items || []), ...extra].filter(x => x.ai?.score != null).length, 'ishni AI baholadi'],
                ].map(([ic, bg, col, v, l]) => (
                    <div className="rv-stat" key={l}>
                        <div className="rv-stat-ic" style={{ background: bg }}><Svg d={ic} size={22} color={col} /></div>
                        <div><div className="rv-stat-v">{loaded ? v : '…'}</div><div className="rv-stat-l">{l}</div></div>
                    </div>
                ))}
            </section>

            {error && (
                <div className="rv-banner" role="alert" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
                    <span style={{ flex: 1 }}>{error}</span>
                    <button className="rv-btn s" style={{ height: 36 }} onClick={loadData}>Qayta yuklash</button>
                </div>
            )}
            {message && (
                <div className="rv-banner" role="status" style={{ background: '#E7F6EC', color: '#15803D', border: '1px solid #BBF7D0' }}>
                    <Svg d={I.check} size={18} /><span style={{ flex: 1, fontWeight: 600 }}>{message}</span>
                    <button type="button" aria-label="Yopish" onClick={() => setMessage('')} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#15803D', width: 32, height: 32 }}><Svg d={I.x} size={16} /></button>
                </div>
            )}

            <div className="rv-tabs" role="tablist" aria-label="Bo‘limlar">
                {TABS.map(([id, label, n]) => (
                    <button key={id} type="button" role="tab" aria-selected={tab === id} className={'rv-tab' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>
                        {label} <span className="n">{n}</span>
                    </button>
                ))}
            </div>

            {tab === 'days' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {days.map((day) => {
                        const student = person(day);
                        const items = day.items || [];
                        const total = items.length
                            ? Math.round(items.reduce((sum, item) => sum + (Number(getScore(item)) || 0), 0) / items.length)
                            : 0;
                        return (
                            <article className="rv-card" key={day.id}>
                                {Head({ student, meta: `${student.level ? student.level + ' · ' : ''}${day.day} · ${items.length}/${day.total} vazifa`, right: scoreRing(total) })}
                                {items.map((item) => (
                                    <div className="rv-item" key={item.id}>
                                        <div className="rv-item-h">
                                            <b style={{ fontSize: 15, flex: 1, minWidth: 160 }}>{item.title || 'Vazifa'}</b>
                                            <span className="rv-chip"><Svg d={I.spark} size={14} /> AI {item.ai?.score ?? 0}%</span>
                                            {Stepper({ id: item.id, value: getScore(item) })}
                                        </div>
                                        <Media s={item} />
                                        {AiNote({ ai: item.ai })}
                                    </div>
                                ))}
                                <div className="rv-foot">
                                    <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                                        {total >= 95 ? (
                                            <><span className="rv-pill" style={{ background: '#D4F74A', color: '#12131A', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Svg d={I.award} size={14} /> Sertifikat</span> Tasdiqlansa, sertifikat avtomatik beriladi</>
                                        ) : (
                                            <span style={{ color: '#5B6070' }}>Sertifikat uchun 95% kerak · hozir <b style={{ color: '#12131A' }}>{total}%</b></span>
                                        )}
                                    </div>
                                    <button className="rv-btn w" disabled={isBusy(`return-day-${day.id}`)} onClick={() => returnDay(day)}><Svg d={I.back} size={18} /> Qayta topshirish</button>
                                    <button className="rv-btn p" disabled={isBusy(`day-${day.id}`)} onClick={() => approveDay(day)}><Svg d={I.check} size={18} /> {isBusy(`day-${day.id}`) ? 'Saqlanmoqda…' : 'Tasdiqlash'}</button>
                                </div>
                            </article>
                        );
                    })}
                    {loaded && !days.length && !error && (
                        <Empty icon={I.check} bg="#ECEAFF" color="#5B4BFF" title="Hammasi tekshirilgan">
                            O‘quvchilar kunlik vazifalarni yakunlaganda ular shu yerda paydo bo‘ladi. AI ularga darhol dastlabki baho qo‘yadi.
                        </Empty>
                    )}
                </div>
            )}

            {tab === 'extra' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {extra.map((submission) => {
                        const student = person(submission);
                        return (
                            <article className="rv-card" key={submission.id}>
                                {Head({ student, meta: `${student.level ? student.level + ' · ' : ''}${submission.title || 'Extra work'}`, right: <span className="rv-chip" style={{ fontSize: 13 }}><Svg d={I.spark} size={14} /> AI {submission.ai?.score ?? 0}%</span> })}
                                <div className="rv-item">
                                    <Media s={submission} />
                                    {AiNote({ ai: submission.ai })}
                                </div>
                                <div className="rv-foot">
                                    <span style={{ fontSize: 14, color: '#5B6070', flex: 1 }}>Yakuniy baho:</span>
                                    {Stepper({ id: submission.id, value: getScore(submission) })}
                                    <button className="rv-btn w" disabled={isBusy(`return-extra-${submission.id}`)} onClick={() => returnExtra(submission)}><Svg d={I.back} size={18} /> Qayta</button>
                                    <button className="rv-btn p" disabled={isBusy(`extra-${submission.id}`)} onClick={() => approveExtra(submission)}><Svg d={I.check} size={18} /> {isBusy(`extra-${submission.id}`) ? 'Saqlanmoqda…' : 'Tasdiqlash'}</button>
                                </div>
                            </article>
                        );
                    })}
                    {loaded && !extra.length && (
                        <Empty icon={I.star} bg="#FEF3C7" color="#B45309" title="Extra work yo‘q">
                            O‘quvchilar qo‘shimcha vazifa yuborganda shu yerda ko‘rasiz. Ular uchun alohida XP beriladi.
                        </Empty>
                    )}
                </div>
            )}

            {tab === 'subs' && (
                students.length === 0 ? (
                    <Empty icon={I.clock} bg="#FFF1E6" color="#C2410C" title="Hali o‘quvchi yo‘q">
                        O‘quvchilar qo‘shilgach, ularning obuna muddati shu yerda ko‘rinadi va bir bosishda uzaytiriladi.
                    </Empty>
                ) : (
                    <div className="rv-subs">
                        {[...students].sort((a, b) => (a.sub?.days ?? 0) - (b.sub?.days ?? 0)).map((student) => {
                            const sub = student.sub || {};
                            const daysLeft = sub.active ? sub.days : 0;
                            const tone = !sub.active ? ['#FEF2F2', '#B91C1C', 'Tugagan'] : daysLeft <= 3 ? ['#FFF1E6', '#9A3412', `${daysLeft} kun qoldi`] : ['#E7F6EC', '#15803D', `${daysLeft} kun`];
                            return (
                                <div className="rv-subc" key={student.id}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div className="rv-ava" style={{ background: colorFor(student.id), width: 38, height: 38, fontSize: 13 }}>{initialsOf(student.name)}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</div>
                                            <div style={{ fontSize: 12, color: '#5B6070' }}>{student.level}</div>
                                        </div>
                                        <span className="rv-pill" style={{ background: tone[0], color: tone[1] }}>{tone[2]}</span>
                                    </div>
                                    <div style={{ height: 6, background: '#EEF0F3', borderRadius: 99, overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min(100, daysLeft / 30 * 100)}%`, height: '100%', background: tone[1] }} />
                                    </div>
                                    <button className="rv-btn s" style={{ justifyContent: 'center' }} disabled={isBusy(`sub-${student.id}`)} onClick={() => extendSubscription(student)}>
                                        {isBusy(`sub-${student.id}`) ? 'Uzaytirilmoqda…' : '+30 kun uzaytirish'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
}
