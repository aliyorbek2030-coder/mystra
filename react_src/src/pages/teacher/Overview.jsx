
import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../lib/auth';

export default function Overview() {
    const [students, setStudents] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [signups, setSignups] = useState([]);
    const [review, setReview] = useState({ days: [], extra: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [studentData, ratingData, signupData, reviewData] =
                await Promise.all([
                    apiRequest('/students'),
                    apiRequest('/rating'),
                    apiRequest('/signups'),
                    apiRequest('/review'),
                ]);

            setStudents(Array.isArray(studentData) ? studentData : []);
            setRatings(Array.isArray(ratingData) ? ratingData : []);
            setSignups(Array.isArray(signupData) ? signupData : []);
            setReview({
                days: Array.isArray(reviewData?.days)
                    ? reviewData.days
                    : [],
                extra: Array.isArray(reviewData?.extra)
                    ? reviewData.extra
                    : [],
            });
        } catch (e) {
            setError(
                e?.message ||
                "Dashboard ma'lumotlarini yuklashda xatolik yuz berdi."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const rank = ratings
        .filter(x => Number(x.score) > 0)
        .sort((a, b) => Number(b.score) - Number(a.score))
        .slice(0, 10);

    const pending = signups.length;
    const reviewCount = review.days.length + review.extra.length;

    const styles = {
        page: {
            minHeight: '100vh',
            width: '100%',
            background: '#f7f7f5',
            padding: '28px',
            color: '#171717',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 28,
        },
        title: {
            fontSize: 25,
            fontWeight: 750,
            letterSpacing: '-0.7px',
            margin: 0,
            color: '#171717',
        },
        subtitle: {
            fontSize: 13,
            color: '#858585',
            marginTop: 7,
        },
        refresh: {
            border: '1px solid #e5e5e5',
            borderRadius: 10,
            background: '#fff',
            padding: '10px 15px',
            fontSize: 13,
            fontWeight: 600,
            color: '#333',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
        },
        stats: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
            gap: 12,
            marginBottom: 20,
        },
        stat: {
            background: '#fff',
            border: '1px solid #e7e7e4',
            borderRadius: 12,
            padding: '19px 18px',
            minHeight: 104,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
        },
        statLabel: {
            fontSize: 11,
            fontWeight: 650,
            color: '#929292',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
        },
        statNumber: {
            fontSize: 29,
            fontWeight: 750,
            letterSpacing: '-1px',
            lineHeight: 1,
            color: '#171717',
        },
        section: {
            background: '#fff',
            border: '1px solid #e7e7e4',
            borderRadius: 12,
            overflow: 'hidden',
            minWidth: 0,
        },
        sectionHeader: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            padding: '20px 21px',
            borderBottom: '1px solid #ededeb',
        },
        sectionTitle: {
            fontSize: 15,
            fontWeight: 700,
            margin: 0,
            color: '#202020',
        },
        sectionSubtitle: {
            fontSize: 12,
            color: '#999',
            marginTop: 5,
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
        },
        th: {
            padding: '13px 20px',
            background: '#f7f7f5',
            color: '#929292',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.65px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
        },
        td: {
            padding: '15px 20px',
            borderTop: '1px solid #f0f0ed',
            fontSize: 13,
            color: '#444',
        },
        badge: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 27,
            height: 25,
            padding: '0 8px',
            borderRadius: 7,
            background: '#f1f1ef',
            color: '#555',
            fontSize: 12,
            fontWeight: 700,
            boxSizing: 'border-box',
        },
        empty: {
            padding: '38px 20px',
            textAlign: 'center',
            color: '#999',
            fontSize: 13,
        },
    };

    const StatCard = ({ label, value, color, icon }) => (
        <div
            style={{
                ...styles.stat,
                borderLeft: `3px solid ${color}`,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                }}
            >
                <span style={styles.statLabel}>{label}</span>

                <span
                    style={{
                        width: 30,
                        height: 30,
                        borderRadius: 9,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${color}12`,
                        color,
                        fontSize: 15,
                    }}
                >
                    {icon}
                </span>
            </div>

            <div style={styles.statNumber}>{value}</div>
        </div>
    );

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>Overview</h2>
                        <div style={styles.subtitle}>
                            MYSTRA boshqaruv paneli
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        ...styles.section,
                        padding: 24,
                        color: '#888',
                        fontSize: 13,
                    }}
                >
                    Ma'lumotlar yuklanmoqda...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.page}>
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>Overview</h2>
                        <div style={styles.subtitle}>
                            MYSTRA boshqaruv paneli
                        </div>
                    </div>
                </div>

                <div style={{ ...styles.section, padding: 24 }}>
                    <p style={{ fontSize: 13, color: '#b42318' }}>
                        {error}
                    </p>

                    <button
                        style={styles.refresh}
                        onClick={loadData}
                    >
                        ↻ Qayta yuklash
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Umumiy ko'rinish</h2>

                    <div style={styles.subtitle}>
                        MYSTRA boshqaruv paneli · Barcha asosiy ko'rsatkichlar
                    </div>
                </div>

                <button
                    style={styles.refresh}
                    onClick={loadData}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = '#f7f7f5';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = '#fff';
                    }}
                >
                    <span style={{ fontSize: 16 }}>↻</span>
                    Yangilash
                </button>
            </div>

            <div style={styles.stats}>
                <StatCard
                    label="Jami o'quvchilar"
                    value={students.length}
                    color="#1476a8"
                    icon="♙"
                />

                <StatCard
                    label="Tekshirish kerak"
                    value={reviewCount}
                    color="#c09224"
                    icon="✓"
                />

                <StatCard
                    label="Yangi so'rovlar"
                    value={pending}
                    color="#7954c7"
                    icon="↗"
                />

                <StatCard
                    label="Reyting ishtirokchilari"
                    value={rank.length}
                    color="#239b62"
                    icon="★"
                />
            </div>

            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <div>
                        <h3 style={styles.sectionTitle}>
                            O'quvchilar reytingi
                        </h3>

                        <div style={styles.sectionSubtitle}>
                            Eng yuqori natijaga ega o'quvchilar
                        </div>
                    </div>

                    <span style={styles.badge}>
                        TOP {rank.length}
                    </span>
                </div>

                {rank.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>#</th>
                                    <th style={styles.th}>O'quvchi</th>
                                    <th style={styles.th}>Ball</th>
                                    <th style={styles.th}>O'rtacha natija</th>
                                </tr>
                            </thead>

                            <tbody>
                                {rank.map((x, i) => {
                                    const student = x.student || {};

                                    return (
                                        <tr
                                            key={student.id ?? i}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background =
                                                    '#fafaf8';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background =
                                                    '#fff';
                                            }}
                                        >
                                            <td style={styles.td}>
                                                <span
                                                    style={{
                                                        ...styles.badge,
                                                        background:
                                                            i === 0
                                                                ? '#fff5d9'
                                                                : '#f3f3f1',
                                                        color:
                                                            i === 0
                                                                ? '#9a7215'
                                                                : '#777',
                                                    }}
                                                >
                                                    {i + 1}
                                                </span>
                                            </td>

                                            <td
                                                style={{
                                                    ...styles.td,
                                                    fontWeight: 650,
                                                    color: '#242424',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {student.name || 'O‘quvchi'}
                                            </td>

                                            <td
                                                style={{
                                                    ...styles.td,
                                                    fontWeight: 700,
                                                    color: '#252525',
                                                }}
                                            >
                                                {x.score}
                                            </td>

                                            <td style={styles.td}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                        minWidth: 110,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            height: 5,
                                                            width: 65,
                                                            background: '#eeeeeb',
                                                            borderRadius: 10,
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                height: '100%',
                                                                width: `${Math.max(
                                                                    0,
                                                                    Math.min(
                                                                        100,
                                                                        Number(x.avg) || 0
                                                                    )
                                                                )}%`,
                                                                background: '#239b62',
                                                                borderRadius: 10,
                                                            }}
                                                        />
                                                    </div>

                                                    <span
                                                        style={{
                                                            fontWeight: 700,
                                                            color: '#239b62',
                                                        }}
                                                    >
                                                        {x.avg ?? 0}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={styles.empty}>
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: '#f5f5f2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 12px',
                                fontSize: 20,
                                color: '#999',
                            }}
                        >
                            ↗
                        </div>

                        <div
                            style={{
                                fontWeight: 650,
                                color: '#555',
                                marginBottom: 5,
                            }}
                        >
                            Hozircha reyting mavjud emas
                        </div>

                        <div style={{ fontSize: 12 }}>
                            O'quvchilar natijalari paydo bo'lganda,
                            ular shu yerda ko'rinadi.
                        </div>
                    </div>
                )}
            </div>

            <div
                style={{
                    marginTop: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                    fontSize: 11,
                    color: '#a0a09a',
                }}
            >
                <span>MYSTRA · Boshqaruv paneli</span>
                <span>Ma'lumotlar API orqali yuklanadi</span>
            </div>
        </div>
    );
}
