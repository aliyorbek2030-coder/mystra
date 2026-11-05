import { useState, useEffect, useCallback } from 'react';
import { today } from '../../lib/storage';
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
  padding: '12px 18px',
  marginBottom: 8,
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

const MARK_BTN = (active, disabled) => ({
  padding: '7px 14px',
  borderRadius: 10,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 500,
  backgroundColor: active ? '#12131A' : '#fff',
  color: active ? '#fff' : '#12131A',
  border: active ? '1px solid #12131A' : '1px solid #D9DCE3',
  opacity: disabled ? 0.6 : 1,
});

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

export default function Attendance() {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [g, setG] = useState('');
  const [d, setD] = useState(today());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const loadBase = useCallback(async () => {
    try {
      setError('');

      const [groupData, studentData] = await Promise.all([
        apiRequest('/groups'),
        apiRequest('/students'),
      ]);

      const nextGroups = Array.isArray(groupData) ? groupData : [];
      const nextStudents = Array.isArray(studentData) ? studentData : [];

      setGroups(nextGroups);
      setStudents(nextStudents);

      setG(current => {
        if (current && nextGroups.some(x => String(x.id) === String(current))) {
          return current;
        }
        return nextGroups.length ? String(nextGroups[0].id) : '';
      });
    } catch (e) {
      setError(e.message || 'Ma’lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    if (!d) return;

    try {
      setError('');

      const data = await apiRequest(
        `/attendance?date=${encodeURIComponent(d)}`
      );

      const map = {};

      (Array.isArray(data) ? data : []).forEach(item => {
        map[String(item.studentId)] = item.v;
      });

      setAttendance(map);
    } catch (e) {
      setError(e.message || 'Davomatni yuklashda xatolik');
    }
  }, [d]);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const st = students.filter(
    s => String(s.groupId ?? '') === String(g)
  );

  const set = async (sid, value) => {
    const id = String(sid);
    const previous = attendance[id];

    setAttendance(current => ({
      ...current,
      [id]: value,
    }));

    setSaving(current => ({ ...current, [id]: true }));
    setMsg('');
    setError('');

    try {
      await apiRequest('/attendance', {
        method: 'PUT',
        body: JSON.stringify({
          studentId: sid,
          date: d,
          v: value,
        }),
      });

      setMsg('Davomat saqlandi');
    } catch (e) {
      setAttendance(current => {
        const next = { ...current };

        if (previous === undefined) {
          delete next[id];
        } else {
          next[id] = previous;
        }

        return next;
      });

      setError(e.message || 'Davomatni saqlashda xatolik');
    } finally {
      setSaving(current => ({ ...current, [id]: false }));
    }
  };

  return (
    <div style={PAGE}>
      {/* Header: title on the left, group + date pickers on the right */}
      <div style={HEADER}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 2px 0', color: '#12131A' }}>
            Davomat
          </h1>
          <p style={{ color: '#5B6070', margin: 0, fontSize: 13 }}>
            Guruh va sanani tanlab, o'quvchilarni belgilang
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            className="fi"
            value={g}
            onChange={e => setG(e.target.value)}
            style={{ ...FIELD, minWidth: 160 }}
          >
            {groups.map(x => (
              <option key={x.id} value={String(x.id)}>
                {x.name}
              </option>
            ))}
          </select>

          <input
            className="fi"
            type="date"
            value={d}
            onChange={e => setD(e.target.value)}
            style={FIELD}
          />
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {loading && (
          <div style={{ marginBottom: 12, fontSize: 13, color: '#5B6070' }}>
            Yuklanmoqda...
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
              marginBottom: 12,
              overflowWrap: 'anywhere',
            }}
          >
            {error}
          </div>
        )}

        {msg && !error && (
          <div
            style={{
              color: '#15803D',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {msg}
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <Empty icon="👥">
            Guruhlar topilmadi.
          </Empty>
        )}

        {!loading && g && st.length === 0 && (
          <Empty icon="🧑‍🎓">
            Bu guruhda o‘quvchilar yo‘q.
          </Empty>
        )}

        <div>
          {st.map(s => {
            const id = String(s.id);
            const value = attendance[id];

            return (
              <div
                key={s.id}
                style={{
                  ...CARD,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <b style={{ fontSize: 14 }}>{s.name}</b>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#5B6070',
                      marginTop: 2,
                    }}
                  >
                    {value === 'p'
                      ? 'Bugun: Keldi'
                      : value === 'a'
                        ? 'Bugun: Yo‘q'
                        : 'Bugun: Belgilanmagan'}
                  </div>
                </div>

                <span style={{ whiteSpace: 'nowrap', display: 'flex', gap: 6 }}>
                  <button
                    className={'btn ' + (value === 'p' ? 'btn-p' : '')}
                    style={MARK_BTN(value === 'p', !!saving[id])}
                    disabled={!!saving[id]}
                    onClick={() => set(s.id, 'p')}
                  >
                    ✅ Keldi
                  </button>{' '}

                  <button
                    className={'btn ' + (value === 'a' ? 'btn-p' : '')}
                    style={MARK_BTN(value === 'a', !!saving[id])}
                    disabled={!!saving[id]}
                    onClick={() => set(s.id, 'a')}
                  >
                    ❌ Yo'q
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}