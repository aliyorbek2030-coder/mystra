import { useState, useEffect } from 'react';
import { useAuth, apiRequest } from '../../lib/auth';

const fm = n => Number(n || 0).toLocaleString('ru-RU') + " so'm";

function getMonths() {
  const d = new Date();

  return [...Array(6)].map((_, i) => {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
  });
}

function netPrice(price, discount) {
  return Math.round(Number(price || 0) * (1 - Number(discount || 0) / 100));
}

export default function Pay() {
  const { user: me } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const yms = getMonths();
  const currentMonth = yms[0];

  useEffect(() => {
    let cancelled = false;

    async function loadPayments() {
      setLoading(true);
      setError('');

      try {
        const result = await apiRequest('/my/payments');

        if (!cancelled) {
          setData(result);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "To'lov ma'lumotlarini yuklashda xatolik.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (me?.id) {
      loadPayments();
    } else {
      setLoading(false);
      setError("O'quvchi hisobi topilmadi. Qayta kiring.");
    }

    return () => {
      cancelled = true;
    };
  }, [me?.id]);

  if (loading) {
    return (
      <div className="wrap">
        <h3>To'lov</h3>
        <div className="card" style={{ color: 'var(--text3)' }}>
          To'lov ma'lumotlari yuklanmoqda...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrap">
        <h3>To'lov</h3>
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
      </div>
    );
  }

  const subscription = data?.subscription || {};
  const months = Array.isArray(data?.months) ? data.months : [];
  const basePrice = Number(data?.price || 0);

  const getMonthPayment = ym =>
    months.find(p => p.ym === ym) || {};

  const currentPayment = getMonthPayment(currentMonth);
  const currentDiscount = Number(currentPayment.discount || 0);
  const currentPrice = netPrice(basePrice, currentDiscount);
  const currentPaid = Number(currentPayment.paid || 0);

  const coursePaid = currentPrice > 0 && currentPaid >= currentPrice;
  const subscriptionActive = Boolean(subscription.active);
  const subscriptionPrice = Number(subscription.price || 9900);

  return (
    <div className="wrap">
      <h3>To'lov</h3>

      {notice && (
        <div className="card" style={{ marginBottom: 12 }}>
          {notice}
        </div>
      )}

      <div className="card">
        <b>Kurs to'lovi · {me?.level || '—'}</b>

        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            margin: '6px 0'
          }}
        >
          {currentPrice
            ? `${fm(currentPrice)} / oy`
            : 'Narx belgilanmagan'}
        </div>

        {!basePrice ? (
          "Ustoz narxni belgilaydi."
        ) : coursePaid ? (
          "Shu oy to'lovi qilingan ✓"
        ) : (
          <>
            Shu oy uchun {fm(Math.max(0, currentPrice - currentPaid))} to'lash
            kerak.
            {currentPaid > 0 && (
              <div style={{ marginTop: 4, color: 'var(--text3)' }}>
                To'langan: {fm(currentPaid)}
              </div>
            )}
          </>
        )}
      </div>

      <div
        className="card"
        style={{
          borderColor: subscriptionActive
            ? 'var(--border)'
            : 'var(--danger)'
        }}
      >
        <b>Sayt obunasi · {fm(subscriptionPrice)}/oy</b>

        <div style={{ margin: '6px 0' }}>
          {subscriptionActive
            ? `Faol · ${subscription.days ?? 0} kun qoldi`
            : "Muddati tugagan: vazifa topshirib bo'lmaydi"}
        </div>

        <button
          className="btn btn-p"
          onClick={() =>
            setNotice(
              "Sayt obunasi uchun onlayn to'lov hali ulanmagan. To'lovni amalga oshirish uchun ustozingiz bilan bog'laning."
            )
          }
        >
          {fm(subscriptionPrice)} to'lash
        </button>
      </div>

      <b>Oxirgi 6 oy</b>

      {yms.map(ym => {
        const payment = getMonthPayment(ym);
        const paid = Number(payment.paid || 0);
        const discount = Number(payment.discount || 0);
        const price = netPrice(basePrice, discount);

        let status;

        if (!price) {
          status = '—';
        } else if (paid >= price) {
          status = '✅ To\'langan';
        } else if (paid > 0) {
          status = '🟡 Qisman';
        } else {
          status = '🔴 To\'lanmagan';
        }

        return (
          <div
            className="card"
            key={ym}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginTop: 8
            }}
          >
            <span>
              <b>{ym}</b>
              <br />

              <small>
                To'langan: {fm(paid)}
                {payment.method ? ` · ${payment.method}` : ''}
                {discount ? ` · −${discount}%` : ''}
              </small>
            </span>

            <span style={{ textAlign: 'right' }}>
              {status}
            </span>
          </div>
        );
      })}

      {months.length === 0 && (
        <div
          style={{
            marginTop: 12,
            color: 'var(--text3)'
          }}
        >
          Hozircha to'lovlar tarixi mavjud emas.
        </div>
      )}
    </div>
  );
}