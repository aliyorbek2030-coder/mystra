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
  const [done, setDone] = useState('');

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
        const r = await sendSuggestion(groupId, all);
        setDone(
          (all
            ? `Butun guruhga 10 ta test yuborildi (${r?.recipients ?? 0} o‘quvchi).`
            : `${r?.tasks ?? 0} ta o‘quvchiga shaxsiy 10 talik test yuborildi.`) +
            (r && r.ai === false ? ' (AI ulanmagan — namunaviy savollar, tahrirlang)' : ' AI ularning xatolariga qarab tuzdi.')
        );
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
      <p style={{ color: 'var(--text3)', marginTop: -4 }}>
        Ketma-ket 3 marta 60% dan past natija olgan o‘quvchilar. AI har biriga xatolariga mos alohida test tuzadi.
      </p>
      {done && (
        <div className="card" style={{ color: '#16A34A', fontWeight: 600 }}>✅ {done}</div>
      )}

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

              <div style={{ display: 'grid', gap: 8, margin: '10px 0' }}>
                {students.map((student) => (
                  <div
                    key={student.id}
                    style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(239,68,68,.08)' }}
                  >
                    <b>{student.name}</b>
                    {' — '}
                    ketma-ket {student.streak} marta past:{' '}
                    {(student.last || []).map((v) => `${v}%`).join(' → ')}
                    {student.avg ? ` · oylik o‘rtacha ${student.avg}%` : ''}
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
                      Zaif joylari:{' '}
                      {student.weak && student.weak.length
                        ? student.weak.join(', ')
                        : 'aniqlanmagan (umumiy takrorlash)'}
                    </div>
                  </div>
                ))}
              </div>
              <p>Har biriga xatolariga mos alohida 10 ta test yuboraymi?</p>

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