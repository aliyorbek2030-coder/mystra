import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth, apiRequest } from './lib/auth';

import NotifBar from './components/NotifBar';
import Login from './pages/Login';

// Student pages
import Tasks from './pages/student/Tasks';
import Results from './pages/student/Results';
import Pay from './pages/student/Pay';
import Certs from './pages/student/Certs';
import Archive from './pages/student/Archive';

// Teacher pages
import Overview from './pages/teacher/Overview';
import Review from './pages/teacher/Review';
import Signups from './pages/teacher/Signups';
import People from './pages/teacher/People';
import Payment from './pages/teacher/Payment';
import Reports from './pages/teacher/Reports';
import AiSuggest from './pages/teacher/AiSuggest';
import HwCheck from './pages/teacher/HwCheck';
import SendResults from './pages/teacher/SendResults';
import Attendance from './pages/teacher/Attendance';
import Parent from './pages/teacher/Parent';
import AiTask from './pages/teacher/AiTask';
import Settings from './pages/teacher/Settings';

// Admin pages
import Admin from './pages/admin/Admin';

// ---------------------------------------------------------------
// SIDEBAR DESIGN (no routing / auth logic in this block)
// ---------------------------------------------------------------

// Simple line icons (24x24 stroke icons), picked by route path.
const ICONS = {
    home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
    check: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    userPlus: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>,
    card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
    bars: <path d="M12 20V10M18 20V4M6 20v-4" />,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    send: <><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></>,
    sparkles: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    sliders: <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    book: <><path d="M2 4h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 4h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>,
    award: <><circle cx="12" cy="8" r="6" /><path d="M15.5 13.5L17 22l-5-3-5 3 1.5-8.5" /></>,
    archive: <><rect x="2" y="3" width="20" height="5" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4" /></>,
    dot: <circle cx="12" cy="12" r="3" />,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
};

const ICON_FOR = {
    '/overview': 'home',
    '/review': 'check',
    '/signups': 'userPlus',
    '/people': 'users',
    '/payment': 'card',
    '/reports': 'bars',
    '/hwcheck': 'check',
    '/attend': 'calendar',
    '/suggest': 'sparkles',
    '/send': 'send',
    '/aitask': 'sparkles',
    '/parent': 'file',
    '/settings': 'sliders',
    '/admin': 'shield',
    '/tasks': 'book',
    '/results': 'bars',
    '/archive': 'archive',
    '/pay': 'card',
    '/certs': 'award',
};

const Icon = ({ name }) => (
    <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
    >
        {ICONS[name] || ICONS.dot}
    </svg>
);

const SIDEBAR_CSS = `
.sb-root{width:248px;flex-shrink:0;position:sticky;top:0;height:100vh;box-sizing:border-box;display:flex;flex-direction:column;background:#12131A;color:#fff;padding:20px 14px}
.sb-head{display:flex;align-items:center;gap:10px;padding:0 8px 22px}
.sb-logo{width:36px;height:36px;border-radius:11px;background:#D4F74A;color:#12131A;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:19px;flex-shrink:0}
.sb-word{font-weight:700;font-size:20px;letter-spacing:-0.02em}
.sb-ver{margin-left:auto;font-size:11px;font-weight:700;background:#2A2C38;color:#D4F74A;padding:3px 8px;border-radius:99px}
.sb-nav{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:2px;margin:0 -4px;padding:0 4px}
.sb-link{display:flex;align-items:center;gap:12px;min-height:42px;padding:0 12px;border-radius:12px;font-size:14px;font-weight:500;color:#C9CBD6;text-decoration:none;transition:background .12s,color .12s;cursor:pointer;white-space:nowrap}
.sb-link:hover{background:#1E2030;color:#fff}
.sb-link.active,.sb-link.active:hover{background:#D4F74A;color:#12131A;font-weight:600}
.sb-badge{margin-left:auto;min-width:22px;height:20px;padding:0 7px;border-radius:999px;background:#5B4BFF;color:#fff;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center}
.sb-user{margin-top:14px;padding:12px;border-radius:14px;background:#1E2030;display:flex;align-items:center;gap:10px}
.sb-ava{width:36px;height:36px;border-radius:99px;background:#5B4BFF;color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sb-uname{font-size:13px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sb-urole{font-size:12px;color:#A3A6B4}
.sb-out{margin-left:auto;width:36px;height:36px;border-radius:10px;border:0;background:transparent;color:#C9CBD6;display:flex;align-items:center;justify-content:center;cursor:pointer}
.sb-out:hover{background:#2A2C38;color:#fff}
.app-main{flex:1;min-width:0}
body{padding-bottom:0 !important}
@media (max-width: 860px){
  .app-root{flex-direction:column}
  .sb-root{position:fixed;bottom:0;top:auto;left:0;right:0;width:auto;height:auto;flex-direction:row;padding:6px 6px calc(6px + env(safe-area-inset-bottom));z-index:50;border-top:1px solid #2A2C38}
  .sb-head,.sb-user .sb-uname,.sb-user .sb-urole,.sb-user .sb-ava{display:none}
  .sb-nav{flex-direction:row;overflow-x:auto;gap:4px;margin:0;padding:0}
  .sb-link{flex-direction:column;gap:3px;min-width:68px;min-height:52px;padding:6px 8px;font-size:11px;justify-content:center}
  .sb-badge{position:absolute;margin:0;transform:translate(14px,-14px)}
  .sb-link{position:relative}
  .sb-user{margin:0 0 0 4px;padding:0;background:transparent}
  .app-main{padding-bottom:80px}
}
`;

const ROLE_LABEL = { teacher: 'Ustoz', admin: 'Administrator', student: "O'quvchi" };

function Shell({ tabs, notifTo, children }) {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const [signupCount, setSignupCount] = useState(0);

    const hasSignups = tabs.some(([to]) => to === '/signups');

    // Yangi so'rovlar soni (sahifa almashganda yangilanadi)
    useEffect(() => {
        if (!hasSignups) return undefined;
        let cancelled = false;
        apiRequest('/signups')
            .then(data => { if (!cancelled) setSignupCount(Array.isArray(data) ? data.length : 0); })
            .catch(() => { if (!cancelled) setSignupCount(0); });
        return () => { cancelled = true; };
    }, [hasSignups, pathname]);

    const initials = (user.name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

    return (
        <>
            <style>{SIDEBAR_CSS}</style>
            <div className="app-root" style={{ display: 'flex', minHeight: '100vh', background: '#F4F5F7' }}>
                <aside className="sb-root" aria-label="Asosiy menyu">
                    <div className="sb-head">
                        <div className="sb-logo" aria-hidden="true">m</div>
                        <span className="sb-word">mystra</span>
                        <span className="sb-ver">2.0</span>
                    </div>

                    <nav className="sb-nav">
                        {tabs.map(([to, l]) => (
                            <NavLink key={to} to={to} title={l} className={({ isActive }) => 'sb-link' + (isActive ? ' active' : '')}>
                                <Icon name={ICON_FOR[to]} />
                                <span className="sb-label">{l}</span>
                                {to === '/signups' && signupCount > 0 && <span className="sb-badge">{signupCount}</span>}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="sb-user">
                        <div className="sb-ava" aria-hidden="true">{initials}</div>
                        <div style={{ minWidth: 0 }}>
                            <div className="sb-uname">{user.name}</div>
                            <div className="sb-urole">{ROLE_LABEL[user.role] || user.role}</div>
                        </div>
                        <button type="button" className="sb-out" onClick={logout} title="Chiqish" aria-label="Chiqish">
                            <Icon name="logout" />
                        </button>
                    </div>
                </aside>

                <main className="app-main">
                    <NotifBar to={notifTo} />
                    {children}
                </main>
            </div>
        </>
    );
}

const T = [
    ['/overview', 'Bosh sahifa'],
    ['/review', 'Tekshirish'],
    ['/signups', "So'rovlar"],
    ['/people', "O'quvchilar"],
    ['/payment', "To'lovlar"],
    ['/reports', 'Hisobotlar'],
    ['/hwcheck', 'Uy vazifa'],
    ['/attend', 'Davomat'],
    ['/suggest', 'AI takliflar'],
    ['/send', 'Yuborish'],
    ['/aitask', 'AI vazifa'],
    ['/parent', 'Ota-onalar'],
    ['/settings', 'Sozlamalar'],
];

export default function App() {
    const { user } = useAuth();

    if (!user) {
        return <Login />;
    }

    if (user.role === 'student') {
        return (
            <Shell
                notifTo={user.id}
                tabs={[
                    ['/tasks', 'Vazifalar'],
                    ['/results', 'Natijalar'],
                    ['/archive', 'Arxiv'],
                    ['/pay', "To'lov"],
                    ['/certs', 'Sertifikat'],
                ]}
            >
                <Routes>
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/results" element={<Results />} />
                    <Route path="/archive" element={<Archive />} />
                    <Route path="/pay" element={<Pay />} />
                    <Route path="/certs" element={<Certs />} />
                    <Route
                        path="*"
                        element={<Navigate to="/tasks" />}
                    />
                </Routes>
            </Shell>
        );
    }

    if (user.role === 'admin') {
        return (
            <Shell
                notifTo="admin"
                tabs={[
                    ['/admin', 'Admin'],
                    ['/settings', 'Sozlamalar'],
                ]}
            >
                <Routes>
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route
                        path="*"
                        element={<Navigate to="/admin" />}
                    />
                </Routes>
            </Shell>
        );
    }

    return (
        <Shell notifTo="teacher" tabs={T}>
            <Routes>
                <Route path="/overview" element={<Overview />} />
                <Route path="/review" element={<Review />} />
                <Route path="/signups" element={<Signups />} />
                <Route path="/people" element={<People />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/hwcheck" element={<HwCheck />} />
                <Route path="/suggest" element={<AiSuggest />} />
                <Route path="/send" element={<SendResults />} />
                <Route path="/attend" element={<Attendance />} />
                <Route path="/aitask" element={<AiTask />} />
                <Route path="/parent" element={<Parent />} />
                <Route path="/settings" element={<Settings />} />
                <Route
                    path="*"
                    element={<Navigate to="/overview" />}
                />
            </Routes>
        </Shell>
    );
}