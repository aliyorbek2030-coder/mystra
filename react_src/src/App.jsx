import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth, apiRequest } from './lib/auth';

import NotifBar from './components/NotifBar';
import Login from './pages/Login';
import LangSwitch from './components/LangSwitch';
import ThemeSwitch from './components/ThemeSwitch';
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
.sb-root{width:256px;flex-shrink:0;position:sticky;top:0;height:100vh;box-sizing:border-box;display:flex;flex-direction:column;background:rgba(255,255,255,.86);backdrop-filter:blur(14px);border-right:1px solid #E3E5EA;padding:20px 14px}
.sb-head{display:flex;align-items:center;gap:10px;padding:0 8px 20px}
.sb-logo{width:40px;height:40px;border-radius:13px;background:linear-gradient(135deg,#8B7CFF,#5B4BFF);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Fredoka','Onest',sans-serif;font-weight:700;font-size:22px;flex-shrink:0;box-shadow:0 4px 0 #3F31D9;transform:rotate(-6deg)}
.sb-word{font-family:'Fredoka','Onest',sans-serif;font-weight:700;font-size:23px;color:#12131A}
.sb-ver{margin-left:auto;font-size:11px;font-weight:800;background:#D4F74A;color:#12131A;padding:3px 8px;border-radius:99px;transform:rotate(4deg)}
.sb-nav{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:3px;margin:0 -4px;padding:0 4px}
.sb-link{display:flex;align-items:center;gap:12px;min-height:44px;padding:0 10px 0 6px;border-radius:14px;font-size:14px;font-weight:600;color:#3D4150;text-decoration:none;transition:background .15s,color .15s,transform .15s;cursor:pointer;white-space:nowrap}
.sb-ic{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .2s cubic-bezier(.3,1.4,.6,1)}
.sb-link:hover{background:#F4F5F7;color:#12131A}
.sb-link:hover .sb-ic{transform:rotate(-8deg) scale(1.08)}
.sb-link.active,.sb-link.active:hover{background:linear-gradient(135deg,#8B7CFF,#5B4BFF);color:#fff;box-shadow:0 6px 16px rgba(91,75,255,.28)}
.sb-link.active .sb-ic{background:rgba(255,255,255,.2) !important;color:#fff !important}
.sb-badge{margin-left:auto;min-width:22px;height:20px;padding:0 7px;border-radius:999px;background:#FF7A45;color:#fff;font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center}
.sb-user{margin-top:12px;padding:12px;border-radius:16px;background:linear-gradient(135deg,#F4F2FF,#EEF9D2);display:flex;flex-direction:column;gap:10px}
.sb-user-row{display:flex;align-items:center;gap:10px}
.sb-ava{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#FFC38F,#FF7A45);color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sb-uname{font-size:13px;font-weight:700;color:#12131A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sb-urole{font-size:12px;color:#5B6070}
.sb-out{margin-left:auto;width:36px;height:36px;border-radius:10px;border:0;background:#fff;color:#3D4150;display:flex;align-items:center;justify-content:center;cursor:pointer}
.sb-out:hover{background:#FFE4D6;color:#C2410C}
.app-main{flex:1;min-width:0}
body{padding-bottom:0 !important}
.tabwrap{padding:22px 32px 0;max-width:1240px;margin:0 auto;box-sizing:border-box}
.tab-bar{display:inline-flex;gap:4px;padding:5px;background:#fff;border:1px solid #E3E5EA;border-radius:16px;max-width:100%;overflow-x:auto;scrollbar-width:none}
.tab-bar::-webkit-scrollbar{display:none}
.tab-bar a{padding:9px 16px;border-radius:11px;font-size:13px;font-weight:600;color:#5B6070;text-decoration:none;white-space:nowrap;transition:background .15s,color .15s}
.tab-bar a:hover{background:#F4F5F7;color:#12131A}
.tab-bar a.active{background:var(--tc,#5B4BFF);color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.12)}
@media (max-width: 860px){
  .app-root{flex-direction:column}
  .sb-root{position:fixed;bottom:0;top:auto;left:0;right:0;width:auto;height:auto;flex-direction:row;padding:6px 6px calc(6px + env(safe-area-inset-bottom));z-index:50;border-right:0;border-top:1px solid #E3E5EA;background:rgba(255,255,255,.95)}
  .sb-head,.sb-user{display:none}
  .sb-nav{flex-direction:row;overflow-x:auto;gap:4px;margin:0;padding:0;scrollbar-width:none}
  .sb-nav::-webkit-scrollbar{display:none}
  .sb-link{flex-direction:column;gap:2px;min-width:70px;min-height:56px;padding:4px 6px;font-size:11px;justify-content:center;position:relative}
  .sb-ic{width:28px;height:28px}
  .sb-badge{position:absolute;margin:0;top:2px;right:8px}
  .app-main{padding-bottom:84px}
  .tabwrap{padding:14px 16px 0}
  .sb-link{flex:1 1 0;min-width:0;padding:4px 1px !important}
  .sb-label{max-width:100%;overflow:hidden;text-overflow:ellipsis;font-size:10px;letter-spacing:-.2px}
  .sb-mlang{flex-wrap:wrap}
  .sb-mlang{display:flex !important}
}
`;

const TILE = {
    _: ['#EEF0F3', '#3D4150'],
    '/overview': ['#ECEAFF', '#5B4BFF'], '/review': ['#E7F6EC', '#15803D'], '/signups': ['#FFE4D6', '#C2410C'],
    '/people': ['#E0F2FE', '#0369A1'], '/payment': ['#ECFCCB', '#4D7C0F'], '/reports': ['#FCE7F3', '#BE185D'],
    '/hwcheck': ['#FEF3C7', '#B45309'], '/attend': ['#E0F2FE', '#0369A1'], '/suggest': ['#ECEAFF', '#5B4BFF'],
    '/send': ['#FFE4D6', '#C2410C'], '/aitask': ['#F3E8FF', '#7E22CE'], '/parent': ['#FCE7F3', '#BE185D'],
    '/settings': ['#EEF0F3', '#3D4150'], '/admin': ['#ECEAFF', '#5B4BFF'],
    '/tasks': ['#ECEAFF', '#5B4BFF'], '/results': ['#ECFCCB', '#4D7C0F'], '/archive': ['#FEF3C7', '#B45309'],
    '/pay': ['#E0F2FE', '#0369A1'], '/certs': ['#FCE7F3', '#BE185D'], '/game': ['#FEF3C7', '#B45309'], '/cards': ['#F3E8FF', '#7E22CE'], '/finance': ['#FFE4D6', '#C2410C'],
};

// Sahifa yuklanayotganda ko'rinadigan yengil joy egallovchi
function PageLoading() {
    return (
        <div aria-busy="true" aria-label="Yuklanmoqda..." style={{ padding: '28px 32px', display: 'grid', gap: 12, maxWidth: 1240, margin: '0 auto' }}>
            <div className="shimmer" style={{ height: 28, width: 220, borderRadius: 10 }} />
            <div className="shimmer" style={{ height: 130, borderRadius: 20 }} />
            <div className="shimmer" style={{ height: 240, borderRadius: 20 }} />
        </div>
    );
}

const ROLE_LABEL = { teacher: 'Ustoz', admin: 'Administrator', student: "O'quvchi" };

// Eski versiyadagi joylashuv: chapda bo'limlar, bo'lim ichida yuqorida tablar
function Shell({ groups, notifTo, children }) {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const [signupCount, setSignupCount] = useState(0);

    const hasSignups = groups.some(g => g.tabs.some(([to]) => to === '/signups'));
    const cur = groups.find(g => g.tabs.some(([to]) => pathname.startsWith(to))) || groups[0];

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
                        <span className="sb-ver">2.0</span>
                    </div>

                    <nav className="sb-nav">
                        {groups.map(g => {
                            const badge = g.tabs.some(([to]) => to === '/signups') ? signupCount : 0;
                            return (
                                <NavLink key={g.id} to={g.tabs[0][0]} title={g.label}
                                    className={'sb-link' + (cur.id === g.id ? ' active' : '')}>
                                    <span className="sb-ic" style={{ background: g.color + '1F', color: g.color }}><Icon name={g.icon} /></span>
                                    <span className="sb-label">{g.label}</span>
                                    {badge > 0 && <span className="sb-badge">{badge}</span>}
                                </NavLink>
                            );
                        })}
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
                        <LangSwitch style={{ alignSelf: 'stretch', justifyContent: 'space-between', background: '#fff' }} />
                        <ThemeSwitch style={{ alignSelf: 'stretch', justifyContent: 'space-between' }} />
                        <InstallApp />
                    </div>
                </aside>

                <main className="app-main">
                    <div className="sb-mlang" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 16px 0' }}>
                        <LangSwitch />
                        <ThemeSwitch />
                        <div style={{ flex: 1, maxWidth: 190 }}><InstallApp compact /></div>
                        <button type="button" onClick={logout} aria-label="Chiqish" title="Chiqish" style={{ border: 0, background: '#fff', borderRadius: 10, height: 36, padding: '0 12px', font: 'inherit', fontWeight: 600, fontSize: 13, color: '#3D4150', cursor: 'pointer' }}>Chiqish</button>
                    </div>
                    <NotifBar to={notifTo} />
                    {cur.tabs.length > 1 && (
                        <div className="tabwrap">
                            <div className="tab-bar" style={{ '--tc': cur.color }}>
                                {cur.tabs.map(([to, l]) => (
                                    <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
                                        {l}
                                        {to === '/signups' && signupCount > 0 ? ` (${signupCount})` : ''}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )}
                    <div key={pathname} className="page-in"><Suspense fallback={<PageLoading />}>{children}</Suspense></div>
                </main>
            </div>
        </>
    );
}

// O'qituvchi menyusi — eski versiya bilan bir xil tartib
const T = [
    { id: 'overview', label: 'Bosh sahifa', color: '#5B4BFF', icon: 'home', tabs: [['/overview', 'Umumiy']] },
    { id: 'groups', label: 'Guruhlar', color: '#0EA5E9', icon: 'users', tabs: [['/people', 'Guruhlar'], ['/attend', 'Davomat'], ['/signups', "So'rovlar"]] },
    { id: 'work', label: 'Vazifalar', color: '#F59E0B', icon: 'check', tabs: [['/hwcheck', 'Uy vazifa'], ['/review', 'Tekshirish'], ['/aitask', 'AI vazifa'], ['/suggest', 'AI takliflar']] },
    { id: 'reports', label: 'Hisobotlar', color: '#EC4899', icon: 'bars', tabs: [['/reports', 'Oylik hisobot'], ['/parent', 'Ota-ona hisobot'], ['/send', 'Natija yuborish']] },
    { id: 'payment', label: "To'lov", color: '#65A30D', icon: 'card', tabs: [['/payment', "To'lov"], ['/finance', 'Moliya']] },
    { id: 'settings', label: 'Sozlamalar', color: '#10B981', icon: 'sliders', tabs: [['/settings', 'Sozlamalar']] },
];

// O'quvchi menyusi — eski versiya bilan bir xil tartib (yangi bo'limlar tab sifatida)
const S_NAV = [
    { id: 'overview', label: 'Natijalarim', color: '#5B4BFF', icon: 'home', tabs: [['/results', 'Natijalarim'], ['/game', 'Yutuqlar']] },
    { id: 'archive', label: 'Oylik Arxiv', color: '#EC4899', icon: 'calendar', tabs: [['/archive', 'Oylik Arxiv']] },
    { id: 'tasks', label: 'Vazifalar', color: '#F59E0B', icon: 'book', tabs: [['/tasks', 'Vazifalar'], ['/cards', 'Kartochkalar']] },
    { id: 'pay', label: "To'lov", color: '#65A30D', icon: 'card', tabs: [['/pay', "To'lov"]] },
    { id: 'certs', label: 'Sertifikatlar', color: '#10B981', icon: 'award', tabs: [['/certs', 'Sertifikatlar']] },
];

const A_NAV = [
    { id: 'admin', label: 'Admin paneli', color: '#5B4BFF', icon: 'shield', tabs: [['/admin', 'Admin paneli']] },
    { id: 'settings', label: 'Sozlamalar', color: '#10B981', icon: 'sliders', tabs: [['/settings', 'Sozlamalar']] },
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
                groups={S_NAV}
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
                        element={<Navigate to="/results" />}
                    />
                </Routes>
            </Shell>
        );
    }

    if (user.role === 'admin') {
        return (
            <Shell
                notifTo="admin"
                groups={A_NAV}
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
        <Shell notifTo="teacher" groups={T}>
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