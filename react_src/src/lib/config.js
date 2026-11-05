// Backend manzili.
// Dev (npm run dev): Django alohida portda — http://127.0.0.1:8000
// Production (npm run build): sayt va API bitta domenda — joriy domen ishlatiladi.
export const API_ROOT = (
  import.meta.env.VITE_API_ROOT ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000' : window.location.origin)
).replace(/\/$/, '');

export const API_URL = `${API_ROOT}/api`;
