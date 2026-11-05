import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../lib/auth';

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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
};

const CARD = {
    backgroundColor: '#fff',
    border: '1px solid #E3E5EA',
    borderRadius: 12,
    boxSizing: 'border-box',
    padding: '16px 18px',
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

const Empty = ({ icon, children }) => (
    <div
        style={{
            textAlign: 'center',
            color: '#6B7080',
            fontSize: 14,
            padding: '28px 16px',
        }}
    >
        {icon && <div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>}
        {children}
    </div>
);

const currentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const fm = n => Number(n || 0).toLocaleString('ru-RU') + " so'm";

const getId = s => String(s?.id ?? '');

const findReport = (student, reports) =>
    reports.find(r => getId(r.student) === getId(student.id));

const findPayment = (student, payments) =>
    payments.find(p => getId(p.student) === getId(student.id));

export const reportText = (student, reports = [], payments = [], ym = currentMonth()) => {
    const r = findReport(student, reports);
    const p = findPayment(student, payments);

    const avg = r?.avg ?? 0;
    const rating = r?.rating;
    const att = r?.att;

    const attendance = att
        ? (att.t ? `${att.p}/${att.t}` : 'belgilanmagan')
        : 'belgilanmagan';

    const price = Number(p?.netPrice ?? 0);
    const paidAmount = Number(p?.paid ?? 0);

    let paid = 'belgilanmagan';

    if (p) {
        if (price <= 0) {
            paid = 'to‘lov talab qilinmaydi';
        } else if (paidAmount >= price) {
            paid = "to'langan";
        } else if (paidAmount > 0) {
            paid = `qisman (${fm(paidAmount)} / ${fm(price)})`;
        } else {
            paid = "to'lanmagan";
        }
    }

    return [
        `📋 ${student.name} · ${ym} hisoboti`,
        `📊 O'rtacha natija: ${avg}% · Reyting: ${rating ?? '—'}`,
        `📅 Davomat: ${attendance}`,
        `💳 Kurs to'lovi: ${paid}`,
        '',
        '— Muslima Teacher',
    ].join('\n');
};

export default function Parent() {
    const [students, setStudents] = useState([]);
    const [reports, setReports] = useState([]);
    const [payments, setPayments] = useState([]);
    const [botConfigured, setBotConfigured] = useState(false);

    const [ym, setYm] = useState(currentMonth());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sending, setSending] = useState('');
    const [copied, setCopied] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [studentData, reportData, paymentData, settingsData] =
                await Promise.all([
                    apiRequest('/students'),
                    apiRequest(`/reports/month?ym=${encodeURIComponent(ym)}`),
                    apiRequest(`/payments?ym=${encodeURIComponent(ym)}`),
                    apiRequest('/settings'),
                ]);

            setStudents(Array.isArray(studentData) ? studentData : []);
            setReports(Array.isArray(reportData) ? reportData : []);
            setPayments(Array.isArray(paymentData) ? paymentData : []);
            setBotConfigured(Boolean(settingsData?.bot?.configured));
        } catch (e) {
            setError(e?.message || "Ma'lumotlarni yuklashda xatolik yuz berdi.");
        } finally {
            setLoading(false);
        }
    }, [ym]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getText = student =>
        reportText(student, reports, payments, ym);

    const copyReport = async student => {
        const text = getText(student);

        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error('Clipboard mavjud emas');
            }

            await navigator.clipboard.writeText(text);
            setCopied(getId(student));
            setTimeout(() => setCopied(''), 2000);
        } catch {
            alert("Hisobotni nusxalab bo'lmadi. Brauzer ruxsatlarini tekshiring.");
        }
    };

    const sendReport = async student => {
        if (!botConfigured) {
            alert("Telegram bot sozlanmagan. Sozlamalar bo'limini tekshiring.");
            return;
        }

        const id = getId(student);

        setSending(id);

        try {
            const result = await apiRequest('/telegram/send', {
                method: 'POST',
                body: JSON.stringify({
                    text: getText(student),
                }),
            });

            if (result?.sent) {
                alert('Telegram orqali yuborildi ✓');
            } else {
                alert("Telegram xabarni yubora olmadi. Bot sozlamalarini tekshiring.");
            }
        } catch (e) {
            alert(e?.message || 'Telegram orqali yuborishda xatolik yuz berdi.');
        } finally {
            setSending('');
        }
    };

    return (
        <div style={PAGE}>
            {/* Header: title on the left, month picker on the right */}
            <div style={HEADER}>
                <div>
                    <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 2px 0', color: '#12131A' }}>
                        Ota-ona hisoboti
                    </h1>
                    <p style={{ color: '#5B6070', margin: 0, fontSize: 13 }}>
                        Oylik natijani nusxalang yoki Telegram orqali yuboring
                    </p>
                </div>

                <input
                    className="fi"
                    type="month"
                    value={ym}
                    onChange={e => setYm(e.target.value)}
                    style={{ ...FIELD, maxWidth: 190 }}
                />
            </div>

            <div style={{ padding: 24 }}>
                {loading && (
                    <div style={{ ...CARD, fontSize: 13, color: '#5B6070' }}>
                        Ma'lumotlar yuklanmoqda...
                    </div>
                )}

                {error && (
                    <div
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
                        <p style={{ margin: '0 0 8px' }}>
                            {error}
                        </p>

                        <button className="btn btn-p" style={BTN_P} onClick={loadData}>
                            Qayta yuklash
                        </button>
                    </div>
                )}

                {!loading && !error && students.length === 0 && (
                    <Empty icon="🧑‍🎓">
                        Hozircha o'quvchilar mavjud emas.
                    </Empty>
                )}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: 14,
                        alignItems: 'start',
                    }}
                >
                    {!loading && !error && students.map(student => {
                        const text = getText(student);
                        const id = getId(student);
                        const payment = findPayment(student, payments);
                        const report = findReport(student, reports);

                        return (
                            <div style={CARD} key={id}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <b style={{ fontSize: 15 }}>{student.name}</b>

                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: '#0b6a9a',
                                            backgroundColor: '#e8f4fb',
                                            padding: '2px 8px',
                                            borderRadius: 999,
                                        }}
                                    >
                                        {ym}
                                    </span>
                                </div>

                                <pre
                                    style={{
                                        whiteSpace: 'pre-wrap',
                                        overflowWrap: 'anywhere',
                                        font: 'inherit',
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                        color: '#2A2C38',
                                        background: '#F4F5F7',
                                        border: '1px solid #EEF0F3',
                                        borderRadius: 12,
                                        padding: '12px 14px',
                                        margin: '12px 0',
                                    }}
                                >
                                    {text}
                                </pre>

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 8,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <button
                                        className="btn"
                                        style={BTN_S}
                                        onClick={() => copyReport(student)}
                                    >
                                        {copied === id
                                            ? '✓ Nusxalandi'
                                            : '📋 Nusxa'}
                                    </button>

                                    <button
                                        className="btn btn-p"
                                        style={{ ...BTN_P, opacity: Boolean(sending) ? 0.6 : 1 }}
                                        onClick={() => sendReport(student)}
                                        disabled={Boolean(sending)}
                                    >
                                        {sending === id
                                            ? 'Yuborilmoqda...'
                                            : '✈️ Telegram'}
                                    </button>
                                </div>

                                {!report && (
                                    <div
                                        style={{
                                            marginTop: 10,
                                            fontSize: 12,
                                            color: '#5B6070',
                                        }}
                                    >
                                        Bu oy uchun hisobot ma'lumotlari topilmadi.
                                    </div>
                                )}

                                {!payment && (
                                    <div
                                        style={{
                                            marginTop: 6,
                                            fontSize: 12,
                                            color: '#5B6070',
                                        }}
                                    >
                                        To'lov ma'lumotlari topilmadi.
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}