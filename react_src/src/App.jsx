import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth, apiRequest } from './lib/auth';

import NotifBar from './components/NotifBar';
import Login from './pages/Login';
import LangSwitch from './components/LangSwitch';
import ParentView from './pages/public/ParentView';
import InstallApp from './components/InstallApp';

// Student pages
const Tasks = lazy(() => import('./pages/student/Tasks'));
const Results = lazy(() => import('./pages/student/Results'));
const Pay = lazy(() => import('./pages/student/Pay'));
const Certs = lazy(() => import('./pages/student/Certs'));
const Archive = lazy(() => import('./pages/student/Archive'));
const Game = lazy(() => import('./pages/student/Game'));
const Cards = lazy(() => import('./pages/student/Cards'));
const Finance = lazy(() => import('./pages/teacher/Finance'));

// Teacher pages
const Overview = lazy(() => import('./pages/teacher/Overview'));
const Review = lazy(() => import('./pages/teacher/Review'));
const Signups = lazy(() => import('./pages/teacher/Signups'));
const People = lazy(() => import('./pages/teacher/People'));
const Payment = lazy(() => import('./pages/teacher/Payment'));
const Reports = lazy(() => import('./pages/teacher/Reports'));
const AiSuggest = lazy(() => import('./pages/teacher/AiSuggest'));
const HwCheck = lazy(() => import('./pages/teacher/HwCheck'));
const SendResults = lazy(() => import('./pages/teacher/SendResults'));
const Attendance = lazy(() => import('./pages/teacher/Attendance'));
const Parent = lazy(() => import('./pages/teacher/Parent'));
const AiTask = lazy(() => import('./pages/teacher/AiTask'));
const Settings = lazy(() => import('./pages/teacher/Settings'));

// Admin pages
const Admin = lazy(() => import('./pages/admin/Admin'));

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
    layers: <><path d="M12 2l10 5-10 5L2 7z" /><path d="M2 12l10 5 10-5M2 17l10 5 10-5" /></>,
    coin: <><circle cx="12" cy="12" r="9" /><path d="M14.5 9a2.5 2.5 0 0 0-2.5-1.5c-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2A2.5 2.5 0 0 1 9.5 15M12 6v1.5M12 16.5V18" /></>,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></>,
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
    '/game': 'trophy',
    '/cards': 'layers',
    '/finance': 'coin',
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
.sb-root{width:240px;flex-shrink:0;position:sticky;top:0;height:100vh;box-sizing:border-box;display:flex;flex-direction:column;background:#FFFFFF;border-right:1px solid #E4E4E7;padding:18px 12px}
.sb-head{display:flex;align-items:center;gap:10px;padding:0 8px 18px}
.sb-logo{width:30px;height:30px;border-radius:8px;background:#18181B;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0}
.sb-word{font-weight:600;font-size:17px;color:#18181B}
.sb-ver{margin-left:auto;font-size:11px;font-weight:600;color:#71717A;border:1px solid #E4E4E7;padding:1px 7px;border-radius:99px}
.sb-nav{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:1px;margin:0 -4px;padding:0 4px}
.sb-link{display:flex;align-items:center;gap:10px;min-height:38px;padding:0 10px;border-radius:8px;font-size:14px;font-weight:500;color:#52525B;text-decoration:none;transition:background .12s,color .12s;cursor:pointer;white-space:nowrap}
.sb-ic{width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:transparent !important;color:inherit !important}
.sb-link:hover{background:#F4F4F5;color:#18181B}
.sb-link.active,.sb-link.active:hover{background:#EEF2FF;color:#4338CA;font-weight:600}
.sb-badge{margin-left:auto;min-width:20px;height:18px;padding:0 6px;border-radius:999px;background:#4F46E5;color:#fff;font-size:11px;font-weight:600;display:inline-flex;align-items:center;justify-content:center}
.sb-user{margin-top:12px;padding:12px 8px 0;border-top:1px solid #E4E4E7;display:flex;flex-direction:column;gap:10px}
.sb-user-row{display:flex;align-items:center;gap:10px}
.sb-ava{width:32px;height:32px;border-radius:99px;background:#F4F4F5;color:#3F3F46;font-weight:600;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sb-uname{font-size:13px;font-weight:600;color:#18181B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sb-urole{font-size:12px;color:#71717A}
.sb-out{margin-left:auto;width:32px;height:32px;border-radius:8px;border:0;background:transparent;color:#71717A;display:flex;align-items:center;justify-content:center;cursor:pointer}
.sb-out:hover{background:#F4F4F5;color:#18181B}
.app-main{flex:1;min-width:0}
body{padding-bottom:0 !important}
@media (max-width: 860px){
  .app-root{flex-direction:column}
  .sb-root{position:fixed;bottom:0;top:auto;left:0;right:0;width:auto;height:auto;flex-direction:row;padding:4px 4px calc(4px + env(safe-area-inset-bottom));z-index:50;border-right:0;border-top:1px solid #E4E4E7}
  .sb-head,.sb-user{display:none}
  .sb-nav{flex-direction:row;overflow-x:auto;gap:2px;margin:0;padding:0;scrollbar-width:none}
  .sb-nav::-webkit-scrollbar{display:none}
  .sb-link{flex-direction:column;gap:2px;min-width:66px;min-height:50px;padding:4px 6px;font-size:11px;justify-content:center;position:relative}
  .sb-link.active,.sb-link.active:hover{background:transparent}
  .sb-badge{position:absolute;margin:0;top:2px;right:10px}
  .app-main{padding-bottom:76px}
  .sb-mlang{display:flex !important}
}
`;

const TILE = {
    _: ['#F4F4F5', '#3F3F46'],
    '/overview': ['#EEF2FF', '#4F46E5'], '/review': ['#E7F6EC', '#15803D'], '/signups': ['#FFE4D6', '#C2410C'],
    '/people': ['#E0F2FE', '#0369A1'], '/payment': ['#ECFCCB', '#4D7C0F'], '/reports': ['#FCE7F3', '#BE185D'],
    '/hwcheck': ['#FEF3C7', '#B45309'], '/attend': ['#E0F2FE', '#0369A1'], '/suggest': ['#EEF2FF', '#4F46E5'],
    '/send': ['#FFE4D6', '#C2410C'], '/aitask': ['#F3E8FF', '#7E22CE'], '/parent': ['#FCE7F3', '#BE185D'],
    '/settings': ['#F4F4F5', '#3F3F46'], '/admin': ['#EEF2FF', '#4F46E5'],
    '/tasks': ['#EEF2FF', '#4F46E5'], '/results': ['#ECFCCB', '#4D7C0F'], '/archive': ['#FEF3C7', '#B45309'],
    '/pay': ['#E0F2FE', '#0369A1'], '/certs': ['#FCE7F3', '#BE185D'], '/game': ['#FEF3C7', '#B45309'], '/cards': ['#F3E8FF', '#7E22CE'], '/finance': ['#FFE4D6', '#C2410C'],
};

// Sahifa yuklanayotganda ko'rinadigan yengil joy egallovchi
function PageLoading() {
    return (
        <div aria-busy="true" aria-label="Yuklanmoqda..." style={{ padding: '28px 32px', display: 'grid', gap: 12, maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ height: 28, width: 220, background: '#F4F4F5', borderRadius: 8 }} />
            <div style={{ height: 120, background: '#F4F4F5', borderRadius: 12 }} />
            <div style={{ height: 240, background: '#F4F4F5', borderRadius: 12 }} />
        </div>
    );
}

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
            <div className="app-root" style={{ display: 'flex', minHeight: '100vh' }}>
                <aside className="sb-root" aria-label="Asosiy menyu">
                    <div className="sb-head">
                        <div className="sb-logo" aria-hidden="true">m</div>
                        <span className="sb-word">mystra</span>
                        <span className="sb-ver">3.0</span>
                    </div>

                    <nav className="sb-nav">
                        {tabs.map(([to, l]) => (
                            <NavLink key={to} to={to} title={l} className={({ isActive }) => 'sb-link' + (isActive ? ' active' : '')}>
                                <span className="sb-ic" style={{ background: (TILE[to] || TILE._)[0], color: (TILE[to] || TILE._)[1] }}><Icon name={ICON_FOR[to]} /></span>
                                <span className="sb-label">{l}</span>
                                {to === '/signups' && signupCount > 0 && <span className="sb-badge">{signupCount}</span>}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="sb-user">
                        <div className="sb-user-row">
                            <div className="sb-ava" aria-hidden="true">{initials}</div>
                            <div style={{ minWidth: 0 }}>
                                <div className="sb-uname">{user.name}</div>
                                <div className="sb-urole">{ROLE_LABEL[user.role] || user.role}</div>
                            </div>
                            <button type="button" className="sb-out" onClick={logout} title="Chiqish" aria-label="Chiqish">
                                <Icon name="logout" />
                            </button>
                        </div>
                        <LangSwitch style={{ alignSelf: 'stretch', justifyContent: 'space-between' }} />
                        <InstallApp />
                    </div>
                </aside>

                <main className="app-main">
                    <div className="sb-mlang" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 16px 0' }}>
                        <LangSwitch />
                        <div style={{ flex: 1, maxWidth: 190 }}><InstallApp compact /></div>
                        <button type="button" onClick={logout} aria-label="Chiqish" title="Chiqish" style={{ border: 0, background: '#fff', borderRadius: 10, height: 36, padding: '0 12px', font: 'inherit', fontWeight: 600, fontSize: 13, color: '#3F3F46', cursor: 'pointer' }}>Chiqish</button>
                    </div>
                    <NotifBar to={notifTo} />
                    <Suspense fallback={<PageLoading />}>{children}</Suspense>
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
    ['/finance', 'Moliya'],
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
    const { pathname } = useLocation();

    // Ota-ona kabineti: login talab qilinmaydi
    if (pathname.startsWith('/p/')) {
        return (
            <Routes>
                <Route path="/p/:token" element={<ParentView />} />
            </Routes>
        );
    }

    if (!user) {
        return <Login />;
    }

    if (user.role === 'student') {
        return (
            <Shell
                notifTo={user.id}
                tabs={[
                    ['/tasks', 'Vazifalar'],
                    ['/game', 'Yutuqlar'],
                    ['/cards', 'Kartochkalar'],
                    ['/results', 'Natijalar'],
                    ['/archive', 'Arxiv'],
                    ['/pay', "To'lov"],
                    ['/certs', 'Sertifikat'],
                ]}
            >
                <Routes>
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/game" element={<Game />} />
                    <Route path="/cards" element={<Cards />} />
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
                <Route path="/finance" element={<Finance />} />
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