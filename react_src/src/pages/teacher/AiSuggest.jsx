import { useCallback, useEffect, useState } from 'react';
import {
  getSuggestions,
  sendSuggestion,
  skipSuggestion,
} from '../../api';

export default function AiSuggest() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getSuggestions();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Takliflarni yuklab bo'lmadi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  async function handleAction(groupId, action, all = false) {
    if (busy !== null) return;

    setBusy(groupId);
    setError('');

    try {
      if (action === 'send') {
        await sendSuggestion(groupId, all);
      } else {
        await skipSuggestion(groupId);
      }

      await loadSuggestions();
    } catch (err) {
      setError(err.message || 'Amalni bajarib bo‘lmadi.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="wrap">
      <h3>AI takliflari ({list.length})</h3>

      {error && (
        <div className="card" style={{ color: 'var(--danger, #DC2626)' }}>
          {error}
          <button
            className="btn"
            style={{ marginLeft: 10 }}
            onClick={loadSuggestions}
          >
            Qayta urinish
          </button>
        </div>
      )}

      {loading && (
        <div style={{ color: 'var(--text3)' }}>
          Takliflar yuklanmoqda...
        </div>
      )}

      {!loading &&
        list.map((item) => {
          const group = item.group;
          const students = item.students || [];
          const isBusy = busy === group.id;

          return (
            <div className="card" key={group.id}>
              <b>{group.name}</b>

              <p>
                {students
                  .map((student) => `${student.name} (${student.avg}%)`)
                  .join(', ')}
                {' — oxirgi vazifalarda past natija. '}
                Shu mavzuda 10 ta test yuboraymi?
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  className="btn btn-p"
                  disabled={busy !== null}
                  onClick={() =>
                    handleAction(group.id, 'send', false)
                  }
                >
                  {isBusy
                    ? 'Bajarilmoqda...'
                    : `✅ Ha, shu ${students.length} ta o‘quvchiga`}
                </button>

                <button
                  className="btn"
                  disabled={busy !== null}
                  onClick={() =>
                    handleAction(group.id, 'send', true)
                  }
                >
                  👥 Butun guruhga
                </button>

                <button
                  className="btn"
                  disabled={busy !== null}
                  onClick={() =>
                    handleAction(group.id, 'skip')
                  }
                >
                  ❌ Rad etish
                </button>
              </div>
            </div>
          );
        })}

      {!loading && !error && list.length === 0 && (
        <div style={{ color: 'var(--text3)' }}>
          Hozircha takliflar yo‘q
        </div>
      )}
    </div>
  );
}