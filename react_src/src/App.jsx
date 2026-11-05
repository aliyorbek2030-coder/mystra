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
.sb-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #4a4a48;
    text-decoration: none;
    transition: background 0.12s, color 0.12s;
    cursor: pointer;
}
.sb-link:hover { background: #f1f1ef; color: #111; }
.sb-link.active, .sb-link.active:hover { background: #111; color: #fff; }
.sb-badge {
    margin-left: auto;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    box-sizing: border-box;
    border-radius: 999px;
    background: #16a34a;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
body { padding-bottom: 0 !important; }
@media (max-width: 760px) {
    .sb-root { width: 60px !important; }
    .sb-label, .sb-name, .sb-badge { display: none !important; }
    .sb-link { justify-content: center; padding: 10px 0; }
    .sb-head { justify-content: center !important; padding: 16px 0 !important; }
}
`;

function Shell({ tabs, notifTo, children }) {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const [signupCount, setSignupCount] = useState(0);

    const hasSignups = tabs.some(([to]) => to === '/signups');

    // Pending signup count for the green badge (refreshes when you navigate).
    useEffect(() => {
        if (!hasSignups) return undefined;

        let cancelled = false;

        apiRequest('/signups')
            .then(data => {
                if (!cancelled) {
                    setSignupCount(Array.isArray(data) ? data.length : 0);
                }
            })
            .catch(() => {
                if (!cancelled) setSignupCount(0);
            });

        return () => {
            cancelled = true;
        };
    }, [hasSignups, pathname]);

    return (
        <>
            <style>{SIDEBAR_CSS}</style>

            <div
                style={{
                    display: 'flex',
                    minHeight: '100vh',
                    backgroundColor: '#f7f7f6',
                    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
                }}
            >
                <aside
                    className="sb-root"
                    style={{
                        width: 220,
                        flexShrink: 0,
                        position: 'sticky',
                        top: 0,
                        height: '100vh',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#fff',
                        borderRight: '1px solid #e8e8e6',
                    }}
                >
                    {/* Logo + avatar */}
                    <div
                        className="sb-head"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 16px 14px 18px',
                            borderBottom: '1px solid #eeeeec',
                        }}
                    >
                        <span
                            className="sb-label"
                            style={{
                                fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
                                fontStyle: 'italic',
                                fontSize: 21,
                                fontWeight: 500,
                                color: '#111',
                            }}
                        >
                            mystra
                        </span>

                        <span
                            title={user.name || ''}
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background:
                                    'conic-gradient(#111 0 25%, #a855f7 0 50%, #ec4899 0 75%, #fff 0)',
                                border: '1px solid #d4d4d2',
                                flexShrink: 0,
                            }}
                        />
                    </div>

                    {/* Navigation */}
                    <nav
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '10px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                        }}
                    >
                        {tabs.map(([to, l]) => (
                            <NavLink
                                key={to}
                                to={to}
                                title={l}
                                className={({ isActive }) =>
                                    'sb-link' + (isActive ? ' active' : '')
                                }
                            >
                                <Icon name={ICON_FOR[to]} />

                                <span className="sb-label">{l}</span>

                                {to === '/signups' && signupCount > 0 && (
                                    <span className="sb-badge">{signupCount}</span>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Logout */}
                    <div
                        style={{
                            padding: '8px',
                            borderTop: '1px solid #eeeeec',
                        }}
                    >
                        <a
                            href="#/"
                            onClick={logout}
                            className="sb-link"
                            title="Chiqish"
                        >
                            <Icon name="logout" />

                            <span className="sb-label sb-name">
                                Chiqish ({user.name?.split(' ')[0]})
                            </span>
                        </a>
                    </div>
                </aside>

                <main style={{ flex: 1, minWidth: 0 }}>
                    <NotifBar to={notifTo} />

                    {children}
                </main>
            </div>
        </>
    );
}

const T = [
    ['/overview', 'Overview'],
    ['/review', 'Tekshirish'],
    ['/signups', "So'rovlar"],
    ['/people', 'Guruh/O\'quvchi'],
    ['/payment', 'Tolov'],
    ['/reports', 'Hisobot'],
    ['/hwcheck', 'Dars'],
    ['/attend', 'Davomat'],
    ['/suggest', 'AI takliflar'],
    ['/send', 'Yuborish'],
    ['/aitask', 'AI vazifa'],
    ['/parent', 'Hisobot'],
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
                    ['/pay', 'Tolov'],
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