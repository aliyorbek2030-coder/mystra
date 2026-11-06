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
    border: '1px solid #D4D4D8',
    backgroundColor: '#fff',
    color: '#18181B',
    fontFamily: 'inherit',
    fontSize: 13,
    outline: 'none',
    boxShadow: '0 0 0 1000px #fff inset',
    WebkitTextFillColor: '#18181B',
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

export default function People() {
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
        groupId: '',
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

            setS({
                name: '',
                phone: '',
                groupId: '',
                username: '',
                password: '',
            });

            await loadData();

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

        if (!h.groupId) {
            alert('Vazifa uchun guruh tanlang.');
            return;
        }

        const selectedGroup = groups.find(
            group => String(group.id) === String(h.groupId)
        );

        if (!selectedGroup) {
            alert(
                "Tanlangan guruh topilmadi. Guruhlar ro'yxatini yangilang."
            );
            return;
        }

        if (busy) return;

        setBusy(true);
        setError('');

        try {
            // Django must save this homework with the selected group.
            await apiRequest('/homeworks', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    groupId: selectedGroup.id,
                }),
            });

            setH({
                title: '',
                groupId: '',
            });

            await loadData();

            alert(
                `Vazifa "${selectedGroup.name}" guruhiga muvaffaqiyatli berildi.`
            );
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
        } catch (err) {
            setError(`O'chirishda xatolik: ${err.message}`);
        } finally {
            setBusy(false);
        }
    };

    const wipe = () => {
        alert(
            "Serverdagi barcha o'quvchilarni xavfsiz o'chirish uchun " +
            "alohida ommaviy o'chirish endpointi kerak. " +
            "Bu tugma hozircha server ma'lumotlarini o'chirmaydi."
        );
    };

    // --- NEW DESIGN LOGIC: LEVEL TABS ---
    const [activeLevel, setActiveLevel] = useState(LEVELS[0]);
    const filteredGroups = groups.filter(
        group => group.level === activeLevel
    );

    return (
        <div
            style={{
                width: '100%',
                maxWidth: 'none',
                margin: 0,
                boxSizing: 'border-box',
                padding: 0,
                fontFamily: "'Onest', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
                color: '#18181B',
                backgroundColor: '#F4F4F5',
                minHeight: '100vh',
            }}
        >
            {/* Header (white top bar) */}
            <div
                style={{
                    backgroundColor: '#fff',
                    borderBottom: '1px solid #E4E4E7',
                    padding: '24px 24px 14px',
                }}
            >
                <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 2px 0', color: '#18181B' }}>Guruhlar</h1>
                <p style={{ color: '#71717A', margin: 0, fontSize: 13 }}>Guruhni bosing — ichiga kirasiz</p>
            </div>

            <div style={{ padding: '24px' }}>
                {error && (
                    <div
                        className="card"
                        role="alert"
                        style={{
                            color: 'var(--danger)',
                            overflowWrap: 'anywhere',
                            marginBottom: 16,
                            padding: '12px 14px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: 10,
                            fontSize: 13,
                        }}
                    >
                        {error}
                        <button
                            className="btn"
                            style={{ marginLeft: 8 }}
                            onClick={loadData}
                            disabled={loading || busy}
                        >
                            Qayta yuklash
                        </button>
                    </div>
                )}

                {loading && <p style={{ fontSize: 13, color: '#71717A' }}>Ma'lumotlar yuklanmoqda...</p>}

                {/* Level Tabs */}
                <div style={{
                    display: 'flex',
                    gap: 24,
                    borderBottom: '1px solid #E4E4E7',
                    marginBottom: 14,
                    overflowX: 'auto'
                }}>
                    {LEVELS.map(level => (
                        <button
                            key={level}
                            onClick={() => setActiveLevel(level)}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '0 0 10px',
                                marginBottom: -1,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 13,
                                fontWeight: activeLevel === level ? 500 : 400,
                                color: activeLevel === level ? '#18181B' : '#71717A',
                                borderBottom: activeLevel === level ? '2px solid #18181B' : '2px solid transparent',
                                transition: 'color 0.15s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {level}
                        </button>
                    ))}
                </div>

                {/* Group List (Filtered by Level) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(194px, 194px))', gap: 14, marginBottom: 16 }}>
                    {filteredGroups.map(group => (
                        <div
                            key={group.id}
                            style={{
                                border: '1px solid #E4E4E7',
                                borderRadius: 12,
                                padding: 14,
                                backgroundColor: '#fff',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                minHeight: 87
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: '#18181B' }}>{group.name}</div>
                                <div style={{ fontSize: 12, color: '#71717A', marginBottom: 2 }}>{group.days || "Kunlar belgilanmagan"}</div>
                                <div style={{ fontSize: 12, color: '#71717A' }}>
                                    {students.filter(
                                        student =>
                                            String(student.groupId ?? student.group_id) === String(group.id)
                                    ).length}{' '}
                                    o'quvchi
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
                                <button className="btn" disabled={busy} onClick={() => editG(group)} style={{ padding: '3px 8px', fontSize: 13, background: '#F4F4F5', border: 'none', borderRadius: 8, cursor: 'pointer' }}>✏️</button>
                                <button className="btn" disabled={busy} onClick={() => del('groups', group)} style={{ padding: '3px 8px', fontSize: 13, background: '#F4F4F5', border: 'none', borderRadius: 8, cursor: 'pointer' }}>🗑️</button>
                            </div>
                        </div>
                    ))}

                    {/* Add New Group Card */}
                    <div
                        onClick={() => {
                            const name = prompt('Guruh nomi:');
                            if (name === null) return;
                            const days = prompt('Dars kunlari (Mon,Wed,Fri):', '');
                            if (days === null) return;

                            setG({ name: name.trim(), level: activeLevel, days: days.trim() });
                            setTimeout(() => {
                                const btn = document.getElementById('hidden-add-g');
                                if (btn) btn.click();
                            }, 100);
                        }}
                        style={{
                            border: '1.5px dashed #D4D4D8',
                            borderRadius: 12,
                            padding: 14,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#71717A',
                            minHeight: 87,
                            transition: 'border-color 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#71717A';
                            e.currentTarget.style.color = '#52525B';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = '#D4D4D8';
                            e.currentTarget.style.color = '#71717A';
                        }}
                    >
                        <div style={{ fontSize: 20, marginBottom: 6, lineHeight: 1 }}>+</div>
                        <div style={{ fontSize: 13 }}>Yangi guruh</div>
                    </div>
                </div>

                {/* Hidden Add Group Trigger */}
                <button id="hidden-add-g" onClick={addG} style={{ display: 'none' }} disabled={busy} />

                {/* Empty State */}
                {filteredGroups.length === 0 && !loading && (
                    <div style={{
                        backgroundColor: '#eef6fb',
                        border: '1px solid #1f6f9f',
                        color: '#0c5a85',
                        padding: '10px 12px',
                        borderRadius: 10,
                        fontSize: 13,
                        marginBottom: 24
                    }}>
                        Bu daraja uchun guruh yo'q. Yuqoridagi + Yangi guruh kartani bosing!
                    </div>
                )}

                {/* --- REST OF THE SECTIONS (STUDENTS, HOMEWORK) --- */}

                <div style={{ marginTop: 40 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#18181B' }}>O'quvchilar ({students.length})</h2>
                    <div style={{ backgroundColor: '#fff', border: '1px solid #E4E4E7', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <In v={s.name} f={value => setS(prev => ({ ...prev, name: value }))} p="Ism Familya" />
                            <In v={s.phone} f={value => setS(prev => ({ ...prev, phone: value }))} p="Telefon" />
                        </div>
                        <select
                            className="fi"
                            style={{ ...FIELD, marginBottom: 12 }}
                            value={s.groupId}
                            onChange={event => setS(prev => ({ ...prev, groupId: event.target.value }))}
                        >
                            <option value="">Guruhni tanlang</option>
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>{group.name} — {group.level}</option>
                            ))}
                        </select>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <In v={s.username} f={value => setS(prev => ({ ...prev, username: value }))} p="Login" />
                            <In v={s.password} f={value => setS(prev => ({ ...prev, password: value }))} p="Parol" t="password" />
                        </div>
                        <button className="btn btn-p" onClick={addS} disabled={busy} style={{ padding: '9px 18px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>
                            {busy ? 'Kutilmoqda...' : "➕ O'quvchi qo'shish"}
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {students.map(student => {
                            const group = groups.find(item => String(item.id) === String(student.groupId ?? student.group_id));
                            return (
                                <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #E4E4E7', borderRadius: 12, padding: '12px 16px' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: 14 }}>{student.name}</div>
                                        <div style={{ fontSize: 12, color: '#71717A' }}>
                                            {student.level} · {group?.name || 'Guruh belgilanmagan'} · {student.phone}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#71717A', marginTop: 2 }}>Login: {student.username}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn" disabled={busy} onClick={() => editS(student)} style={{ padding: '5px 9px', background: '#F4F4F5', border: 'none', borderRadius: 8, cursor: 'pointer' }}>✏️</button>
                                        <button className="btn" disabled={busy} onClick={() => del('students', student)} style={{ padding: '5px 9px', background: '#F4F4F5', border: 'none', borderRadius: 8, cursor: 'pointer' }}>🗑️</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ marginTop: 40, marginBottom: 40 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#18181B' }}>Vazifa berish — guruh bo'yicha</h2>
                    <div style={{ backgroundColor: '#fff', border: '1px solid #E4E4E7', borderRadius: 12, padding: 16 }}>
                        <div style={{ marginBottom: 12 }}>
                            <In v={h.title} f={value => setH(prev => ({ ...prev, title: value }))} p="Vazifa nomi" />
                        </div>
                        <select
                            className="fi"
                            style={{ ...FIELD, marginBottom: 12 }}
                            value={h.groupId}
                            onChange={event => setH(prev => ({ ...prev, groupId: event.target.value }))}
                        >
                            <option value="">— Vazifa beriladigan guruhni tanlang —</option>
                            {groups.map(group => {
                                const count = students.filter(student => String(student.groupId ?? student.group_id) === String(group.id)).length;
                                return (
                                    <option key={group.id} value={group.id}>{group.name} — {group.level} ({count} o'quvchi)</option>
                                );
                            })}
                        </select>
                        {h.groupId && (
                            <p style={{ margin: '4px 0 12px', fontSize: 13, color: '#71717A' }}>
                                {(() => {
                                    const selected = groups.find(group => String(group.id) === String(h.groupId));
                                    const count = students.filter(student => String(student.groupId ?? student.group_id) === String(h.groupId)).length;
                                    return selected ? `Tanlangan guruh: ${selected.name}. ${count} nafar o'quvchi.` : '';
                                })()}
                            </p>
                        )}
                        <button className="btn btn-p" onClick={addH} disabled={busy || loading || groups.length === 0} style={{ padding: '9px 18px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>
                            {busy ? 'Kutilmoqda...' : "📚 Tanlangan guruhga vazifa berish"}
                        </button>
                        {groups.length === 0 && !loading && <p style={{ marginTop: 8, fontSize: 13, color: '#DC2626' }}>Avval kamida bitta guruh yarating.</p>}
                    </div>
                </div>

                <div>
                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#18181B' }}>Berilgan vazifalar ({hws.length})</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {hws.map(homework => {
                            const group = groups.find(item => String(item.id) === String(homework.groupId ?? homework.group_id));
                            return (
                                <div key={homework.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #E4E4E7', borderRadius: 12, padding: '12px 16px' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: 14 }}>{homework.title}</div>
                                        <div style={{ fontSize: 12, color: '#71717A' }}>
                                            {homework.groupName || group?.name || 'Guruh belgilanmagan'} · {homework.level}
                                        </div>
                                    </div>
                                    <button className="btn" disabled={busy} onClick={() => del('homeworks', homework)} style={{ padding: '5px 9px', background: '#F4F4F5', border: 'none', borderRadius: 8, cursor: 'pointer' }}>🗑️</button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button
                    className="btn"
                    style={{
                        width: '100%',
                        marginTop: 32,
                        padding: '12px',
                        backgroundColor: '#fef2f2',
                        color: '#DC2626',
                        border: '1px solid #fecaca',
                        borderRadius: 12,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 13,
                        fontWeight: 500,
                    }}
                    onClick={wipe}
                    disabled={busy}
                >
                    ⚠️ Barcha o'quvchilarni o'chirish
                </button>
            </div>
        </div>
    );
}