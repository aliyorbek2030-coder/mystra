import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../lib/auth';

// --- DESIGN ONLY (no logic) ---
const PAGE = {
  width: '100%',
  maxWidth: 'none',
  margin: 0,
  boxSizing: 'border-box',
  padding: 0,
  fontFamily: "'Onest', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  color: '#18181B',
  backgroundColor: '#F4F4F5',
  minHeight: '100vh',
};

const HEADER = {
  backgroundColor: '#fff',
  borderBottom: '1px solid #E4E4E7',
  padding: '20px 24px 14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
};

const CARD = {
  backgroundColor: '#fff',
  border: '1px solid #E4E4E7',
  borderRadius: 12,
  boxSizing: 'border-box',
};

const TH = {
  textAlign: 'left',
  padding: '10px 16px',
  fontSize: 11,
  fontWeight: 500,
  color: '#71717A',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  backgroundColor: '#F4F4F5',
  whiteSpace: 'nowrap',
};

const TD = {
  padding: '14px 16px',
  fontSize: 13,
  color: '#18181B',
  verticalAlign: 'middle',
};

const BTN_P = {
  padding: '5px 12px',
  backgroundColor: '#4F46E5',
  color: '#fff',
  border: '1px solid #4F46E5',
  borderRadius: 10,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 12,
  fontWeight: 500,
  whiteSpace: 'nowrap',
};

const BTN_WARN = {
  padding: '5px 12px',
  backgroundColor: '#fff',
  color: '#d97706',
  border: '1px solid #e8a33d',
  borderRadius: 10,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 12,
  fontWeight: 500,
  whiteSpace: 'nowrap',
};

const BTN_S = {
  padding: '8px 14px',
  backgroundColor: '#fff',
  color: '#18181B',
  border: '1px solid #D4D4D8',
  borderRadius: 10,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 500,
};

const BADGE = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 999,
  backgroundColor: '#e8f4fb',
  color: '#0b6a9a',
  fontSize: 11,
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

export default function Signups() {
  const [signups, setSignups] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadSignups = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Load pending registrations from Django.
      const data = await apiRequest('/signups');

      setSignups(Array.isArray(data) ? data : []);

      // Group names are useful, but must not prevent signup requests
      // from displaying if the groups request fails.
      try {
        const groupData = await apiRequest('/groups');
        setGroups(Array.isArray(groupData) ? groupData : []);
      } catch (groupError) {
        console.warn('Could not load groups:', groupError);
        setGroups([]);
      }
    } catch (err) {
      setError(err.message || 'So‘rovlarni yuklab bo‘lmadi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSignups();
  }, [loadSignups]);

  async function handleAction(signup, action) {
    const key = `${signup.id}-${action}`;

    setProcessing(key);
    setError('');
    setMessage('');

    try {
      await apiRequest(`/signups/${signup.id}/${action}`, {
        method: 'POST',
      });

      setMessage(
        action === 'approve'
          ? `${signup.name} tasdiqlandi.`
          : `${signup.name} so‘rovi rad etildi.`
      );

      await loadSignups();
    } catch (err) {
      setError(err.message || 'Amalni bajarib bo‘lmadi.');
    } finally {
      setProcessing('');
    }
  }

  function getGroupName(groupId) {
    const group = groups.find(
      (item) => String(item.id) === String(groupId)
    );

    return group?.name || '—';
  }

  return (
    <div style={PAGE}>
      {/* Header: title on the left, refresh on the right */}
      <div style={HEADER}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 2px 0', color: '#18181B' }}>
            Ro'yxatdan o'tish so'rovlari ({signups.length})
          </h1>
          <p style={{ color: '#71717A', margin: 0, fontSize: 13 }}>
            O'quvchilar guruhga qo'shilishni so'ramoqda
          </p>
        </div>

        <button
          className="btn"
          type="button"
          style={{
            ...BTN_S,
            opacity: loading || Boolean(processing) ? 0.6 : 1,
          }}
          onClick={loadSignups}
          disabled={loading || Boolean(processing)}
        >
          {loading ? 'Yuklanmoqda...' : '🔄 Yangilash'}
        </button>
      </div>

      <div style={{ padding: 24 }}>
        {error && (
          <div
            role="alert"
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
            {error}
          </div>
        )}

        {message && (
          <div
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

        {loading && (
          <p style={{ color: '#71717A', fontSize: 13, margin: 0 }}>
            So'rovlar Django serveridan yuklanmoqda...
          </p>
        )}

        {!loading && !error && signups.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#71717A',
              fontSize: 14,
              padding: '28px 16px',
            }}
          >
            <div style={{ fontSize: 30, marginBottom: 8 }}>📭</div>
            Hozircha yangi so'rovlar yo'q.
          </div>
        )}

        {!loading && signups.length > 0 && (
          <div style={{ ...CARD, overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr>
                  <th style={TH}>Ism</th>
                  <th style={TH}>Username (login)</th>
                  <th style={TH}>Telefon</th>
                  <th style={TH}>Guruh</th>
                  <th style={TH}>Daraja</th>
                  <th style={TH}>Harakatlar</th>
                </tr>
              </thead>

              <tbody>
                {signups.map((signup) => {
                  const groupName = getGroupName(signup.groupId);

                  return (
                    <tr
                      key={signup.id}
                      style={{ borderTop: '1px solid #F4F4F5' }}
                    >
                      <td style={{ ...TD, fontWeight: 600 }}>
                        {signup.name}
                      </td>

                      <td
                        style={{
                          ...TD,
                          fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, monospace",
                          fontSize: 12.5,
                        }}
                      >
                        {signup.username}
                      </td>

                      <td style={TD}>{signup.phone || '—'}</td>

                      <td style={TD}>
                        {groupName === '—' ? (
                          '—'
                        ) : (
                          <span style={BADGE}>{groupName}</span>
                        )}
                      </td>

                      <td style={TD}>{signup.level || '—'}</td>

                      <td style={TD}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-p"
                            type="button"
                            style={{
                              ...BTN_P,
                              opacity: Boolean(processing) ? 0.6 : 1,
                            }}
                            disabled={Boolean(processing)}
                            onClick={() => handleAction(signup, 'approve')}
                          >
                            {processing === `${signup.id}-approve`
                              ? 'Tasdiqlanmoqda...'
                              : '✅ Tasdiqlash'}
                          </button>

                          <button
                            className="btn"
                            type="button"
                            style={{
                              ...BTN_WARN,
                              opacity: Boolean(processing) ? 0.6 : 1,
                            }}
                            disabled={Boolean(processing)}
                            onClick={() => {
                              const confirmed = window.confirm(
                                `${signup.name} so‘rovini rad etasizmi?`
                              );

                              if (confirmed) {
                                handleAction(signup, 'reject');
                              }
                            }}
                          >
                            {processing === `${signup.id}-reject`
                              ? 'Rad etilmoqda...'
                              : '❌ Rad etish'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}