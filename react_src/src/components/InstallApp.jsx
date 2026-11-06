import { useEffect, useState } from 'react';

// "Ilovani o'rnatish" — telefonga/kompyuterga MYSTRA ni ilova sifatida o'rnatish
const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export default function InstallApp({ compact = false }) {
  const [can, setCan] = useState(!!window.__mystraInstall);
  const [hint, setHint] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const on = () => setCan(true);
    const done = () => { setInstalled(true); setCan(false); };
    window.addEventListener('mystra-installable', on);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('mystra-installable', on); window.removeEventListener('appinstalled', done); };
  }, []);

  if (installed || (!can && !isIOS())) return null;

  const click = async () => {
    if (window.__mystraInstall) {
      window.__mystraInstall.prompt();
      const r = await window.__mystraInstall.userChoice.catch(() => null);
      if (r?.outcome === 'accepted') setInstalled(true);
      window.__mystraInstall = null;
      setCan(false);
    } else {
      setHint(v => !v);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={click}
        style={{
          width: '100%', cursor: 'pointer', font: 'inherit', fontWeight: 500, fontSize: 13,
          height: compact ? 34 : 36, padding: '0 12px', borderRadius: 10, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8, color: '#18181B', background: '#FFFFFF', border: '1px solid #E4E4E7',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M12 7v7M9 11l3 3 3-3" /></svg>
        Ilovani o'rnatish
      </button>
      {hint && (
        <div role="note" style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: '#18181B', color: '#fff', borderRadius: 12, padding: '10px 12px', fontSize: 12, lineHeight: 1.5, zIndex: 60 }}>
          iPhone: Safari'da «Ulashish» tugmasini bosing → «Bosh ekranga qo'shish».
        </div>
      )}
    </div>
  );
}
