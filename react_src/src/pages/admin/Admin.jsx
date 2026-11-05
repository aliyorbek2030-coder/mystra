import { useCallback, useEffect, useState } from 'react';
import { S } from '../../lib/storage';
import { apiRequest } from '../../lib/auth';

export default function Admin() {
    const [, refresh] = useState(0);
    const R = () => refresh(x => x + 1);

    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [f, setF] = useState({
        name: '',
        username: '',
        password: '',
    });

    const loadTeachers = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const data = await apiRequest('/teachers');
            setTeachers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(`O'qituvchilarni yuklashda xatolik: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTeachers();
    }, [loadTeachers]);

    const stat = [
        ["O'quvchilar", (S.get('students') || []).length],
        ["O'qituvchilar", teachers.length],
        ['Sertifikatlar', (S.get('certificates') || []).length],
        ['Topshirilgan ishlar', (S.get('submissions') || []).length],
    ];

    const add = async () => {
        const name = f.name.trim();
        const username = f.username.trim();
        const password = f.password;

        if (!name || !username || password.length < 4) {
            alert('Ism, login va kamida 4 belgili parol kiriting.');
            return;
        }

        if (busy) return;

        setBusy(true);
        setError('');

        try {
            await apiRequest('/teachers', {
                method: 'POST',
                body: JSON.stringify({ name, username, password }),
            });

            setF({ name: '', username: '', password: '' });
            await loadTeachers();
            alert("O'qituvchi muvaffaqiyatli yaratildi.");
        } catch (err) {
            setError(`O'qituvchi yaratilmadi: ${err.message}`);
        } finally {
            setBusy(false);
        }
    };

    const edit = async teacher => {
        const name = prompt('Ism:', teacher.name);
        if (name === null) return;

        const password = prompt(
            "Yangi parol (bo'sh qoldirilsa, o'zgarmaydi):"
        );
        if (password === null) return;

        if (password && password.length < 4) {
            alert('Parol kamida 4 belgidan iborat bo‘lishi kerak.');
            return;
        }

        const payload = {};
        if (name.trim()) payload.name = name.trim();
        if (password) payload.password = password;

        if (!Object.keys(payload).length) return;

        setBusy(true);
        setError('');

        try {
            await apiRequest(`/teachers/${encodeURIComponent(teacher.id)}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });

            await loadTeachers();
        } catch (err) {
            setError(`O'qituvchini yangilashda xatolik: ${err.message}`);
        } finally {
            setBusy(false);
        }
    };

    const del = async teacher => {
        if (!confirm(`${teacher.name} o'chirilsinmi?`)) return;
        if (busy) return;

        setBusy(true);
        setError('');

        try {
            await apiRequest(`/teachers/${encodeURIComponent(teacher.id)}`, {
                method: 'DELETE',
            });

            await loadTeachers();
        } catch (err) {
            setError(`O'qituvchini o'chirishda xatolik: ${err.message}`);
        } finally {
            setBusy(false);
        }
    };

    const wipe = () => {
        if (
            confirm("HAMMA o'quvchilarni o'chirish?") &&
            confirm("Aniq ishonchingiz komilmi? Bu qaytarilmaydi.")
        ) {
            S.set('students', []);
            S.set('hw_records', []);
            S.set('certificates', []);
            S.set('submissions', []);
            S.set('day_submits', []);
            R();
        }
    };

    return (
        <div className="wrap">
            <h3>Admin</h3>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                }}
            >
                {stat.map(([label, number]) => (
                    <div
                        className="card"
                        key={label}
                        style={{ textAlign: 'center', marginBottom: 0 }}
                    >
                        <div style={{ fontSize: 24, fontWeight: 800 }}>
                            {number}
                        </div>
                        <small>{label}</small>
                    </div>
                ))}
            </div>

            <h4>O'qituvchi qo'shish</h4>

            <div className="card">
                {['name', 'username', 'password'].map(key => (
                    <input
                        key={key}
                        className="fi"
                        style={{ marginBottom: 6 }}
                        type={key === 'password' ? 'password' : 'text'}
                        placeholder={{
                            name: 'Ism',
                            username: 'Login',
                            password: 'Parol',
                        }[key]}
                        value={f[key]}
                        disabled={busy}
                        onChange={event =>
                            setF(previous => ({
                                ...previous,
                                [key]: event.target.value,
                            }))
                        }
                    />
                ))}

                <button
                    className="btn btn-p"
                    onClick={add}
                    disabled={busy}
                >
                    {busy ? 'Kutilmoqda...' : "➕ O'qituvchi qo'shish"}
                </button>
            </div>

            {error && (
                <div
                    className="card"
                    role="alert"
                    style={{ color: 'var(--danger)', overflowWrap: 'anywhere' }}
                >
                    {error}
                </div>
            )}

            <h4>O'qituvchilar ro'yxati</h4>

            {loading ? (
                <p>Yuklanmoqda...</p>
            ) : teachers.length === 0 ? (
                <p>Hozircha o'qituvchilar yo'q.</p>
            ) : (
                teachers.map(teacher => (
                    <div
                        className="card"
                        key={teacher.id}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <span>
                            <b>{teacher.name}</b>
                            <br />
                            <small>{teacher.username}</small>
                        </span>

                        <span style={{ flexShrink: 0 }}>
                            <button
                                className="btn"
                                disabled={busy}
                                onClick={() => edit(teacher)}
                            >
                                ✏️
                            </button>{' '}
                            <button
                                className="btn"
                                disabled={busy}
                                onClick={() => del(teacher)}
                            >
                                🗑
                            </button>
                        </span>
                    </div>
                ))
            )}

            <button
                className="btn"
                style={{
                    width: '100%',
                    marginTop: 16,
                    color: 'var(--danger)',
                }}
                onClick={wipe}
            >
                ⚠️ Barcha o'quvchilarni o'chirish
            </button>
        </div>
    );
}