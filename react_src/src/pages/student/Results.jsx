import { useState, useEffect } from 'react';
import { useAuth, apiRequest } from '../../lib/auth';
import ChangePassword from '../../components/ChangePassword';

export default function Results() {
  const { user: me } = useAuth();

  const [archive, setArchive] = useState([]);
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadResults() {
      setLoading(true);
      setError('');

      try {
        const [archiveData, tasksData] = await Promise.all([
          apiRequest('/my/archive'),
          apiRequest('/my/tasks')
        ]);

        if (cancelled) return;

        setArchive(Array.isArray(archiveData) ? archiveData : []);
        setRating(tasksData?.rating || null);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Natijalarni yuklashda xatolik.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (me?.id) {
      loadResults();
    } else {
      setLoading(false);
      setError("O'quvchi hisobi topilmadi. Qayta kiring.");
    }

    return () => {
      cancelled = true;
    };
  }, [me?.id]);

  const now = new Date();
  const currentMonth =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthData = archive.find(x => x.ym === currentMonth);
  const average = currentMonthData?.avg ?? 0;

  const records = archive
    .flatMap(month => Array.isArray(month.recs) ? month.recs : [])
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 30);

  return (
    <div className="wrap">
      <h3>Natijalarim</h3>

      {loading && (
        <div className="card" style={{ color: 'var(--text3)' }}>
          Natijalar yuklanmoqda...
        </div>
      )}

      {error && (
        <div className="card" style={{ color: 'var(--danger)' }}>
          {error}
          <div style={{ marginTop: 12 }}>
            <button
              className="btn btn-p"
              onClick={() => window.location.reload()}
            >
              Qayta yuklash
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div
            className="card"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              textAlign: 'center'
            }}
          >
            <div>
              <b style={{ fontSize: 26 }}>{average}%</b>
              <br />
              <small>O'RTACHA (OY)</small>
            </div>

            <div>
              <b style={{ fontSize: 26 }}>
                {rating?.score ?? '—'}
              </b>
              <br />
              <small>REYTING BALLI</small>
            </div>
          </div>

          {records.map(record => (
            <div
              className="card"
              key={record.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12
              }}
            >
              <span>
                {String(record.date || '').slice(0, 10)}
                {' · '}
                {record.extra
                  ? '⭐ Extra'
                  : record.note || 'Vazifa'}
              </span>

              <b
                style={{
                  color: Number(record.avgScore) >= 95
                    ? 'var(--success)'
                    : 'inherit'
                }}
              >
                {record.avgScore}%
              </b>
            </div>
          ))}

          {!records.length && (
            <div style={{ color: 'var(--text3)' }}>
              Hali natija yo'q
            </div>
          )}
        </>
      )}

      <ChangePassword />
    </div>
  );
}