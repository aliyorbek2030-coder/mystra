import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../lib/auth';
import { LEVELS } from './People';
import { receiptDownload, receiptTelegram } from '../../components/Receipt';

// --- DESIGN ONLY (no logic) ---
const PAGE = {
  width: '100%',
  maxWidth: 'none',
  margin: 0,
  boxSizing: 'border-box',
  padding: 0,
  fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  color: '#111',
  backgroundColor: '#f7f7f6',
  minHeight: '100vh',
};

const HEADER = {
  backgroundColor: '#fff',
  borderBottom: '1px solid #e8e8e6',
  padding: '20px 24px 14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
};

const CARD = {
  backgroundColor: '#fff',
  border: '1px solid #e2e2e0',
  borderRadius: 8,
  boxSizing: 'border-box',
  padding: '16px 18px',
  marginBottom: 14,
};

const CARD_TITLE = { fontSize: 14, fontWeight: 600, color: '#111' };

const LABEL = {
  display: 'block',
  fontSize: 11,
  fontWeight: 500,
  color: '#8a8a88',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  marginBottom: 4,
};

const FIELD = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  borderRadius: 6,
  border: '1px solid #e2e2e0',
  backgroundColor: '#f5f5f3',
  color: '#111',
  fontFamily: 'inherit',
  fontSize: 13,
  outline: 'none',
  boxShadow: '0 0 0 1000px #f5f5f3 inset',
  WebkitTextFillColor: '#111',
};

const FIELD_WHITE = {
  ...FIELD,
  width: 'auto',
  border: '1px solid #d4d4d2',
  backgroundColor: '#fff',
  boxShadow: '0 0 0 1000px #fff inset',
};

const BTN_P = {
  padding: '9px 16px',
  backgroundColor: '#111',
  color: '#fff',
  border: '1px solid #111',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 500,
};

const BTN_S = {
  padding: '9px 16px',
  backgroundColor: '#fff',
  color: '#111',
  border: '1px solid #d4d4d2',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 500,
};

const BTN_SM = { padding: '6px 12px', fontSize: 12 };

const dim = on => ({ opacity: on ? 0.6 : 1 });

const BANNER_ERR = {
  color: '#dc2626',
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 6,
  padding: '10px 12px',
  fontSize: 13,
  marginBottom: 14,
  overflowWrap: 'anywhere',
};

const BANNER_OK = {
  color: '#15803d',
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: 6,
  padding: '10px 12px',
  fontSize: 13,
  marginBottom: 14,
};

const fm = n => Number(n || 0).toLocaleString('ru-RU') + " so'm";
const M = ['naqd', 'karta', 'Payme', 'Click'];

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function Payment() {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [lp, setLp] = useState({});
  const [ym, setYm] = useState(currentMonth());
  const [ed, setEd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [studentData, paymentData, settingsData] = await Promise.all([
        apiRequest('/students'),
        apiRequest(`/payments?ym=${encodeURIComponent(ym)}`),
        apiRequest('/settings'),
      ]);

      setStudents(Array.isArray(studentData) ? studentData : studentData.students || []);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setLp(settingsData.pay_settings?.levelPrices || {});
    } catch (e) {
      setError(e.message || 'To‘lovlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [ym]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const paymentFor = studentId =>
    payments.find(p => p.student?.id === studentId) || {};

  const getStudentPrice = student => {
    const configured = Number(lp[student.level] || 0);
    return configured;
  };

  const netPrice = (student, payment) => {
    const price = Number(payment?.price ?? getStudentPrice(student));
    const discount = Math.max(0, Math.min(100, Number(payment?.discount) || 0));
    return Math.round(price * (100 - discount) / 100);
  };

  const open = student => {
    const p = paymentFor(student.id);

    setEd({
      s: student,
      paid: p.paid ?? '',
      method: p.method || 'naqd',
      discount: p.discount || 0,
      note: p.note || '',
    });
    setError('');
    setMessage('');
  };

  const save = async () => {
    if (!ed || saving) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await apiRequest(
        `/payments/${ed.s.id}/${encodeURIComponent(ym)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            paid: Number(ed.paid) || 0,
            method: ed.method,
            discount: Number(ed.discount) || 0,
            note: ed.note,
          }),
        }
      );

      setEd(null);
      setMessage('To‘lov muvaffaqiyatli saqlandi.');
      await loadData();
    } catch (e) {
      setError(e.message || 'To‘lovni saqlab bo‘lmadi');
    } finally {
      setSaving(false);
    }
  };

  const setLP = (level, value) => {
    setLp(previous => ({
      ...previous,
      [level]: Math.max(0, Number(value) || 0),
    }));
  };

  const savePrices = async () => {
    if (savingPrices) return;

    setSavingPrices(true);
    setError('');
    setMessage('');

    try {
      const settings = await apiRequest('/settings');

      await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify({
          ...settings,
          pay_settings: {
            levelPrices: Object.fromEntries(
              LEVELS.map(level => [
                level,
                Math.max(0, Number(lp[level]) || 0),
              ])
            ),
          },
        }),
      });

      setMessage('Kurs narxlari saqlandi.');
      await loadData();
    } catch (e) {
      setError(e.message || 'Narxlarni saqlab bo‘lmadi');
    } finally {
      setSavingPrices(false);
    }
  };

  const csv = () => {
    const data = [
      ['Ism', 'Daraja', 'Narx', 'Chegirma %', `${ym} to‘langan`, 'Usul'],
      ...students.map(student => {
        const p = paymentFor(student.id);

        return [
          student.name,
          student.level,
          getStudentPrice(student),
          p.discount || 0,
          p.paid || 0,
          p.method || '',
        ];
      }),
    ];

    const content =
      '\ufeff' +
      data
        .map(row =>
          row.map(value =>
            '"' + String(value ?? '').replace(/"/g, '""') + '"'
          ).join(',')
        )
        .join('\n');

    const url = URL.createObjectURL(
      new Blob([content], { type: 'text/csv;charset=utf-8;' })
    );

    const a = document.createElement('a');
    a.href = url;
    a.download = `tolovlar_${ym}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const totals = students.reduce(
    (result, student) => {
      const p = paymentFor(student.id);
      result.expected += netPrice(student, p);
      result.received += Number(p.paid) || 0;
      return result;
    },
    { expected: 0, received: 0 }
  );

  const debt = Math.max(0, totals.expected - totals.received);

  return (
    <div style={PAGE}>
      {/* Header: title on the left, month picker on the right */}
      <div style={HEADER}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 2px 0', color: '#111' }}>
            To'lovlar
          </h1>
          <p style={{ color: '#8a8a88', margin: 0, fontSize: 13 }}>
            Kurs narxlari va oylik to'lovlar
          </p>
        </div>

        <input
          className="fi"
          type="month"
          value={ym}
          onChange={e => setYm(e.target.value)}
          style={FIELD_WHITE}
        />
      </div>

      <div style={{ padding: 24 }}>
        {error && (
          <div style={BANNER_ERR}>
            {error}
            <button
              className="btn"
              onClick={loadData}
              style={{ ...BTN_S, ...BTN_SM, marginLeft: 8 }}
            >
              Qayta yuklash
            </button>
          </div>
        )}

        {message && (
          <div style={BANNER_OK}>
            {message}
            <button
              className="btn"
              onClick={() => setMessage('')}
              style={{ ...BTN_S, ...BTN_SM, padding: '2px 8px', marginLeft: 8 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ ...CARD, marginBottom: 0, padding: '14px 16px' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#15803d', marginBottom: 4 }}>
              {fm(totals.received)}
            </div>
            <div style={{ ...LABEL, marginBottom: 0 }}>Tushgan</div>
          </div>

          <div style={{ ...CARD, marginBottom: 0, padding: '14px 16px' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: debt > 0 ? '#dc2626' : '#111', marginBottom: 4 }}>
              {fm(debt)}
            </div>
            <div style={{ ...LABEL, marginBottom: 0 }}>Qarz</div>
          </div>
        </div>

        {/* Course prices */}
        <div style={CARD}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <b style={CARD_TITLE}>Kurs narxi (daraja bo‘yicha)</b>
            <button className="btn" style={{ ...BTN_S, ...BTN_SM }} onClick={csv}>
              ⬇️ CSV
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
              gap: 12,
              marginTop: 14,
            }}
          >
            {LEVELS.map(level => (
              <div key={level}>
                <span style={LABEL}>{level}</span>
                <input
                  className="fi"
                  type="number"
                  min="0"
                  value={lp[level] ?? ''}
                  onChange={e => setLP(level, e.target.value)}
                  style={FIELD}
                />
              </div>
            ))}
          </div>

          <button
            className="btn btn-p"
            onClick={savePrices}
            disabled={savingPrices}
            style={{ ...BTN_P, ...dim(savingPrices), marginTop: 14 }}
          >
            {savingPrices ? 'Saqlanmoqda...' : 'Narxlarni saqlash'}
          </button>
        </div>

        {/* Payment editor */}
        {ed && (
          <div style={{ ...CARD, border: '1px solid #111' }}>
            <b style={CARD_TITLE}>{ed.s.name} · {ym}</b>

            <small style={{ display: 'block', color: '#8a8a88', fontSize: 12, marginTop: 2 }}>
              Narx: {fm(getStudentPrice(ed.s))}
            </small>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                margin: '14px 0',
              }}
            >
              <div>
                <span style={LABEL}>To‘langan summa</span>
                <input
                  className="fi"
                  type="number"
                  min="0"
                  placeholder="To‘langan summa"
                  value={ed.paid}
                  onChange={e => setEd({ ...ed, paid: e.target.value })}
                  style={FIELD}
                />
              </div>

              <div>
                <span style={LABEL}>Usul</span>
                <select
                  className="fi"
                  value={ed.method}
                  onChange={e => setEd({ ...ed, method: e.target.value })}
                  style={FIELD}
                >
                  {M.map(method => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span style={LABEL}>Chegirma %</span>
                <input
                  className="fi"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Chegirma %"
                  value={ed.discount}
                  onChange={e => setEd({ ...ed, discount: e.target.value })}
                  style={FIELD}
                />
              </div>

              <div>
                <span style={LABEL}>Izoh</span>
                <input
                  className="fi"
                  placeholder="Izoh"
                  value={ed.note}
                  onChange={e => setEd({ ...ed, note: e.target.value })}
                  style={FIELD}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-p"
                onClick={save}
                disabled={saving}
                style={{ ...BTN_P, ...dim(saving) }}
              >
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>

              <button className="btn" style={BTN_S} onClick={() => setEd(null)}>
                Bekor
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ color: '#8a8a88', fontSize: 13 }}>
            To‘lovlar yuklanmoqda...
          </div>
        )}

        {/* Student rows */}
        {!loading && students.map(student => {
          const p = paymentFor(student.id);
          const price = getStudentPrice(student);
          const net = netPrice(student, p);
          const paid = Number(p.paid) || 0;
          const ok = net > 0 && paid >= net;

          return (
            <div
              key={student.id}
              style={{
                ...CARD,
                marginBottom: 8,
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <b style={{ fontSize: 14 }}>{student.name}</b>

                <div style={{ fontSize: 12, color: '#8a8a88', marginTop: 2 }}>
                  {price
                    ? fm(net) + (p.discount ? ` (−${p.discount}%)` : '')
                    : 'Narx belgilanmagan'}
                  {' · to‘langan '}
                  {fm(paid)}
                  {p.method ? ' · ' + p.method : ''}
                </div>
              </div>

              <span
                style={{
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                }}
              >
                {ok ? '✅' : paid > 0 ? '🟡' : '🔴'}

                <button
                  className="btn"
                  style={{ ...BTN_S, ...BTN_SM }}
                  onClick={() => open(student)}
                >
                  To‘lov
                </button>

                {paid > 0 && (
                  <>
                    <button
                      className="btn"
                      style={{ ...BTN_S, ...BTN_SM }}
                      onClick={() => receiptDownload(
                        student,
                        { ...p, ym },
                        net
                      )}
                    >
                      🧾
                    </button>

                    <button
                      className="btn"
                      style={{ ...BTN_S, ...BTN_SM }}
                      onClick={() => receiptTelegram(
                        student,
                        { ...p, ym },
                        net
                      )}
                    >
                      ✈️
                    </button>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}