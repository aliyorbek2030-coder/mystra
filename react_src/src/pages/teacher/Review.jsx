import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../lib/auth';
import { adjScore } from '../../lib/helpers';

// --- DESIGN ONLY (no logic) ---
const PAGE = {
    width: '100%',
    maxWidth: 'none',
    margin: 0,
    boxSizing: 'border-box',
    padding: 0,
    fontFamily: "'Onest', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    color: '#12131A',
    backgroundColor: '#F4F5F7',
    minHeight: '100vh',
};

const HEADER = {
    backgroundColor: '#fff',
    borderBottom: '1px solid #E3E5EA',
    padding: '20px 24px 14px',
};

const CARD = {
    backgroundColor: '#fff',
    border: '1px solid #E3E5EA',
    borderRadius: 12,
    boxSizing: 'border-box',
    padding: '16px 18px',
    marginBottom: 12,
};

const FIELD = {
    boxSizing: 'border-box',
    padding: '8px 10px',
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

const BTN_P = {
    padding: '8px 14px',
    backgroundColor: '#5B4BFF',
    color: '#fff',
    border: '1px solid #5B4BFF',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 500,
};

const BTN_S = {
    padding: '8px 14px',
    backgroundColor: '#fff',
    color: '#12131A',
    border: '1px solid #D9DCE3',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 500,
};

const BTN_WARN = {
    ...BTN_S,
    color: '#d97706',
    border: '1px solid #e8a33d',
};

const dim = on => ({ opacity: on ? 0.6 : 1 });

const SECTION_TITLE = {
    fontSize: 15,
    fontWeight: 600,
    color: '#12131A',
    margin: '28px 0 12px',
};

const BADGE = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    backgroundColor: '#e8f4fb',
    color: '#0b6a9a',
    fontSize: 11,
    fontWeight: 600,
};

const BANNER_ERR = {
    color: '#DC2626',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 13,
    marginBottom: 12,
    overflowWrap: 'anywhere',
};

const BANNER_OK = {
    color: '#15803D',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 13,
    marginBottom: 12,
};

const Empty = ({ icon, children }) => (
    <div
        style={{
            textAlign: 'center',
            color: '#6B7080',
            fontSize: 14,
            padding: '20px 16px',
        }}
    >
        {icon && <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>}
        {children}
    </div>
);

import { API_ROOT as API_BASE } from '../../lib/config';

const mediaUrl = (path) => {
    if (!path) return '';

    if (/^(https?:|data:|blob:)/i.test(path)) {
        return path;
    }

    return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

const AuthenticatedFile = ({ path, name, type }) => {
    const [src, setSrc] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!path) {
            setSrc('');
            setError('');
            return undefined;
        }

        let cancelled = false;
        let objectUrl = null;
        const controller = new AbortController();

        setSrc('');
        setError('');

        const url = mediaUrl(path);

        // Data URLs and existing blob URLs don't require authentication.
        if (/^(data:|blob:)/i.test(url)) {
            setSrc(url);

            return () => {
                cancelled = true;
            };
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(url, API_BASE);
        } catch {
            setError('Fayl manzili noto‘g‘ri.');
            return undefined;
        }

        const apiOrigin = new URL(API_BASE).origin;
        const headers = {};

        // Only send the authentication token to our own backend.
        if (parsedUrl.origin === apiOrigin) {
            const token = localStorage.getItem('mys_token');

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
        }

        fetch(url, {
            headers,
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) {
                    if (
                        response.status === 401 ||
                        response.status === 403
                    ) {
                        throw new Error(
                            'Ruxsat berilmadi. Qayta tizimga kiring.'
                        );
                    }

                    throw new Error(
                        `Faylni yuklab bo‘lmadi (${response.status}).`
                    );
                }

                return response.blob();
            })
            .then((blob) => {
                if (cancelled) return;

                objectUrl = URL.createObjectURL(blob);
                setSrc(objectUrl);
            })
            .catch((err) => {
                if (
                    err.name !== 'AbortError' &&
                    !cancelled
                ) {
                    setError(
                        err.message || 'Faylni ochib bo‘lmadi.'
                    );
                }
            });

        return () => {
            cancelled = true;
            controller.abort();

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [path]);

    if (error) {
        return (
            <p
                role="alert"
                style={{
                    color: '#DC2626',
                    fontSize: 13,
                    margin: '4px 0',
                    overflowWrap: 'anywhere',
                }}
            >
                ⚠️ {error}
            </p>
        );
    }

    if (!src) {
        return (
            <span style={{ color: '#5B6070', fontSize: 13 }}>
                Fayl yuklanmoqda...
            </span>
        );
    }

    if (type === 'audio') {
        return (
            <audio
                controls
                preload="metadata"
                src={src}
                style={{
                    display: 'block',
                    width: '100%',
                    marginTop: 6,
                }}
            >
                Brauzeringiz audio faylni qo‘llab-quvvatlamaydi.
            </audio>
        );
    }

    if (type === 'image') {
        return (
            <a
                href={src}
                target="_blank"
                rel="noreferrer"
            >
                <img
                    src={src}
                    alt={name || 'O‘quvchi yuborgan rasm'}
                    style={{
                        display: 'block',
                        maxWidth: '100%',
                        maxHeight: 400,
                        objectFit: 'contain',
                        borderRadius: 12,
                        border: '1px solid #E3E5EA',
                    }}
                />
            </a>
        );
    }

    return (
        <a
            href={src}
            target="_blank"
            rel="noreferrer"
            download={name || undefined}
            style={{ color: '#12131A', fontSize: 13 }}
        >
            Ochish / yuklab olish
        </a>
    );
};

const Media = ({ s }) => (
    <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
        {s.text && (
            <p
                style={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    margin: 0,
                    padding: '10px 12px',
                    background: '#F4F5F7',
                    border: '1px solid #EEF0F3',
                    borderRadius: 12,
                    fontSize: 13,
                }}
            >
                {s.text}
            </p>
        )}

        {s.audio && (
            <div>
                <b style={{ fontSize: 13 }}>🎤 O‘quvchining ovozli javobi</b>

                <AuthenticatedFile
                    path={s.audio}
                    name="Ovozli javob"
                    type="audio"
                />
            </div>
        )}

        {(Array.isArray(s.files) ? s.files : []).map((f, i) => {
            const path = f.u || f.d;

            if (!path) return null;

            const isImage =
                (f.mime || '').startsWith('image/') ||
                /^data:image\//i.test(path);

            return (
                <div
                    key={`${f.n || 'file'}-${i}`}
                    style={{ marginTop: 6 }}
                >
                    {isImage ? (
                        <AuthenticatedFile
                            path={path}
                            name={f.n || 'O‘quvchi yuborgan rasm'}
                            type="image"
                        />
                    ) : (
                        <div style={{ fontSize: 13 }}>
                            📎 {f.n || 'Yuborilgan fayl'}{' '}

                            <AuthenticatedFile
                                path={path}
                                name={f.n || 'student-submission'}
                                type="file"
                            />
                        </div>
                    )}
                </div>
            );
        })}
    </div>
);

export default function Review() {
    const [days, setDays] = useState([]);
    const [extra, setExtra] = useState([]);
    const [students, setStudents] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [scores, setScores] = useState({});
    const [busy, setBusy] = useState({});
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadData = useCallback(async () => {
        setError('');

        try {
            const [reviewData, studentsData] = await Promise.all([
                apiRequest('/review'),
                apiRequest('/students'),
            ]);

            setDays(reviewData.days || []);
            setExtra(reviewData.extra || []);

            setStudents(
                Array.isArray(studentsData)
                    ? studentsData
                    : studentsData.students || []
            );

            setSubscriptions([]);
        } catch (e) {
            setError(
                e.message || 'Ma’lumotlarni yuklashda xatolik'
            );
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const runAction = async (key, action, successText) => {
        if (busy[key]) return;

        setBusy((prev) => ({
            ...prev,
            [key]: true,
        }));

        setError('');
        setMessage('');

        try {
            await action();

            setMessage(successText);

            await loadData();
        } catch (e) {
            setError(
                e.message || 'Amalni bajarishda xatolik'
            );
        } finally {
            setBusy((prev) => ({
                ...prev,
                [key]: false,
            }));
        }
    };

    const changeScore = (id, value) => {
        setScores((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const getScore = (submission) => {
        const value = scores[submission.id];

        if (value !== undefined) {
            return value;
        }

        return (
            submission.suggested?.score ??
            submission.ai?.score ??
            0
        );
    };

    const approveDay = (day) => {
        const key = `day-${day.id}`;

        return runAction(
            key,
            async () => {
                const submittedScores = {};

                (day.items || []).forEach((item) => {
                    submittedScores[item.id] = Math.max(
                        0,
                        Math.min(
                            100,
                            Number(getScore(item)) || 0
                        )
                    );
                });

                await apiRequest(
                    `/review/days/${day.id}/approve`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            scores: submittedScores,
                        }),
                    }
                );
            },
            'Kunlik vazifalar tasdiqlandi ✓'
        );
    };

    const returnDay = (day) => {
        const key = `return-day-${day.id}`;

        return runAction(
            key,
            () =>
                apiRequest(
                    `/review/days/${day.id}/return`,
                    {
                        method: 'POST',
                        body: JSON.stringify({}),
                    }
                ),
            'Vazifalar qayta topshirish uchun qaytarildi'
        );
    };

    const approveExtra = (submission) => {
        const key = `extra-${submission.id}`;

        return runAction(
            key,
            () =>
                apiRequest(
                    `/review/submissions/${submission.id}/approve`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            final: Math.max(
                                0,
                                Math.min(
                                    100,
                                    Number(getScore(submission)) || 0
                                )
                            ),
                        }),
                    }
                ),
            'Vazifa tasdiqlandi ✓'
        );
    };

    const returnExtra = (submission) => {
        const key = `return-extra-${submission.id}`;

        return runAction(
            key,
            () =>
                apiRequest(
                    `/review/submissions/${submission.id}/return`,
                    {
                        method: 'POST',
                        body: JSON.stringify({}),
                    }
                ),
            'Vazifa qayta topshirish uchun qaytarildi'
        );
    };

    const extendSubscription = (student) => {
        const key = `sub-${student.id}`;

        return runAction(
            key,
            () =>
                apiRequest(
                    `/subscriptions/${student.id}/extend`,
                    {
                        method: 'POST',
                        body: JSON.stringify({}),
                    }
                ),
            `${student.name} obunasi 30 kunga uzaytirildi`
        );
    };

    const person = (item) => {
        if (item.student) return item.student;

        return (
            students.find(
                (student) => student.id === item.studentId
            ) || {}
        );
    };

    const studentId = (item) =>
        item.student?.id || item.studentId;

    const isBusy = (key) => Boolean(busy[key]);

    return (
        <div style={PAGE}>
            <div style={HEADER}>
                <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 2px 0', color: '#12131A' }}>
                    Talabalarning yangi vazifalari
                </h1>
                <p style={{ color: '#5B6070', margin: 0, fontSize: 13 }}>
                    Kunlik ish, extra work va obunalarni tekshiring
                </p>
            </div>

            <div style={{ padding: 24 }}>
                <h2 style={{ ...SECTION_TITLE, marginTop: 0 }}>
                    Kunlik vazifalar ({days.length})
                </h2>

                {error && (
                    <div style={BANNER_ERR}>
                        {error}

                        <button
                            className="btn"
                            onClick={loadData}
                            style={{ ...BTN_S, padding: '4px 10px', marginLeft: 8 }}
                        >
                            Qayta yuklash
                        </button>
                    </div>
                )}

                {message && (
                    <div style={BANNER_OK}>
                        {message}

                        <button
                            className="btn"
                            onClick={() => setMessage('')}
                            style={{ ...BTN_S, padding: '2px 8px', marginLeft: 8 }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {days.map((day) => {
                    const student = person(day);
                    const items = day.items || [];

                    const total = items.length
                        ? Math.round(
                            items.reduce(
                                (sum, item) =>
                                    sum +
                                    (Number(getScore(item)) || 0),
                                0
                            ) / items.length
                        )
                        : 0;

                    return (
                        <div style={CARD} key={day.id}>
                            <div style={{ fontSize: 14 }}>
                                <b style={{ fontSize: 15 }}>{student.name || 'O‘quvchi'}</b>
                                <span style={{ color: '#5B6070' }}>
                                    {' · '}
                                    {day.day}
                                    {' ('}
                                    {items.length}/{day.total}
                                    {')'}
                                </span>
                            </div>

                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    style={{
                                        marginTop: 12,
                                        paddingTop: 12,
                                        borderTop:
                                            '1px solid #EEF0F3',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 8,
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <b style={{ fontSize: 14 }}>{item.title || 'Vazifa'}</b>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={BADGE}>
                                                AI {item.ai?.score ?? 0}%
                                            </span>

                                            <span>
                                                <input
                                                    className="fi"
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    style={{
                                                        ...FIELD,
                                                        width: 84,
                                                        display: 'inline-block',
                                                    }}
                                                    value={getScore(item)}
                                                    onChange={(e) =>
                                                        changeScore(
                                                            item.id,
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                {' '}%
                                            </span>
                                        </div>
                                    </div>

                                    <Media s={item} />

                                    {item.ai?.feedback && (
                                        <small
                                            style={{
                                                display: 'block',
                                                marginTop: 8,
                                                fontSize: 12,
                                                color: '#5B6070',
                                            }}
                                        >
                                            🤖 {item.ai.feedback}
                                        </small>
                                    )}
                                </div>
                            ))}

                            <div
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    marginTop: 14,
                                    paddingTop: 14,
                                    borderTop: '1px solid #EEF0F3',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <b style={{ fontSize: 14 }}>Umumiy: {total}%</b>

                                <small style={{ color: '#5B6070', fontSize: 12, flex: 1, minWidth: 120 }}>
                                    {total >= 95
                                        ? '🏆 Sertifikat berilishi mumkin'
                                        : '(sertifikat uchun 95% kerak)'}
                                </small>

                                <button
                                    className="btn btn-p"
                                    style={{ ...BTN_P, ...dim(isBusy(`day-${day.id}`)) }}
                                    disabled={isBusy(`day-${day.id}`)}
                                    onClick={() => approveDay(day)}
                                >
                                    {isBusy(`day-${day.id}`)
                                        ? 'Saqlanmoqda...'
                                        : 'Tasdiqlash'}
                                </button>

                                <button
                                    className="btn"
                                    style={{ ...BTN_WARN, ...dim(isBusy(`return-day-${day.id}`)) }}
                                    disabled={isBusy(
                                        `return-day-${day.id}`
                                    )}
                                    onClick={() => returnDay(day)}
                                >
                                    🔄 Qayta topshirtirish
                                </button>
                            </div>
                        </div>
                    );
                })}

                {!days.length && !error && (
                    <Empty icon="✅">
                        Kutayotgan kunlik ish yo‘q
                    </Empty>
                )}

                <h2 style={SECTION_TITLE}>⭐ Extra work ({extra.length})</h2>

                {extra.map((submission) => {
                    const student = person(submission);

                    return (
                        <div
                            style={CARD}
                            key={submission.id}
                        >
                            <div style={{ fontSize: 14 }}>
                                <b style={{ fontSize: 15 }}>{student.name || 'O‘quvchi'}</b>
                                <span style={{ color: '#5B6070' }}>
                                    {' · '}
                                    {submission.title || 'Extra work'}
                                </span>
                            </div>

                            <Media s={submission} />

                            <div style={{ marginTop: 8 }}>
                                <small style={{ fontSize: 12, color: '#5B6070' }}>
                                    🤖 AI {submission.ai?.score ?? 0}%
                                    {submission.ai?.feedback
                                        ? ` — ${submission.ai.feedback}`
                                        : ''}
                                </small>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    marginTop: 14,
                                    paddingTop: 14,
                                    borderTop: '1px solid #EEF0F3',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                }}
                            >
                                <input
                                    className="fi"
                                    type="number"
                                    min="0"
                                    max="100"
                                    style={{ ...FIELD, width: 100 }}
                                    value={getScore(submission)}
                                    onChange={(e) =>
                                        changeScore(
                                            submission.id,
                                            e.target.value
                                        )
                                    }
                                />

                                <button
                                    className="btn btn-p"
                                    style={{ ...BTN_P, ...dim(isBusy(`extra-${submission.id}`)) }}
                                    disabled={isBusy(
                                        `extra-${submission.id}`
                                    )}
                                    onClick={() =>
                                        approveExtra(submission)
                                    }
                                >
                                    {isBusy(`extra-${submission.id}`)
                                        ? 'Saqlanmoqda...'
                                        : 'Tasdiqlash'}
                                </button>

                                <button
                                    className="btn"
                                    style={{ ...BTN_WARN, ...dim(isBusy(`return-extra-${submission.id}`)) }}
                                    disabled={isBusy(
                                        `return-extra-${submission.id}`
                                    )}
                                    onClick={() =>
                                        returnExtra(submission)
                                    }
                                >
                                    🔄 Qayta
                                </button>
                            </div>
                        </div>
                    );
                })}

                {!extra.length && (
                    <Empty icon="⭐">
                        Kutayotgan extra work yo‘q
                    </Empty>
                )}

                <h2 style={SECTION_TITLE}>Obunalar (9 900 so‘m/oy)</h2>

                {students.map((student) => (
                    <div
                        key={student.id}
                        style={{
                            ...CARD,
                            padding: '12px 18px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                        }}
                    >
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{student.name}</span>

                        <button
                            className="btn"
                            style={{ ...BTN_S, ...dim(isBusy(`sub-${student.id}`)) }}
                            disabled={isBusy(`sub-${student.id}`)}
                            onClick={() =>
                                extendSubscription(student)
                            }
                        >
                            {isBusy(`sub-${student.id}`)
                                ? 'Uzaytirilmoqda...'
                                : '+30 kun'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}