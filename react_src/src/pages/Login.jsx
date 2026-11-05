import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';

import { API_URL as API } from '../lib/config';
import LangSwitch from '../components/LangSwitch';

// --- DIZAYN (MYSTRA 2.0) ---
const LOGIN_CSS = `
.lg-root{min-height:100vh;display:flex;background:#F4F5F7;font-family:'Onest',system-ui,sans-serif;color:#12131A}
.lg-brand{flex:1 1 50%;background:linear-gradient(150deg,#8B7CFF 0%,#5B4BFF 45%,#3A2BD0 100%);color:#fff;padding:48px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
.lg-brand:after{content:'';position:absolute;right:-90px;bottom:-90px;width:340px;height:340px;border-radius:50%;background:#D4F74A;opacity:.9}
.lg-brand:before{content:'';position:absolute;right:120px;top:90px;width:90px;height:90px;border-radius:26px;background:#FF8A55;transform:rotate(18deg);animation:lgfloat 5s ease-in-out infinite}
@keyframes lgfloat{50%{transform:rotate(28deg) translateY(-14px)}}
.lg-form{flex:1 1 50%;display:flex;align-items:center;justify-content:center;padding:32px 20px}
.lg-feat{display:flex;gap:12px;align-items:center;font-size:16px;line-height:1.5;color:#F1EFFF;font-weight:500}
.lg-dot{width:30px;height:30px;border-radius:10px;background:#D4F74A;color:#12131A;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:800;font-size:13px}
.lg-label{display:block;font-size:13px;font-weight:600;color:#3D4150;margin:0 0 6px}
.lg-field:focus{border-color:#5B4BFF !important;box-shadow:0 0 0 3px rgba(91,75,255,.15) !important}
@media (max-width:900px){.lg-brand{display:none}}
`;

const PAGE = {};

const CARD = {
    width: '100%',
    maxWidth: 420,
    boxSizing: 'border-box',
    backgroundColor: '#fff',
    border: '1px solid #E3E5EA',
    borderRadius: 24,
    padding: '36px 32px',
    boxShadow: '0 20px 60px rgba(18,19,26,.06)',
};

const LOGO = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '0 0 22px',
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#12131A',
};

const SUB = {
    margin: '0 0 22px',
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#12131A',
    fontFamily: "'Fredoka','Onest',sans-serif",
};

const FIELD = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0 14px',
    height: 46,
    borderRadius: 12,
    border: '1px solid #E3E5EA',
    backgroundColor: '#F8F9FB',
    color: '#12131A',
    fontFamily: 'inherit',
    fontSize: 15,
    outline: 'none',
    boxShadow: '0 0 0 1000px #F8F9FB inset',
    WebkitTextFillColor: '#12131A',
};

const BTN_P = {
    width: '100%',
    height: 48,
    padding: '0 16px',
    background: 'linear-gradient(135deg,#8B7CFF,#5B4BFF)',
    color: '#fff',
    border: '1px solid #5B4BFF',
    boxShadow: '0 4px 0 #3F31D9',
    borderRadius: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 15,
    fontWeight: 700,
};

const BTN_S = {
    width: '100%',
    height: 48,
    padding: '0 16px',
    backgroundColor: '#fff',
    color: '#12131A',
    border: '1px solid #D9DCE3',
    borderRadius: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 15,
    fontWeight: 600,
};

const LogoMark = () => (
    <>
        <span style={{ width: 36, height: 36, borderRadius: 11, background: '#D4F74A', color: '#12131A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 19 }} aria-hidden="true">m</span>
        mystra
    </>
);

const FEATURES = [
    'AI uy vazifalarini tekshiradi, ustoz bir bosishda tasdiqlaydi',
    'Kunlik reja, XP, reyting va sertifikatlar',
    "To'lov, davomat va hisobotlar bitta joyda",
];

function Layout({ children }) {
    return (
        <div className="lg-root">
            <style>{LOGIN_CSS}</style>
            <aside className="lg-brand" aria-hidden="true">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 700 }}>
                    <span style={{ width: 40, height: 40, borderRadius: 12, background: '#D4F74A', color: '#12131A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 21 }}>m</span>
                    mystra
                    <span style={{ fontSize: 12, fontWeight: 700, background: '#2A2C38', color: '#D4F74A', padding: '3px 9px', borderRadius: 99 }}>2.0</span>
                </div>
                <div style={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
                    <h1 style={{ fontFamily: "'Fredoka','Onest',sans-serif", fontSize: 56, lineHeight: 1.02, fontWeight: 700, margin: '0 0 28px' }}>O'qish o'yinga,<br />o'quv markazi<br />tizimga aylanadi</h1>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {FEATURES.map((t, i) => (
                            <div className="lg-feat" key={t}><span className="lg-dot">{i + 1}</span><span>{t}</span></div>
                        ))}
                    </div>
                </div>
                <div style={{ fontSize: 13, color: '#A3A6B4', position: 'relative', zIndex: 1 }}>© MYSTRA · o'quv markazi platformasi</div>
            </aside>
            <div className="lg-form" style={{ flexDirection: 'column', gap: 16 }}>
                <LangSwitch />
                <div style={CARD} className="pop-in">{children}</div>
            </div>
        </div>
    );
}

const Field = ({ k, l, type = 'text', f, set }) => (
    <div style={{ marginBottom: 14 }}>
        <label className="lg-label" htmlFor={'lg-' + k}>{l}</label>
        <input
            id={'lg-' + k}
            className="fi lg-field"
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
            <Layout>
                    <div style={LOGO}><LogoMark /></div>

                    

                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        <b style={{ fontSize: 16 }}>So'rov yuborildi</b>
                    </div>

                    <p
                        style={{
                            textAlign: 'center',
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: '#4A4E5C',
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
                </Layout>
        );
    }

    return (
        <Layout>
                <div style={LOGO}><LogoMark /></div>

                <p style={SUB}>
                    {mode === 'login'
                        ? 'Xush kelibsiz!'
                        : "Ro'yxatdan o'tish"}
                </p>

                {err && (
                    <div
                        role="alert"
                        style={{
                            color: '#DC2626',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: 10,
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
            </Layout>
    );
}
