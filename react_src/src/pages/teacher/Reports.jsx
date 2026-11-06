import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../lib/auth';
import CertImage from '../../components/CertImage';

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

const SECTION_TITLE = {
  fontSize: 14,
  fontWeight: 600,
  color: '#12131A',
  margin: '0 0 12px',
};

const TH = {
  textAlign: 'left',
  padding: '10px 14px',
  fontSize: 11,
  fontWeight: 500,
  color: '#5B6070',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  backgroundColor: '#F4F5F7',
  whiteSpace: 'nowrap',
};

const TD = {
  padding: '12px 14px',
  fontSize: 13,
  color: '#12131A',
};

const EMPTY = {
  textAlign: 'center',
  color: '#6B7080',
  fontSize: 13,
  padding: '18px 14px',
};

function Chart({ pts }) {
  if (pts.length < 2) {
    return (
      <div style={{ color: 'var(--text3)' }}>
        Grafik uchun kamida 2 natija kerak
      </div>
    );
  }

  const W = 320;
  const H = 120;
  const x = i => 10 + i * (W - 20) / (pts.length - 1);
  const y = v => H - 10 - v * (H - 20) / 100;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <polyline
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        points={pts.map((p, i) => `${x(i)},${y(p)}`).join(' ')}
      />

      {pts.map((p, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(p)}
          r="3.5"
          fill="var(--accent)"
        />
      ))}

      <line
        x1="10"
        x2={W - 10}
        y1={y(95)}
        y2={y(95)}
        stroke="var(--success)"
        strokeDasharray="4"
      />
    </svg>
  );
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function Reports() {
  const [ym, setYm] = useState(currentMonth());
  const [rows, setRows] = useState([]);
  const [groups, setGroups] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [certs, setCerts] = useState([]);
  const [sid, setSid] = useState('');
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [reportData, groupData, ratingData, certificateData] =
        await Promise.all([
          apiRequest(`/reports/month?ym=${encodeURIComponent(ym)}`),
          apiRequest('/groups'),
          apiRequest('/rating'),
          apiRequest('/certificates'),
        ]);

      const reportRows = Array.isArray(reportData) ? reportData : [];
      const groupRows = Array.isArray(groupData) ? groupData : [];
      const ratingRows = Array.isArray(ratingData) ? ratingData : [];
      const certificateRows = Array.isArray(certificateData)
        ? certificateData
        : [];

      setRows(reportRows);
      setGroups(groupRows);
      setRatings(ratingRows);
      setCerts(certificateRows);

      setSid(previous => {
        if (reportRows.some(row => row.student?.id === previous)) {
          return previous;
        }

        return reportRows[0]?.student?.id || '';
      });
    } catch (e) {
      setError(e.message || 'Hisobotlarni yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }, [ym]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  /*
   * Monthly reports are available from the backend.
   * For the progress chart, fetch each student's archive
   * using their student account endpoint only if supported.
   * We do not use localStorage as a substitute for backend data.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      if (!sid) {
        setProgress([]);
        return;
      }

      try {
        const archive = await apiRequest(`/students/${sid}/archive`);

        if (cancelled) return;

        const months = Array.isArray(archive) ? archive : [];
        const records = months
          .flatMap(month => month.recs || [])
          .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

        setProgress(records.slice(-12).map(record => Number(record.avgScore) || 0));
      } catch {
        if (!cancelled) setProgress([]);
      }
    }

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [sid]);

  const students = rows
    .map(row => row.student)
    .filter(Boolean);

  const selectedStudent = students.find(student => student.id === sid);

  const studentCerts = certs
    .filter(cert => cert.studentId === sid)
    .slice(0, 12);

  const getGroupName = student => {
    const groupId = student?.groupId;

    return groups.find(group => group.id === groupId)?.name || '—';
  };

  const getRating = studentId => {
    const rating = ratings.find(
      row => row.student?.id === studentId
    );

    return rating?.score ?? '—';
  };

  return (
    <div style={PAGE}>
      {/* Header: title on the left, month picker on the right */}
      <div style={HEADER}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 2px 0', color: '#12131A' }}>
            📅 Oylik hisobot
          </h1>
          <p style={{ color: '#5B6070', margin: 0, fontSize: 13 }}>
            Har oy alohida saqlanadi — hisobot va progress
          </p>
        </div>

        <input
          className="fi"
          type="month"
          value={ym}
          onChange={e => setYm(e.target.value)}
          style={FIELD}
        />
      </div>

      <div style={{ padding: 24 }}>
        {error && (
          <div
            style={{
              color: 'var(--danger, #DC2626)',
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
              onClick={loadReports}
              style={{
                marginLeft: 8,
                padding: '4px 10px',
                backgroundColor: '#fff',
                color: '#12131A',
                border: '1px solid #D9DCE3',
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
              }}
            >
              Qayta yuklash
            </button>
          </div>
        )}

        {/* Summary cards (display only, computed from the rows above) */}
        {!loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 12,
              marginBottom: 28,
            }}
          >
            {[
              ['Faol talabalar', rows.length, '#12131A'],
              ['Yozuvlar', rows.reduce((sum, row) => sum + (Number(row.n) || 0), 0), '#12131A'],
              ['Sertifikatlar', rows.reduce((sum, row) => sum + (Number(row.certs) || 0), 0), '#b8860b'],
              [
                "O'rtacha %",
                rows.length
                  ? Math.round(rows.reduce((sum, row) => sum + (Number(row.avg) || 0), 0) / rows.length) + '%'
                  : '—',
                rows.length ? '#12131A' : '#DC2626',
              ],
            ].map(([label, value, color]) => (
              <div key={label} style={{ ...CARD, padding: '14px 16px' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color, marginBottom: 4 }}>{value}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#5B6070',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Monthly table */}
        <h2 style={SECTION_TITLE}>Oylik hisobot — {ym}</h2>

        {loading ? (
          <div style={{ color: 'var(--text3, #5B6070)', fontSize: 13 }}>
            Hisobot yuklanmoqda...
          </div>
        ) : (
          <div style={{ ...CARD, overflowX: 'auto', marginBottom: 32 }}>
            <table
              style={{
                width: '100%',
                fontSize: 13,
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={TH}>Ism</th>
                  <th style={TH}>Guruh</th>
                  <th style={TH}>Yozuv</th>
                  <th style={TH}>O'rt.%</th>
                  <th style={TH}>Reyting</th>
                  <th style={TH}>🏆</th>
                </tr>
              </thead>

              <tbody>
                {rows.map(row => {
                  const student = row.student;

                  if (!student) return null;

                  return (
                    <tr
                      key={student.id}
                      style={{ borderTop: '1px solid #EEF0F3' }}
                    >
                      <td style={{ ...TD, fontWeight: 500 }}>{student.name}</td>
                      <td style={TD}>{getGroupName(student)}</td>
                      <td style={TD}>{row.n}</td>
                      <td style={TD}>{row.avg}%</td>
                      <td style={TD}>
                        {row.rating !== null && row.rating !== undefined
                          ? row.rating
                          : '—'}
                      </td>
                      <td style={TD}>{row.certs}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!rows.length && (
              <div style={{ ...EMPTY, borderTop: '1px solid #EEF0F3' }}>
                Bu oy uchun hisobot topilmadi.
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <h2 style={{ ...SECTION_TITLE, margin: 0 }}>Progress</h2>

          <select
            className="fi"
            value={sid}
            onChange={e => setSid(e.target.value)}
            style={{ ...FIELD, minWidth: 200 }}
          >
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ ...CARD, padding: '16px 18px', marginBottom: 32 }}>
          <Chart pts={progress} />
          <small style={{ display: 'block', marginTop: 8, fontSize: 12, color: '#5B6070' }}>
            Yashil chiziq — 95% (sertifikat chegarasi)
          </small>
        </div>

        {/* Certificates */}
        <h2 style={SECTION_TITLE}>Sertifikatlar ({certs.length})</h2>

        {studentCerts.map(cert => (
          <CertImage
            key={cert.id}
            cert={cert}
            student={selectedStudent}
            canSend
          />
        ))}

        {!studentCerts.length && !loading && (
          <div style={{ ...CARD, ...EMPTY }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🏆</div>
            Tanlangan o'quvchida sertifikat yo'q.
          </div>
        )}
      </div>
    </div>
  );
}