import { useState, useEffect, useCallback } from 'react';
import { S } from '../../lib/storage';
import { apiRequest } from '../../lib/auth';

export const LEVELS = [
    'Beginner',
    'Elementary',
    'Pre-Intermediate',
    'Intermediate',
    'Upper-Intermediate',
    'IELTS',
];

// Light field style (overrides dark global .fi and browser autofill color)
const FIELD = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #D9DCE3',
    backgroundColor: '#fff',
    color: '#12131A',
    fontFamily: 'inherit',
    fontSize: 13,
    outline: 'none',
    boxShadow: '0 0 0 1000px #fff inset',
    WebkitTextFillColor: '#12131A',
};

const In = ({ v, f, p, t = 'text' }) => (
    <input
        className="fi"
        type={t}
        placeholder={p}
        value={v}
        onChange={e => f(e.target.value)}
        style={{ ...FIELD, marginBottom: 6 }}
    />
);

const Lv = ({ v, f }) => (
    <select
        className="fi"
        value={v}
        onChange={e => f(e.target.value)}
        style={{ ...FIELD, marginBottom: 6 }}
    >
        {LEVELS.map(level => (
            <option key={level} value={level}>
                {level}
            </option>
        ))}
    </select>
);

export default function People({ view = 'groups' }) {
    const [groups, setGroups] = useState(S.get('groups') || []);
    const [students, setStudents] = useState(S.get('students') || []);
    const [hws, setHws] = useState(S.get('homeworks') || []);

    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const [g, setG] = useState({
        name: '',
        level: LEVELS[0],
        days: '',
    });

    const [s, setS] = useState({
        name: '',
        phone: '',
        groupId: '',
        username: '',
        password: '',
    });

    // Homework is assigned to a specific group, not just a level.
    const [h, setH] = useState({
        title: '',
        level: '',
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [groupData, studentData, homeworkData] =
                await Promise.all([
                    apiRequest('/groups'),
                    apiRequest('/students'),
                    apiRequest('/homeworks'),
                ]);

            const nextGroups = Array.isArray(groupData)
                ? groupData
                : groupData.results || [];

            const nextStudents = Array.isArray(studentData)
                ? studentData
                : studentData.results || [];

            const nextHws = Array.isArray(homeworkData)
                ? homeworkData
                : homeworkData.results || [];

            setGroups(nextGroups);
            setStudents(nextStudents);
            setHws(nextHws);

            S.set('groups', nextGroups);
            S.set('students', nextStudents);
            S.set('homeworks', nextHws);
        } catch (err) {
            setError(
                `Ma'lumotlarni yuklashda xatolik: ${err.message}`
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // GROUPS

    const addG = async () => {
        if (!g.name.trim()) {
            alert('Guruh nomini kiriting.');
            return;
        }

        if (busy) return;

        setBusy(true);
        setError('');

        try {
            await apiRequest('/groups', {
                method: 'POST',
                body: JSON.stringify({
                    name: g.name.trim(),
                    level: g.level,
                    days: g.days.trim(),
                }),
            });

            setG({
                name: '',
                level: LEVELS[0],
                days: '',
            });

            await loadData();
        } catch (err) {
            setError(`Guruh yaratilmadi: ${err.message}`);
        } finally {
            setBusy(false);
        }
    };

    const editG = async group => {
        const name = prompt('Guruh nomi:', group.name);
        if (name === null) return;

        const days = prompt(
            'Dars kunlari (Mon,Wed,Fri):',
            group.days || ''
        );

        if (days === null) return;
        if (busy) return;

        setBusy(true);
        setError('');

        try {
            await apiRequest(
                `/groups/${encodeURIComponent(group.id)}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        name: name.trim() || group.name,
                        days,
                    }),
                }
            );

            await loadData();
        } catch (err) {
            setError(
                `Guruhni yangilashda xatolik: ${err.message}`
            );
        } finally {
            setBusy(false);
        }
    };

    // STUDENTS

    const addS = async () => {
        const name = s.name.trim();
        const username = s.username.trim();

        const group = groups.find(
            item => String(item.id) === String(s.groupId)
        );

        if (!name || !username || s.password.length < 4 || !group) {
            alert(
                'Ism, login, parol (kamida 4 belgi) va guruhni kiriting.'
            );
            return;
        }

        if (
            students.some(
                item =>
                    String(item.username).toLowerCase() ===
                    username.toLowerCase()
            )
        ) {
            alert('Bu login band.');
            return;
        }

        if (busy) return;

        setBusy(true);
        setError('');

        try {
            await apiRequest('/students', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    phone: s.phone.trim(),
                    username,
                    password: s.password,
                    groupId: group.id,
                }),
            });

            setS(prev => ({
                name: '',
                phone: '',
                groupId: prev.groupId,
                username: '',
                password: '',
            }));

            await loadData();
            loadRatings();

            alert("O'quvchi muvaffaqiyatli yaratildi.");
        } catch (err) {
            setError(`O'quvchi yaratilmadi: ${err.message}`);
        } finally {
            setBusy(false);
        }
    };

    const editS = async student => {
        const name = prompt('Ism:', student.name);
        if (name === null) return;

        const phone = prompt('Telefon:', student.phone || '');
        if (phone === null) return;

        const password = prompt(
            "Yangi parol (bo'sh qoldirilsa, o'zgarmaydi):"
        );

        if (password === null) return;

        if (password && password.length < 4) {
            alert('Parol kamida 4 belgidan iborat bo‘lishi kerak.');
            return;
        }

        const currentGroupId =
            student.groupId ?? student.group_id;

        const currentGroup = groups.find(
            item => String(item.id) === String(currentGroupId)
        );

        const groupName = prompt(
            'Guruh nomi:',
            currentGroup?.name || ''
        );

        if (groupName === null) return;

        const group = groups.find(
            item =>
                item.name.toLowerCase() ===
                groupName.trim().toLowerCase()
        );

        if (!group) {
            alert('Bunday guruh topilmadi.');
            return;
        }

        const payload = {
            name: name.trim() || student.name,
            phone,
            groupId: group.id,
        };

        if (password) {
            payload.password = password;
        }

        if (busy) return;

        setBusy(true);
        setError('');

        try {
            await apiRequest(
                `/students/${encodeURIComponent(student.id)}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                }
            );

            await loadData();
        } catch (err) {
            setError(
                `O'quvchini yangilashda xatolik: ${err.message}`
            );
        } finally {
            setBusy(false);
        }
    };

    // HOMEWORK: ASSIGN TO ONE SPECIFIC GROUP

    const addH = async () => {
        const title = h.title.trim();

        if (!title) {
            alert('Vazifa nomini kiriting.');
            return;
        }

        if (!h.level) {
            alert('Vazifa uchun darajani tanlang.');
            return;
        }

        if (busy) return;

        setBusy(true);
        setError('');

        try {
            // Darajaga beriladi: shu darajadagi barcha guruhlar uchun umumiy
            await apiRequest('/homeworks', {
                method: 'POST',
                body: JSON.stringify({ title, level: h.level }),
            });

            const n = groups.filter(gr => gr.level === h.level).length;
            setH(prev => ({ title: '', level: prev.level }));

            await loadData();
            window.dispatchEvent(new Event('mys:homeworks'));

            alert(`Vazifa ${h.level} darajasidagi barcha guruhlarga (${n} ta) berildi.`);
        } catch (err) {
            setError(`Vazifa yaratilmadi: ${err.message}`);
        } finally {
            setBusy(false);
        }
    };

    // DELETE GROUPS, STUDENTS, HOMEWORK

    const del = async (kind, item) => {
        if (
            !confirm(
                `${item.name || item.title} o'chirilsinmi?`
            )
        ) {
            return;
        }

        if (busy) return;

        const endpoint = {
            groups: '/groups',
            students: '/students',
            homeworks: '/homeworks',
        }[kind];

        if (!endpoint) return;

        setBusy(true);
        setError('');

        try {
            await apiRequest(
                `${endpoint}/${encodeURIComponent(item.id)}`,
                {
                    method: 'DELETE',
                }
            );

            await loadData();
            if (kind === 'homeworks') window.dispatchEvent(new Event('mys:homeworks'));
        } catch (err) {
            setError(`O'chirishda xatolik: ${err.message}`);
        } finally {
            setBusy(false);
        }
    };


    // --- ESKI VERSIYADAGIDEK: avval guruh kartalari, guruhga kirsangiz — o'quvchilar ---
    const [activeLevel, setActiveLevel] = useState(LEVELS[0]);
    const [openId, setOpenId] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [ratings, setRatings] = useState({});

    const loadRatings = useCallback(() => {
        if (view !== 'groups') return;
        apiRequest('/rating')
            .then(list => {
                const m = {};
                (Array.isArray(list) ? list : []).forEach(r => { if (r?.student?.id != null) m[r.student.id] = r; });
                setRatings(m);
            })
            .catch(() => {});
    }, [view]);

    useEffect(() => { loadRatings(); }, [loadRatings]);

    const gid = st => String(st.groupId ?? st.group_id ?? '');
    const filteredGroups = groups.filter(group => group.level === activeLevel);
    const noGroup = students.filter(st => !gid(st) || !groups.some(gr => String(gr.id) === gid(st)));
    const avgOf = list => {
        const v = list.map(st => ratings[st.id]?.avg).filter(x => x > 0);
        return v.length ? Math.round(v.reduce((x, y) => x + y, 0) / v.length) : null;
    };

    const BTN = { padding: '9px 16px', backgroundColor: '#5B4BFF', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 };
    const BTN_G = { ...BTN, backgroundColor: '#fff', color: '#12131A', border: '1px solid #E3E5EA' };
    const ICON_BTN = { padding: '4px 8px', fontSize: 13, background: '#F4F5F7', border: 'none', borderRadius: 8, cursor: 'pointer' };
    const PAGE = { width: '100%', boxSizing: 'border-box', padding: 0, fontFamily: "'Onest', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif", color: '#12131A' };

    const errorBox = error && (
        <div className="card" role="alert" style={{ color: 'var(--danger)', overflowWrap: 'anywhere', marginBottom: 16, padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: 13 }}>
            {error}
            <button className="btn" style={{ marginLeft: 8 }} onClick={loadData} disabled={loading || busy}>Qayta yuklash</button>
        </div>
    );

    // ── "Uy vazifa" bo'limi: vazifalar ro'yxati va yangi vazifa berish
    if (view === 'homework') {
        return (
            <div style={{ ...PAGE, padding: '20px 24px 0' }}>
                {errorBox}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 2px 0' }}>Vazifalar</h1>
                        <p style={{ color: '#5B6070', margin: 0, fontSize: 13 }}>Vazifa darajaga beriladi — shu darajadagi barcha guruhlarga umumiy</p>
                    </div>
                    <button style={BTN} onClick={() => setShowAdd(v => !v)}>{showAdd ? 'Yopish' : "+ Vazifa qo'shish"}</button>
                </div>
                {showAdd && (
                    <div style={{ backgroundColor: '#fff', border: '1px solid #E3E5EA', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <div style={{ marginBottom: 12 }}>
                            <In v={h.title} f={value => setH(prev => ({ ...prev, title: value }))} p="Vazifa nomi" />
                        </div>
                        <select className="fi" style={{ ...FIELD, marginBottom: 8 }} value={h.level} onChange={event => setH(prev => ({ ...prev, level: event.target.value }))}>
                            <option value="">— Darajani tanlang —</option>
                            {LEVELS.map(level => {
                                const n = groups.filter(gr => gr.level === level).length;
                                return (
                                    <option key={level} value={level}>
                                        {level} ({n} ta guruh, {students.filter(st => st.level === level).length} o'quvchi)
                                    </option>
                                );
                            })}
                        </select>
                        {h.level && (
                            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#5B6070' }}>
                                Vazifa {h.level} darajasidagi barcha guruhlarga beriladi:{' '}
                                {groups.filter(gr => gr.level === h.level).map(gr => gr.name).join(', ') || "hali guruh yo'q"}
                            </p>
                        )}
                        <button style={BTN} onClick={addH} disabled={busy || loading}>
                            {busy ? 'Kutilmoqda...' : '📚 Darajaga vazifa berish'}
                        </button>
                    </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: '#5B6070', margin: '6px 0 8px' }}>Vazifalar ro'yxati ({hws.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {hws.map(homework => {
                        const group = groups.find(item => String(item.id) === String(homework.groupId ?? homework.group_id));
                        return (
                            <div key={homework.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #E3E5EA', borderRadius: 12, padding: '10px 16px' }}>
                                <div>
                                    <div style={{ fontWeight: 500, fontSize: 14 }}>{homework.title}</div>
                                    <div style={{ fontSize: 12, color: '#5B6070' }}>
                                        {homework.level} · {homework.groupName || group?.name || `barcha guruhlar (${groups.filter(gr => gr.level === homework.level).length})`}
                                    </div>
                                </div>
                                <button disabled={busy} onClick={() => del('homeworks', homework)} style={ICON_BTN}>🗑️</button>
                            </div>
                        );
                    })}
                    {!hws.length && !loading && <div style={{ fontSize: 13, color: '#6B7080' }}>Hali vazifa yo'q.</div>}
                </div>
            </div>
        );
    }

    const openGroup = openId === 'none'
        ? { id: 'none', name: "Guruhsiz o'quvchilar", level: '', days: '' }
        : groups.find(gr => String(gr.id) === String(openId));

    // ── Guruh ichi: faqat shu guruh o'quvchilari
    if (openGroup) {
        const list = (openGroup.id === 'none' ? noGroup : students.filter(st => gid(st) === String(openGroup.id)))
            .map(st => ({ ...st, r: ratings[st.id] || {} }))
            .sort((x, y) => (y.r.score || 0) - (x.r.score || 0));
        const canAdd = openGroup.id !== 'none';
        const startAdd = () => { setS(prev => ({ ...prev, groupId: String(openGroup.id) })); setShowAdd(true); };
        return (
            <div style={PAGE}>
                <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E3E5EA', padding: '18px 24px 14px' }}>
                    <button onClick={() => { setOpenId(null); setShowAdd(false); }} style={{ ...ICON_BTN, marginBottom: 10, fontWeight: 600, fontFamily: 'inherit' }}>
                        ← {openGroup.level ? `${openGroup.level} guruhlari` : 'Guruhlar'}
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px 0' }}>{openGroup.name}</h1>
                            <div style={{ fontSize: 13, color: '#5B6070' }}>
                                {openGroup.level && <span style={{ background: '#ECEAFF', color: '#5B4BFF', padding: '2px 8px', borderRadius: 99, fontWeight: 600, fontSize: 12 }}>{openGroup.level}</span>}
                                {openGroup.days ? ` · ${openGroup.days}` : ''} · {list.length} o'quvchi
                            </div>
                        </div>
                        {canAdd && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button style={BTN_G} disabled={busy} onClick={() => editG(openGroup)}>✏️ Guruhni tahrirlash</button>
                                <button style={BTN} onClick={() => (showAdd ? setShowAdd(false) : startAdd())}>{showAdd ? 'Yopish' : "+ Talaba qo'shish"}</button>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ padding: 24 }}>
                    {errorBox}
                    {showAdd && canAdd && (
                        <div style={{ backgroundColor: '#fff', border: '1px solid #E3E5EA', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
                                <In v={s.name} f={value => setS(prev => ({ ...prev, name: value }))} p="Ism Familya" />
                                <In v={s.phone} f={value => setS(prev => ({ ...prev, phone: value }))} p="Telefon" />
                                <In v={s.username} f={value => setS(prev => ({ ...prev, username: value }))} p="Login" />
                                <In v={s.password} f={value => setS(prev => ({ ...prev, password: value }))} p="Parol" t="password" />
                            </div>
                            <button style={BTN} onClick={addS} disabled={busy}>{busy ? 'Kutilmoqda...' : "➕ O'quvchi qo'shish"}</button>
                        </div>
                    )}

                    {list.length ? (
                        <div style={{ backgroundColor: '#fff', border: '1px solid #E3E5EA', borderRadius: 12, overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: '#6B7080', fontSize: 12 }}>
                                        {['Reyting', "O'quvchi", 'Telefon', 'Login', 'Reyting bali', "O'rtacha", ''].map(hd => (
                                            <th key={hd} style={{ padding: '10px 14px', borderBottom: '1px solid #E3E5EA', fontWeight: 600, whiteSpace: 'nowrap' }}>{hd}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.map((st, i) => (
                                        <tr key={st.id} style={{ borderBottom: '1px solid #F0F1F4' }}>
                                            <td style={{ padding: '10px 14px', fontSize: i < 3 ? 16 : 13 }}>{['🥇', '🥈', '🥉'][i] || `#${i + 1}`}</td>
                                            <td style={{ padding: '10px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>{st.name}</td>
                                            <td style={{ padding: '10px 14px', color: '#6B7080', whiteSpace: 'nowrap' }}>{st.phone || '—'}</td>
                                            <td style={{ padding: '10px 14px', color: '#6B7080' }}><code>{st.username}</code></td>
                                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#5B4BFF' }}>{st.r.score ?? '—'}</td>
                                            <td style={{ padding: '10px 14px' }}>{st.r.avg ? `${st.r.avg}%` : '—'}</td>
                                            <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                                                <button disabled={busy} onClick={() => editS(st)} style={ICON_BTN}>✏️</button>{' '}
                                                <button disabled={busy} onClick={() => del('students', st)} style={ICON_BTN}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6B7080', fontSize: 14 }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                            Bu guruhda hali o'quvchi yo'q.
                            {canAdd && !showAdd && (
                                <div style={{ marginTop: 14 }}><button style={BTN} onClick={startAdd}>+ Birinchi o'quvchini qo'shish</button></div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Guruh kartalari
    const card = { border: '1px solid #E3E5EA', borderRadius: 14, padding: 14, backgroundColor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 110, cursor: 'pointer', position: 'relative', transition: 'transform .15s, box-shadow .15s' };
    const hover = e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(18,19,26,.08)'; };
    const unhover = e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; };

    return (
        <div style={PAGE}>
            <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E3E5EA', padding: '24px 24px 14px' }}>
                <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 2px 0' }}>Guruhlar</h1>
                <p style={{ color: '#5B6070', margin: 0, fontSize: 13 }}>Guruhni bosing — ichiga kirasiz</p>
            </div>

            <div style={{ padding: '24px' }}>
                {errorBox}
                {loading && <p style={{ fontSize: 13, color: '#5B6070' }}>Ma'lumotlar yuklanmoqda...</p>}

                <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #E3E5EA', marginBottom: 14, overflowX: 'auto' }}>
                    {LEVELS.map(level => (
                        <button key={level} onClick={() => setActiveLevel(level)}
                            style={{ background: 'none', border: 'none', padding: '0 0 10px', marginBottom: -1, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: activeLevel === level ? 600 : 400, color: activeLevel === level ? '#12131A' : '#5B6070', borderBottom: activeLevel === level ? '2px solid #12131A' : '2px solid transparent', whiteSpace: 'nowrap' }}>
                            {level}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
                    {filteredGroups.map(group => {
                        const gs = students.filter(st => gid(st) === String(group.id));
                        const avg = avgOf(gs);
                        return (
                            <div key={group.id} style={card} onClick={() => setOpenId(group.id)} onMouseEnter={hover} onMouseLeave={unhover}>
                                <div>
                                    <div style={{ fontSize: 22, marginBottom: 6 }}>📚</div>
                                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{group.name}</div>
                                    <div style={{ fontSize: 12, color: '#5B6070' }}>{group.days || 'Vaqt belgilanmagan'}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: '#6B7080' }}>
                                    {gs.length} ta o'quvchi
                                    {avg !== null && <span style={{ background: '#DCFCE7', color: '#15803D', padding: '1px 7px', borderRadius: 99, fontWeight: 700, fontSize: 11 }}>{avg}%</span>}
                                </div>
                                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
                                    <button disabled={busy} title="Tahrirlash" onClick={e => { e.stopPropagation(); editG(group); }} style={ICON_BTN}>✏️</button>
                                    <button disabled={busy} title="O'chirish" onClick={e => { e.stopPropagation(); del('groups', group); }} style={ICON_BTN}>🗑️</button>
                                </div>
                            </div>
                        );
                    })}

                    <div
                        onClick={() => {
                            const name = prompt('Guruh nomi:');
                            if (name === null) return;
                            const days = prompt('Dars kunlari (Mon,Wed,Fri):', '');
                            if (days === null) return;
                            setG({ name: name.trim(), level: activeLevel, days: days.trim() });
                            setTimeout(() => { const btn = document.getElementById('hidden-add-g'); if (btn) btn.click(); }, 100);
                        }}
                        style={{ ...card, border: '1.5px dashed #D9DCE3', alignItems: 'center', justifyContent: 'center', color: '#6B7080' }}
                    >
                        <div style={{ fontSize: 22, marginBottom: 6, lineHeight: 1 }}>+</div>
                        <div style={{ fontSize: 13 }}>Yangi guruh</div>
                    </div>
                </div>

                <button id="hidden-add-g" onClick={addG} style={{ display: 'none' }} disabled={busy} />

                {filteredGroups.length === 0 && !loading && (
                    <div style={{ backgroundColor: '#eef6fb', border: '1px solid #1f6f9f', color: '#0c5a85', padding: '10px 12px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
                        Bu daraja uchun guruh yo'q. Yuqoridagi + Yangi guruh kartani bosing!
                    </div>
                )}

                {noGroup.length > 0 && (
                    <div style={{ ...card, minHeight: 0, flexDirection: 'row', alignItems: 'center', background: '#FFFBEB', borderColor: '#FDE68A', maxWidth: 420 }}
                        onClick={() => setOpenId('none')} onMouseEnter={hover} onMouseLeave={unhover}>
                        ⚠️ Guruhsiz o'quvchilar: <b style={{ marginLeft: 4 }}>{noGroup.length}</b>
                        <span style={{ marginLeft: 'auto', color: '#B45309', fontWeight: 600 }}>Ko'rish →</span>
                    </div>
                )}
            </div>
        </div>
    );
}
