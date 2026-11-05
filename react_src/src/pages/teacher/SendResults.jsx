import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../lib/auth';

import { ymNow } from '../../lib/helpers';
import { sendCertQuiet } from '../../components/CertImage';

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
    padding: '24px 24px 14px',
};

const CARD = {
    backgroundColor: '#fff',
    border: '1px solid #E3E5EA',
    borderRadius: 12,
    padding: '16px 18px',
    boxSizing: 'border-box',
};

const FIELD = {
    boxSizing: 'border-box',
    padding: '9px 12px',
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

const BTN_PRIMARY = {
    padding: '9px 16px',
    backgroundColor: '#5B4BFF',
    color: '#fff',
    border: '1px solid #5B4BFF',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 500,
};

const BTN_SECONDARY = {
    padding: '9px 16px',
    backgroundColor: '#fff',
    color: '#12131A',
    border: '1px solid #D9DCE3',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 500,
};

const PageHeader = () => (
    <div style={HEADER}>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 2px 0', color: '#12131A' }}>
            Natijalarni Telegramga yuborish
        </h1>
        <p style={{ color: '#5B6070', margin: 0, fontSize: 13 }}>
            Tekshirilgan vazifalar natijalarini guruh chatiga yuboring
        </p>
    </div>
);

export default function SendResults() {
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [certificates, setCertificates] = useState([]);

    const [groupId, setGroupId] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [groupResponse, studentResponse, ratingResponse] =
                await Promise.all([
                    apiRequest('/groups'),
                    apiRequest('/students'),
                    apiRequest('/rating'),
                ]);

            const groupData = Array.isArray(groupResponse)
                ? groupResponse
                : groupResponse.results || [];

            const studentData = Array.isArray(studentResponse)
                ? studentResponse
                : studentResponse.results || [];

            const ratingData = Array.isArray(ratingResponse)
                ? ratingResponse
                : ratingResponse.results || ratingResponse.ratings || [];

            setGroups(groupData);
            setStudents(studentData);
            setRatings(ratingData);

            if (
                !groupId ||
                !groupData.some(
                    group => String(group.id) === String(groupId)
                )
            ) {
                setGroupId(String(groupData[0]?.id || ''));
            }

            const certificateResponse = await apiRequest(
                '/certificates'
            );

            const certificateData = Array.isArray(certificateResponse)
                ? certificateResponse
                : certificateResponse.results || [];

            setCertificates(certificateData);
        } catch (err) {
            setError(
                `Ma'lumotlarni yuklashda xatolik: ${err.message}`
            );
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const group = groups.find(
        item => String(item.id) === String(groupId)
    );

    const groupStudents = students.filter(
        student =>
            String(student.groupId ?? student.group_id) ===
            String(groupId)
    );

    const rows = groupStudents
        .map(student => {
            const rating = ratings.find(
                item =>
                    String(item.studentId ?? item.student_id ?? item.id) ===
                    String(student.id)
            );

            return {
                student,
                avg: Number(rating?.avg ?? rating?.average ?? 0),
                score: Number(rating?.score ?? rating?.points ?? 0),
            };
        })
        .sort((a, b) => b.score - a.score);

    const month = ymNow();

    const groupCertificates = certificates.filter(certificate => {
        const studentId =
            certificate.studentId ?? certificate.student_id;

        return (
            groupStudents.some(
                student => String(student.id) === String(studentId)
            ) &&
            String(certificate.date || certificate.createdAt || '')
                .startsWith(month)
        );
    });

    const report =
        `🏆 ${group?.name || 'Guruh'} · ${month} natijalari\n\n` +
        rows
            .map(
                (row, index) =>
                    `${['🥇', '🥈', '🥉'][index] || `${index + 1}.`} ` +
                    `${row.student.name} — ${row.avg}% (${row.score} ball)`
            )
            .join('\n') +
        '\n\n— MYSTRA';

    const send = async withCertificates => {
        if (!groupId) {
            setError('Avval guruhni tanlang.');
            return;
        }

        if (busy) return;

        setBusy(true);
        setError('');
        setMessage('');

        try {
            await apiRequest('/telegram/send-results', {
                method: 'POST',
                body: JSON.stringify({
                    groupId,
                    month,
                    includeCertificates: withCertificates,
                    text: report,
                    certificateIds: withCertificates
                        ? groupCertificates.map(item => item.id)
                        : [],
                }),
            });

            setMessage('Natijalar muvaffaqiyatli yuborildi ✓');

            if (withCertificates) {
                for (const certificate of groupCertificates) {
                    const studentId =
                        certificate.studentId ??
                        certificate.student_id;

                    const student = groupStudents.find(
                        item => String(item.id) === String(studentId)
                    );

                    if (student) {
                        try {
                            await sendCertQuiet(certificate, student);
                        } catch (err) {
                            console.error(
                                'Sertifikat yuborilmadi:',
                                err
                            );
                        }
                    }
                }
            }
        } catch (err) {
            setError(
                `Yuborilmadi: ${err.message}`
            );
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div style={PAGE}>
                <PageHeader />
                <div style={{ padding: 24 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#5B6070' }}>
                        Ma'lumotlar yuklanmoqda...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={PAGE}>
            <PageHeader />

            <div style={{ padding: 24 }}>
                {error && (
                    <div
                        role="alert"
                        style={{
                            color: 'var(--danger, #DC2626)',
                            overflowWrap: 'anywhere',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: 10,
                            padding: '10px 12px',
                            fontSize: 13,
                            marginBottom: 14,
                        }}
                    >
                        {error}

                        <button
                            className="btn"
                            onClick={loadData}
                            disabled={busy}
                            style={{ ...BTN_SECONDARY, padding: '4px 10px', marginLeft: 8 }}
                        >
                            Qayta yuklash
                        </button>
                    </div>
                )}

                {message && (
                    <div
                        role="status"
                        style={{
                            color: '#15803D',
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 10,
                            padding: '10px 12px',
                            fontSize: 13,
                            marginBottom: 14,
                        }}
                    >
                        {message}
                    </div>
                )}

                {/* Group row: info on the left, select on the right */}
                <div
                    style={{
                        ...CARD,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 16,
                        flexWrap: 'wrap',
                        marginBottom: 14,
                    }}
                >
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: '#12131A' }}>
                            {group ? group.name : 'Guruh tanlanmagan'}
                        </div>
                        {group && (
                            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#5B6070' }}>
                                {groupStudents.length} o'quvchi · {month}
                            </p>
                        )}
                    </div>

                    <select
                        className="fi"
                        value={groupId}
                        onChange={event => setGroupId(event.target.value)}
                        disabled={busy}
                        style={{ ...FIELD, minWidth: 220 }}
                    >
                        <option value="">Guruhni tanlang</option>

                        {groups.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Report preview */}
                <pre
                    style={{
                        ...CARD,
                        whiteSpace: 'pre-wrap',
                        font: 'inherit',
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: '#12131A',
                        margin: '0 0 14px',
                    }}
                >
                    {report}
                </pre>

                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                    }}
                >
                    <button
                        className="btn btn-p"
                        style={{
                            ...BTN_PRIMARY,
                            opacity: busy || !groupId || !rows.length ? 0.5 : 1,
                        }}
                        disabled={busy || !groupId || !rows.length}
                        onClick={() => send(false)}
                    >
                        ✈️ Reytingni yuborish
                    </button>

                    <button
                        className="btn"
                        style={{
                            ...BTN_SECONDARY,
                            opacity:
                                busy || !groupId || !groupCertificates.length
                                    ? 0.5
                                    : 1,
                        }}
                        disabled={
                            busy ||
                            !groupId ||
                            !groupCertificates.length
                        }
                        onClick={() => send(true)}
                    >
                        🏆 + {groupCertificates.length} ta sertifikat
                    </button>
                </div>
            </div>
        </div>
    );
}