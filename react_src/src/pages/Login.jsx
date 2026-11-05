import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';

const API = 'http://127.0.0.1:8000/api';

// --- DESIGN ONLY (no logic) ---
const PAGE = {
    width: '100%',
    maxWidth: 'none',
    margin: 0,
    boxSizing: 'border-box',
    minHeight: '100vh',
    padding: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    color: '#111',
    backgroundColor: '#f7f7f6',
};

const CARD = {
    width: '100%',
    maxWidth: 400,
    boxSizing: 'border-box',
    backgroundColor: '#fff',
    border: '1px solid #e2e2e0',
    borderRadius: 12,
    padding: '28px 26px',
};

const LOGO = {
    fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
    fontStyle: 'italic',
    fontSize: 30,
    fontWeight: 500,
    margin: '0 0 4px',
    color: '#111',
    textAlign: 'center',
};

const SUB = {
    margin: '0 0 22px',
    fontSize: 13,
    color: '#8a8a88',
    textAlign: 'center',
};

const FIELD = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid #e2e2e0',
    backgroundColor: '#f5f5f3',
    color: '#111',
    fontFamily: 'inherit',
    fontSize: 14,
    outline: 'none',
    boxShadow: '0 0 0 1000px #f5f5f3 inset',
    WebkitTextFillColor: '#111',
};

const BTN_P = {
    width: '100%',
    padding: '11px 16px',
    backgroundColor: '#111',
    color: '#fff',
    border: '1px solid #111',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 500,
};

const BTN_S = {
    width: '100%',
    padding: '11px 16px',
    backgroundColor: '#fff',
    color: '#111',
    border: '1px solid #d4d4d2',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 500,
};

const Field = ({ k, l, type = 'text', f, set }) => (
    <div style={{ marginBottom: 10 }}>
        <input
            className="fi"
            type={type}
            placeholder={l}
            value={f[k]}
            onChange={set(k)}
            style={FIELD}
            autoComplete={
                k === 'password'
                    ? 'current-password'
                    : k === 'confirm'
                      ? 'new-password'
                      : k === 'username'
                        ? 'username'
                        : 'off'
            }
        />
    </div>
);

export default function Login() {
    const { login } = useAuth();

    const [mode, setMode] = useState('login');
    const [err, setErr] = useState('');
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(true);

    const [f, setF] = useState({
        name: '',
        phone: '',
        username: '',
        password: '',
        confirm: '',
        groupId: '',
    });

    const set = k => e =>
        setF(prev => ({
            ...prev,
            [k]: e.target.value,
        }));

    // Load real groups from Django instead of localStorage.
    useEffect(() => {
        let active = true;

        async function loadGroups() {
            setGroupsLoading(true);

            try {
                const response = await fetch(`${API}/groups/public`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        data.message ||
                        data.detail ||
                        'Guruhlarni yuklab bo‘lmadi.'
                    );
                }

                if (active) {
                    setGroups(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error('Loading groups failed:', error);

                if (active) {
                    setErr(
                        'Guruhlarni yuklab bo‘lmadi. Server ishlayotganini tekshiring.'
                    );
                }
            } finally {
                if (active) {
                    setGroupsLoading(false);
                }
            }
        }

        loadGroups();

        return () => {
            active = false;
        };
    }, []);

    async function signup(e) {
        e?.preventDefault();
        setErr('');

        const name = f.name.trim();
        const phone = f.phone.trim();
        const username = f.username.trim();
        const password = f.password;
        const groupId = f.groupId;

        const group = groups.find(
            g => String(g.id) === String(groupId)
        );

        if (
            !name ||
            !phone ||
            !username ||
            !password ||
            !f.confirm ||
            !group
        ) {
            setErr("Hamma maydonni to'ldiring.");
            return;
        }

        if (phone.replace(/\D/g, '').length < 9) {
            setErr('Telefon raqam noto‘g‘ri.');
            return;
        }

        if (password.length < 4) {
            setErr("Parol kamida 4 belgi bo'lsin.");
            return;
        }

        if (password !== f.confirm) {
            setErr('Parollar bir xil emas.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    phone,
                    username,
                    password,
                    groupId: group.id,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    data.detail ||
                    (response.status === 409
                        ? 'Bu login band.'
                        : "Ro'yxatdan o'tishda xatolik yuz berdi.")
                );
            }

            setErr('');
            setDone(true);
        } catch (error) {
            console.error('Signup failed:', error);

            setErr(
                error.message ||
                "Server bilan bog'lanishda xatolik yuz berdi."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleLogin(e) {
        e?.preventDefault();
        setErr('');

        const username = f.username.trim();
        const password = f.password;

        if (!username || !password) {
            setErr('Login va parolni kiriting.');
            return;
        }

        setLoading(true);

        try {
            const error = await login(username, password);

            if (error) {
                setErr(
                    typeof error === 'string'
                        ? error
                        : error.message || 'Login yoki parol noto‘g‘ri.'
                );
            }
        } catch (error) {
            console.error('Login failed:', error);

            setErr(
                error.message ||
                'Kirishda xatolik yuz berdi.'
            );
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <div style={PAGE}>
                <div style={CARD}>
                    <h2 style={LOGO}>mystra</h2>

                    <div style={{ textAlign: 'center', margin: '18px 0 6px', fontSize: 34 }}>✅</div>

                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        <b style={{ fontSize: 16 }}>So'rov yuborildi ✓</b>
                    </div>

                    <p
                        style={{
                            textAlign: 'center',
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: '#666',
                            margin: '0 0 20px',
                        }}
                    >
                        Ro'yxatdan o'tish so'rovingiz serverga yuborildi.
                        Ustoz tasdiqlagach, login va parolingiz bilan
                        tizimga kirishingiz mumkin.
                    </p>

                    <button
                        className="btn btn-p"
                        style={BTN_P}
                        onClick={() => {
                            setDone(false);
                            setMode('login');
                            setErr('');
                            setF(prev => ({
                                ...prev,
                                password: '',
                                confirm: '',
                            }));
                        }}
                    >
                        Kirish
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={PAGE}>
            <div style={CARD}>
                <h2 style={LOGO}>mystra</h2>

                <p style={SUB}>
                    {mode === 'login'
                        ? 'Hisobingizga kiring'
                        : "Ro'yxatdan o'tish"}
                </p>

                {err && (
                    <div
                        role="alert"
                        style={{
                            color: '#dc2626',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: 6,
                            padding: '10px 12px',
                            fontSize: 13,
                            marginBottom: 14,
                            overflowWrap: 'anywhere',
                        }}
                    >
                        {err}
                    </div>
                )}

                {mode === 'login' ? (
                    <form
                        onSubmit={handleLogin}
                        autoComplete="on"
                    >
                        <Field
                            k="username"
                            l="Login"
                            f={f}
                            set={set}
                        />

                        <Field
                            k="password"
                            l="Parol"
                            type="password"
                            f={f}
                            set={set}
                        />

                        <button
                            className="btn btn-p"
                            type="submit"
                            disabled={loading}
                            style={{
                                ...BTN_P,
                                marginTop: 4,
                                marginBottom: 10,
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading ? 'Kutilmoqda...' : 'Kirish'}
                        </button>

                        <button
                            className="btn"
                            type="button"
                            disabled={loading}
                            style={BTN_S}
                            onClick={() => {
                                setErr('');
                                setMode('signup');
                            }}
                        >
                            Ro'yxatdan o'tish
                        </button>
                    </form>
                ) : (
                    <form
                        onSubmit={signup}
                        autoComplete="on"
                    >
                        <Field
                            k="name"
                            l="Ism Familya"
                            f={f}
                            set={set}
                        />

                        <Field
                            k="phone"
                            l="Telefon"
                            f={f}
                            set={set}
                        />

                        <Field
                            k="username"
                            l="Login"
                            f={f}
                            set={set}
                        />

                        <Field
                            k="password"
                            l="Parol"
                            type="password"
                            f={f}
                            set={set}
                        />

                        <Field
                            k="confirm"
                            l="Parolni tasdiqlang"
                            type="password"
                            f={f}
                            set={set}
                        />

                        <select
                            className="fi"
                            style={{ ...FIELD, marginBottom: 10 }}
                            value={f.groupId}
                            onChange={set('groupId')}
                            disabled={groupsLoading || groups.length === 0}
                        >
                            <option value="">
                                {groupsLoading
                                    ? 'Guruhlar yuklanmoqda...'
                                    : groups.length === 0
                                      ? 'Guruhlar mavjud emas'
                                      : 'Guruhni tanlang'}
                            </option>

                            {groups.map(g => (
                                <option
                                    key={g.id}
                                    value={g.id}
                                >
                                    {g.name} · {g.level}
                                </option>
                            ))}
                        </select>

                        <button
                            className="btn btn-p"
                            type="submit"
                            disabled={loading || groupsLoading || groups.length === 0}
                            style={{
                                ...BTN_P,
                                marginTop: 4,
                                marginBottom: 10,
                                opacity:
                                    loading || groupsLoading || groups.length === 0
                                        ? 0.7
                                        : 1,
                            }}
                        >
                            {loading
                                ? 'Yuborilmoqda...'
                                : "So'rov yuborish"}
                        </button>

                        <button
                            className="btn"
                            type="button"
                            disabled={loading}
                            style={BTN_S}
                            onClick={() => {
                                setErr('');
                                setMode('login');
                            }}
                        >
                            ← Orqaga
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}