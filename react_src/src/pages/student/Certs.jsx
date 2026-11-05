import { useState, useEffect } from 'react';
import { useAuth, apiRequest } from '../../lib/auth';
import CertImage from '../../components/CertImage';

export default function Certs() {
  const { user: me } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadCertificates() {
      setLoading(true);
      setError('');

      try {
        const data = await apiRequest('/my/certificates');

        if (!cancelled) {
          setCertificates(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Sertifikatlarni yuklashda xatolik');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (me?.id) {
      loadCertificates();
    } else {
      setLoading(false);
      setError('O‘quvchi hisobi topilmadi. Qayta kiring.');
    }

    return () => {
      cancelled = true;
    };
  }, [me?.id]);

  // Convert Django's snake_case fields to the format used by CertImage.
  const certificatesForDisplay = certificates.map(cert => ({
    ...cert,
    studentId: cert.student_id,
    hwRecordId: cert.hw_record_id,
    avgScore: cert.avg_score,
  }));

  return (
    <div className="wrap">
      <h3>Sertifikatlar</h3>

      {loading && (
        <div style={{ color: 'var(--text3)' }}>
          Sertifikatlar yuklanmoqda...
        </div>
      )}

      {error && (
        <div className="card" style={{ color: '#e74c3c' }}>
          {error}
        </div>
      )}

      {!loading && !error && certificatesForDisplay.map(cert => (
        <CertImage
          key={cert.id}
          cert={cert}
          student={me}
        />
      ))}

      {!loading && !error && certificates.length === 0 && (
        <div style={{ color: 'var(--text3)' }}>
          Sertifikat yo'q — 95%+ natija kerak 🏆
        </div>
      )}
    </div>
  );
}