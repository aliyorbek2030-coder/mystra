import { LANGS, getLang, setLang } from '../lib/i18n';

// Til almashtirgich: UZ · RU · EN
export default function LangSwitch({ dark = false, style }) {
  const cur = getLang();
  return (
    <div
      role="group"
      aria-label="Til / Язык / Language"
      style={{
        display: 'inline-flex', gap: 2, padding: 3, borderRadius: 12,
        background: dark ? '#1E2030' : '#EEF0F3', ...style,
      }}
    >
      {LANGS.map(l => {
        const on = l.id === cur;
        return (
          <button
            key={l.id}
            type="button"
            title={l.label}
            aria-pressed={on}
            onClick={() => !on && setLang(l.id)}
            style={{
              border: 0, cursor: on ? 'default' : 'pointer', font: 'inherit',
              fontSize: 12, fontWeight: 700, height: 30, minWidth: 38, padding: '0 8px', borderRadius: 9,
              background: on ? 'linear-gradient(135deg,#8B7CFF,#5B4BFF)' : 'transparent',
              color: on ? '#fff' : dark ? '#C9CBD6' : '#4A4E5C',
            }}
          >
            {l.short}
          </button>
        );
      })}
    </div>
  );
}
