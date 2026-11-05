import { useState, useEffect } from 'react';
import { useAuth, apiRequest } from '../../lib/auth';

export default function Archive() {
  const { user: me } = useAuth();
  const [months, setMonths] = useState([]);
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadArchive() {
      setLoading(true);
      setError('');

      try {
        const data = await apiRequest('/my/archive');

        if (cancelled) return;

        const result = Array.isArray(data) ? data : [];
        setMonths(result);
        setOpen(current =>
          current && result.some(m => m.ym === current)
            ? current
            : result[0]?.ym ?? null
        );
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Arxivni yuklashda xatolik');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (me?.id) loadArchive();
    else {
      setLoading(false);
      setError('O‘quvchi hisobi topilmadi. Qayta kiring.');
    }

    return () => {
      cancelled = true;
    };
  }, [me?.id]);

  return (
    <div className="wrap">
      <h3>Oylik arxiv</h3>

      {loading && (
        <div style={{ color: 'var(--text3)' }}>
          Arxiv yuklanmoqda...
        </div>
      )}

      {error && (
        <div className="card" style={{ color: '#e74c3c' }}>
          {error}
        </div>
      )}

      {!loading && !error && months.map(month => (
        <div className="card" key={month.ym}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              cursor: 'pointer',
              flexWrap: 'wrap',
            }}
            onClick={() => setOpen(
              open === month.ym ? null : month.ym
            )}
          >
            <b>{month.ym}</b>

            <span>
              {month.avg}% · {month.n} ta · 🏆 {month.certs}
              {month.att?.t
                ? ` · davomat ${month.att.p}/${month.att.t}`
                : ''}
            </span>
          </div>

          {open === month.ym && (
            <div style={{ marginTop: 6 }}>
              {(month.recs || []).map(record => (
                <div
                  key={record.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '6px 0',
                    borderTop: '1px solid var(--border)',
                    marginTop: 6,
                  }}
                >
                  <span>
                    {String(record.date || '').slice(0, 10)}
                    {' · '}
                    {record.extra
                      ? '⭐ Extra'
                      : record.note || 'Vazifa'}
                  </span>

                  <b>{record.avgScore}%</b>
                </div>
              ))}

              {!month.recs?.length && (
                <div style={{ color: 'var(--text3)', padding: '6px 0' }}>
                  Bu oyda yozuvlar yo‘q.
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {!loading && !error && months.length === 0 && (
        <div style={{ color: 'var(--text3)' }}>
          Hali arxiv yo'q
        </div>
      )}
    </div>
  );
}