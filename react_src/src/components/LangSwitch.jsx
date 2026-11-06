import { LANGS, getLang, setLang } from '../lib/i18n';

// Til almashtirgich: UZ · RU · EN
export default function LangSwitch({ dark = false, style }) {
  const cur = getLang();
  return (
    <div
      role="group"
      aria-label="Til / Язык / Language"
      style={{
        display: 'inline-flex', gap: 2, padding: 3, borderRadius: 10,
        background: dark ? '#27272A' : '#F4F4F5', ...style,
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
              fontSize: 12, fontWeight: 600, height: 28, minWidth: 36, padding: '0 8px', borderRadius: 8,
              background: on ? '#FFFFFF' : 'transparent', boxShadow: on ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
              color: on ? '#18181B' : dark ? '#A1A1AA' : '#71717A',
            }}
          >
            {l.short}
          </button>
        );
      })}
    </div>
  );
}
