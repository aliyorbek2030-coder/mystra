import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../lib/auth';

// --- DESIGN ONLY (no logic) ---
const PAGE = {
    width: '100%',
    maxWidth: 'none',
    margin: 0,
    boxSizing: 'border-box',
    padding: 0,
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    color: '#111',
    backgroundColor: '#f7f7f6',
    minHeight: '100vh',
};

const HEADER = {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e8e8e6',
    padding: '20px 24px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
};

const CARD = {
    backgroundColor: '#fff',
    border: '1px solid #e2e2e0',
    borderRadius: 8,
    boxSizing: 'border-box',
};

const FIELD = {
    boxSizing: 'border-box',
    padding: '9px 12px',
    borderRadius: 6,
    border: '1px solid #d4d4d2',
    backgroundColor: '#fff',
    color: '#111',
    fontFamily: 'inherit',
    fontSize: 13,
    outline: 'none',
    boxShadow: '0 0 0 1000px #fff inset',
    WebkitTextFillColor: '#111',
};

const BTN_P = {
    padding: '9px 16px',
    backgroundColor: '#111',
    color: '#fff',
    border: '1px solid #111',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 500,
};

const BTN_S = {
    padding: '9px 16px',
    backgroundColor: '#fff',
    color: '#111',
    border: '1px solid #d4d4d2',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 500,
};

const MARK_BTN = active => ({
    width: 34,
    height: 34,
    padding: 0,
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 600,
    backgroundColor: active ? '#111' : '#fff',
    color: active ? '#fff' : '#111',
    border: active ? '1px solid #111' : '1px solid #d4d4d2',
});

const BANNER_ERR = {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    padding: '10px 12px',
    fontSize: 13,
    marginBottom: 12,
    overflowWrap: 'anywhere',
};

const BANNER_OK = {
    color: '#15803d',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 6,
    padding: '10px 12px',
    fontSize: 13,
    marginBottom: 12,
};

const Empty = ({ icon, children }) => (
    <div
        style={{
            textAlign: 'center',
            color: '#9a9a98',
            fontSize: 14,
            padding: '28px 16px',
        }}
    >
        {icon && <div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>}
        {children}
    </div>
);

const PageHeader = ({ children }) => (
    <div style={HEADER}>
        <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 2px 0', color: '#111' }}>
                Dars tekshiruvi
            </h1>
            <p style={{ color: '#8a8a88', margin: 0, fontSize: 13 }}>
                Vazifalarni belgilang va natijani saqlang
            </p>
        </div>
        {children}
    </div>
);

const today = () => {
    const d = new Date();
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
    ].join('-');
};

// Backend root used for authenticated media requests.
const API_ROOT = (
    import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
).replace(/\/api\/?$/, '').replace(/\/$/, '');

function getMime(path, explicitMime) {
    if (explicitMime) return explicitMime;

    const cleanPath = String(path || '').split('?')[0].toLowerCase();

    if (cleanPath.endsWith('.png')) return 'image/png';
    if (cleanPath.endsWith('.jpg') || cleanPath.endsWith('.jpeg')) {
        return 'image/jpeg';
    }
    if (cleanPath.endsWith('.webp')) return 'image/webp';
    if (cleanPath.endsWith('.webm')) return 'audio/webm';
    if (cleanPath.endsWith('.mp3')) return 'audio/mpeg';
    if (cleanPath.endsWith('.m4a')) return 'audio/mp4';
    if (cleanPath.endsWith('.ogg')) return 'audio/ogg';
    if (cleanPath.endsWith('.wav')) return 'audio/wav';
    if (cleanPath.endsWith('.pdf')) return 'application/pdf';

    return 'application/octet-stream';
}

// Loads protected files with the teacher's Bearer token.
function AuthenticatedMedia({ path, mime, name }) {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        let objectUrl = '';

        async function loadFile() {
            setLoading(true);
            setError('');
            setUrl('');

            try {
                if (!path) {
                    throw new Error('Fayl manzili mavjud emas.');
                }

                const token = localStorage.getItem('mys_token');

                if (!token) {
                    throw new Error('Login token topilmadi. Qayta kiring.');
                }

                // Uploaded-file paths are stored as /uploads/filename.
                const fileUrl = /^https?:\/\//i.test(path)
                    ? path
                    : `${API_ROOT}/${String(path).replace(/^\/+/, '')}`;

                const response = await fetch(fileUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(
                        response.status === 401 || response.status === 403
                            ? 'Faylga kirish rad etildi. Qayta login qilib ko‘ring.'
                            : `Fayl yuklanmadi (${response.status}).`
                    );
                }

                const blob = await response.blob();
                objectUrl = URL.createObjectURL(blob);

                if (!cancelled) {
                    setUrl(objectUrl);
                } else {
                    URL.revokeObjectURL(objectUrl);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e.message || 'Faylni ochib bo‘lmadi.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadFile();

        return () => {
            cancelled = true;

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [path]);

    const type = getMime(path, mime);

    if (loading) {
        return (
            <div style={{ fontSize: 13, color: '#8a8a88', marginTop: 6 }}>
                {name || 'Fayl'} yuklanmoqda...
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    fontSize: 13,
                    color: '#dc2626',
                    overflowWrap: 'anywhere',
                    marginTop: 6,
                }}
            >
                {name || 'Fayl'}: {error}
            </div>
        );
    }

    if (!url) return null;

    if (type.startsWith('image/')) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', marginTop: 6, color: '#111', fontSize: 12 }}
            >
                <img
                    src={url}
                    alt={name || 'O‘quvchi yuborgan rasm'}
                    style={{
                        display: 'block',
                        maxWidth: '100%',
                        maxHeight: 320,
                        objectFit: 'contain',
                        borderRadius: 8,
                        border: '1px solid #e2e2e0',
                    }}
                />
                <small>Rasmni kattalashtirish</small>
            </a>
        );
    }

    if (type.startsWith('audio/')) {
        return (
            <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                    🎧 {name || 'Audio javob'}
                </div>
                <audio
                    controls
                    preload="metadata"
                    src={url}
                    style={{ width: '100%', maxWidth: 420 }}
                >
                    Brauzeringiz audio ijroni qo‘llab-quvvatlamaydi.
                </audio>
            </div>
        );
    }

    if (type.startsWith('video/')) {
        return (
            <video
                controls
                preload="metadata"
                src={url}
                style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: 480,
                    maxHeight: 360,
                    marginTop: 8,
                }}
            />
        );
    }

    if (type === 'application/pdf') {
        return (
            <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 6, fontSize: 13 }}>
                    📄 {name || 'PDF hujjat'}
                </div>
                <iframe
                    title={name || 'PDF preview'}
                    src={url}
                    style={{
                        width: '100%',
                        height: 360,
                        border: '1px solid #e2e2e0',
                        borderRadius: 8,
                    }}
                />
                <a href={url} target="_blank" rel="noreferrer" style={{ color: '#111', fontSize: 13 }}>
                    PDFni alohida oynada ochish
                </a>
            </div>
        );
    }

    return (
        <div style={{ marginTop: 6, fontSize: 13 }}>
            📎{' '}
            <a href={url} download={name || 'student-file'} style={{ color: '#111' }}>
                {name || 'Faylni yuklab olish'}
            </a>
        </div>
    );
}

function StudentSubmissions({ submissions }) {
    if (!submissions.length) {
        return (
            <div
                style={{
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: '1px solid #eeeeec',
                    fontSize: 13,
                    color: '#9a9a98',
                }}
            >
                Hozircha yuborilgan online javoblar yo‘q.
            </div>
        );
    }

    return (
        <div
            style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid #eeeeec',
            }}
        >
            <b style={{ fontSize: 13 }}>📥 O‘quvchi yuborgan javoblar ({submissions.length})</b>

            {submissions.map(sub => (
                <div
                    key={sub.id}
                    style={{
                        marginTop: 10,
                        padding: 12,
                        borderRadius: 8,
                        background: '#f7f7f6',
                        border: '1px solid #eeeeec',
                        minWidth: 0,
                    }}
                >
                    <b style={{ fontSize: 14 }}>{sub.title || 'Vazifa'}</b>

                    <div
                        style={{
                            marginTop: 4,
                            fontSize: 12,
                            color: '#8a8a88',
                        }}
                    >
                        Topshirilgan sana: {sub.date || '—'}
                    </div>

                    {sub.text && (
                        <div
                            style={{
                                marginTop: 8,
                                whiteSpace: 'pre-wrap',
                                overflowWrap: 'anywhere',
                                fontSize: 13,
                            }}
                        >
                            {sub.text}
                        </div>
                    )}

                    {sub.audio && (
                        <AuthenticatedMedia
                            path={sub.audio}
                            mime="audio/webm"
                            name="Ovozli javob"
                        />
                    )}

                    {Array.isArray(sub.files) &&
                        sub.files.map((file, index) => (
                            <AuthenticatedMedia
                                key={`${sub.id}-${file.u || index}`}
                                path={file.u}
                                mime={file.mime}
                                name={file.n || `Fayl ${index + 1}`}
                            />
                        ))}
                </div>
            ))}
        </div>
    );
}

export default function HwCheck() {
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [homeworks, setHomeworks] = useState([]);
    const [submissions, setSubmissions] = useState([]);

    const [g, setG] = useState('');
    const [d, setD] = useState(today());
    const [draft, setDraft] = useState({});
    const [records, setRecords] = useState({});
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [saving, setSaving] = useState('');
    const [error, setError] = useState('');
    const [submissionsError, setSubmissionsError] = useState('');

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

            const gs = Array.isArray(groupData) ? groupData : [];

            setGroups(gs);
            setStudents(Array.isArray(studentData) ? studentData : []);
            setHomeworks(Array.isArray(homeworkData) ? homeworkData : []);

            setG(current =>
                gs.some(x => String(x.id) === String(current))
                    ? current
                    : String(gs[0]?.id ?? '')
            );
        } catch (e) {
            setError(
                e?.message || "Ma'lumotlarni yuklashda xatolik yuz berdi."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Fetch this group's online submissions whenever the group changes.
    useEffect(() => {
        let cancelled = false;

        async function loadSubmissions() {
            if (!g) {
                setSubmissions([]);
                setSubmissionsError('');
                return;
            }

            setSubmissionsLoading(true);
            setSubmissionsError('');

            try {
                const data = await apiRequest(
                    `/hwcheck/submissions?groupId=${encodeURIComponent(g)}`
                );

                if (!cancelled) {
                    setSubmissions(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                if (!cancelled) {
                    setSubmissions([]);
                    setSubmissionsError(
                        e?.message ||
                        'O‘quvchi javoblarini yuklashda xatolik.'
                    );
                }
            } finally {
                if (!cancelled) setSubmissionsLoading(false);
            }
        }

        loadSubmissions();

        return () => {
            cancelled = true;
        };
    }, [g]);

    const group = groups.find(x => String(x.id) === String(g));

    const groupStudents = students.filter(
        s => String(s.groupId) === String(g)
    );

    const hws = homeworks.filter(h =>
        h.groupId != null
            ? String(h.groupId) === String(g)
            : h.level === group?.level
    );

    const recordKey = studentId => `${studentId}:${d}`;

    const rec = student => records[recordKey(student.id)] || null;

    const items = student => {
        if (draft[student.id]) {
            return draft[student.id];
        }

        const saved = rec(student);

        return hws.map(h => {
            const oldItem = saved?.items?.find(
                i => String(i.hwId) === String(h.id)
            );

            return oldItem
                ? { ...oldItem, hwId: h.id, title: h.title }
                : {
                    hwId: h.id,
                    title: h.title,
                    ticked: false,
                    crossed: false,
                    pct: '',
                };
        });
    };

    const updateItem = (student, index, patch) => {
        const currentItems = items(student);

        const updated = currentItems.map((item, i) =>
            i === index ? { ...item, ...patch } : item
        );

        setDraft(previous => ({
            ...previous,
            [student.id]: updated,
        }));
    };

    const changeGroup = value => {
        setG(value);
        setDraft({});
        setMsg('');
    };

    const changeDate = value => {
        setD(value);
        setDraft({});
        setMsg('');
    };

    const save = async student => {
        const currentItems = items(student);
        const id = String(student.id);

        setSaving(id);
        setMsg('');
        setError('');

        try {
            const result = await apiRequest('/manual-records', {
                method: 'POST',
                body: JSON.stringify({
                    studentId: student.id,
                    date: d,
                    items: currentItems.map(item => ({
                        hwId: item.hwId,
                        title: item.title,
                        ticked: Boolean(item.ticked),
                        crossed: Boolean(item.crossed),
                        pct: Math.max(
                            0,
                            Math.min(100, Number(item.pct) || 0)
                        ),
                    })),
                    note: 'Dars (qo‘lda)',
                }),
            });

            const savedRecord = {
                items: currentItems,
                avgScore: result?.avg ?? 0,
                avg: result?.avg ?? 0,
                cert: result?.cert ?? false,
            };

            setRecords(previous => ({
                ...previous,
                [recordKey(student.id)]: savedRecord,
            }));

            setDraft(previous => {
                const next = { ...previous };
                delete next[student.id];
                return next;
            });

            setMsg(
                `${student.name}: ${result?.avg ?? 0}%` +
                (result?.cert ? ' 🏆 Sertifikat berildi' : '')
            );
        } catch (e) {
            setError(
                e?.message ||
                `${student.name} uchun natijani saqlab bo'lmadi.`
            );
        } finally {
            setSaving('');
        }
    };

    if (loading) {
        return (
            <div style={PAGE}>
                <PageHeader />
                <div style={{ padding: 24 }}>
                    <div style={{ ...CARD, padding: '16px 18px', fontSize: 13, color: '#8a8a88' }}>
                        Ma'lumotlar yuklanmoqda...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={PAGE}>
            {/* Header: title on the left, group + date pickers on the right */}
            <PageHeader>
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                    }}
                >
                    <select
                        className="fi"
                        value={g}
                        onChange={e => changeGroup(e.target.value)}
                        style={{ ...FIELD, minWidth: 160 }}
                    >
                        {groups.length === 0 && (
                            <option value="">Guruhlar yo'q</option>
                        )}

                        {groups.map(x => (
                            <option key={x.id} value={x.id}>
                                {x.name}
                            </option>
                        ))}
                    </select>

                    <input
                        className="fi"
                        type="date"
                        value={d}
                        onChange={e => changeDate(e.target.value)}
                        style={FIELD}
                    />
                </div>
            </PageHeader>

            <div style={{ padding: 24 }}>
                {error && (
                    <div style={BANNER_ERR}>
                        <div>{error}</div>
                        <button
                            className="btn"
                            style={{ ...BTN_S, padding: '5px 12px', marginTop: 8 }}
                            onClick={loadData}
                        >
                            Qayta yuklash
                        </button>
                    </div>
                )}

                {msg && (
                    <div style={BANNER_OK}>
                        {msg}
                    </div>
                )}

                {submissionsError && (
                    <div style={BANNER_ERR}>
                        <div>
                            Javoblarni yuklab bo‘lmadi: {submissionsError}
                        </div>
                        <button
                            className="btn"
                            style={{ ...BTN_S, padding: '5px 12px', marginTop: 8 }}
                            onClick={() => setG(current => current)}
                        >
                            {/* Changing the group does not trigger a reload if unchanged. */}
                            Qayta yuklash
                        </button>
                    </div>
                )}

                {submissionsLoading && (
                    <div style={{ marginBottom: 12, fontSize: 13, color: '#8a8a88' }}>
                        O‘quvchi javoblari yuklanmoqda...
                    </div>
                )}

                {!groups.length && !error && (
                    <Empty icon="👥">
                        Hali guruhlar yaratilmagan.
                    </Empty>
                )}

                {group && !hws.length && (
                    <Empty icon="📝">
                        Bu guruh uchun vazifalar ro'yxati bo'sh.
                        Guruh/O'quvchi sahifasida vazifalar qo'shing.
                    </Empty>
                )}

                {group && groupStudents.length === 0 && (
                    <Empty icon="🧑‍🎓">
                        Bu guruhda o'quvchilar yo'q.
                    </Empty>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {groupStudents.map(student => {
                        const currentItems = items(student);

                        const completed = currentItems.filter(
                            item => item.ticked && !item.crossed
                        );

                        const avg = completed.length
                            ? Math.round(
                                completed.reduce(
                                    (sum, item) =>
                                        sum + Math.max(
                                            0,
                                            Math.min(100, Number(item.pct) || 0)
                                        ),
                                    0
                                ) / completed.length
                            )
                            : 0;

                        const saved = rec(student);

                        const studentSubmissions = submissions.filter(
                            sub => String(sub.studentId) === String(student.id)
                        );

                        return (
                            <div
                                key={student.id}
                                style={{ ...CARD, padding: '16px 18px' }}
                            >
                                <div style={{ marginBottom: 6 }}>
                                    <b style={{ fontSize: 15 }}>{student.name}</b>

                                    {saved && (
                                        <small style={{ color: '#8a8a88', fontSize: 12 }}>
                                            {' '}(saqlangan: {saved.avgScore}%)
                                        </small>
                                    )}
                                </div>

                                {currentItems.map((item, index) => (
                                    <div
                                        key={item.hwId}
                                        style={{
                                            display: 'flex',
                                            gap: 8,
                                            alignItems: 'center',
                                            padding: '8px 0',
                                            borderTop: '1px solid #eeeeec',
                                        }}
                                    >
                                        <span style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                                            {item.title}
                                        </span>

                                        <button
                                            type="button"
                                            className={
                                                'btn ' +
                                                (
                                                    item.ticked && !item.crossed
                                                        ? 'btn-p'
                                                        : ''
                                                )
                                            }
                                            style={MARK_BTN(item.ticked && !item.crossed)}
                                            onClick={() =>
                                                updateItem(student, index, {
                                                    ticked: true,
                                                    crossed: false,
                                                })
                                            }
                                            aria-label="Bajarildi"
                                        >
                                            ✓
                                        </button>

                                        <button
                                            type="button"
                                            className={
                                                'btn ' +
                                                (item.crossed ? 'btn-p' : '')
                                            }
                                            style={MARK_BTN(item.crossed)}
                                            onClick={() =>
                                                updateItem(student, index, {
                                                    crossed: true,
                                                    ticked: false,
                                                })
                                            }
                                            aria-label="Bajarilmadi"
                                        >
                                            ✗
                                        </button>

                                        <input
                                            className="fi"
                                            type="number"
                                            min="0"
                                            max="100"
                                            placeholder="%"
                                            value={item.pct ?? ''}
                                            disabled={!item.ticked || item.crossed}
                                            onChange={e =>
                                                updateItem(student, index, {
                                                    pct: e.target.value,
                                                })
                                            }
                                            style={{
                                                ...FIELD,
                                                width: 70,
                                                opacity: !item.ticked || item.crossed ? 0.5 : 1,
                                            }}
                                        />
                                    </div>
                                ))}

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginTop: 10,
                                        paddingTop: 12,
                                        borderTop: '1px solid #eeeeec',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <b style={{ fontSize: 14 }}>
                                        O'rtacha: {avg}% {avg >= 95 && '🏆'}
                                    </b>

                                    <button
                                        className="btn btn-p"
                                        style={{
                                            ...BTN_P,
                                            opacity: saving === String(student.id) ? 0.6 : 1,
                                        }}
                                        disabled={saving === String(student.id)}
                                        onClick={() => save(student)}
                                    >
                                        {saving === String(student.id)
                                            ? 'Saqlanmoqda...'
                                            : 'Saqlash'}
                                    </button>
                                </div>

                                <StudentSubmissions
                                    submissions={studentSubmissions}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}