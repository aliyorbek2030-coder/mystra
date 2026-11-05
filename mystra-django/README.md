# MYSTRA Backend (Django + Django REST Framework)

O'quv markazi platformasi: o'quvchi, ustoz va admin kabinetlari. Frontend: `../react_src` (React + Vite).

## Tez ishga tushirish (Windows)
Loyiha papkasida `start.bat` ni ishga tushiring (yoki `python run.py`). Skript:
1. Python kutubxonalarini o'rnatadi,
2. `migrate` va `bootstrap` (admin va ustoz akkauntlari) ni bajaradi,
3. kerak bo'lsa `npm install` qiladi,
4. backend (`http://127.0.0.1:8000/api/`) va frontend (`http://localhost:5173/`) ni ochadi.

Login va parollar `.env` faylida: `ADMIN_PASSWORD`, `TEACHER_PASSWORD` (faqat birinchi ishga tushishda ishlatiladi). Kirgandan keyin parolni sayt ichida o'zgartiring.

## Qo'lda ishga tushirish
```
python -m venv venv
venv\Scripts\activate            # Linux: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py bootstrap
python manage.py runserver       # sinov uchun
gunicorn config.wsgi             # productionda (HTTPS orqasida: nginx/Caddy)
```
Migratsiyalar `core/migrations/` da tayyor. Django admin paneli: `/admin/` (`python manage.py createsuperuser`).

## .env sozlamalari
| O'zgaruvchi | Ma'nosi |
|---|---|
| `AUTH_SECRET` | Uzun tasodifiy kalit (majburiy) |
| `DEBUG` | Productionda `0` |
| `ALLOWED_HOSTS` | Server domeni, masalan `mystra.uz` |
| `ALLOWED_ORIGINS` | Frontend manzili (CORS), masalan `https://mystra.uz` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL (bo'sh bo'lsa SQLite) |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | AI tekshiruv (ixtiyoriy) |

`.env` faylini hech kimga yubormang va gitga qo'shmang.
PostgreSQL uchun `requirements.txt` da `psycopg[binary]` qatorini yoqing.

## Test
`python manage.py test`

## Muhim
- Qoidalar serverda majburiy: obuna tugasa topshirish yopiladi (402), kuniga bitta yakunlash (409), 95%+ sertifikat, parollar hash, login brute-force limiti, fayl turi/hajm cheklovi, CORS faqat `ALLOWED_ORIGINS`.
- Telegram tokeni va Gemini kaliti faqat serverda. `GEMINI_API_KEY` bo'lmasa AI javob namunaviy.
- `data/` papkasi (SQLite va `uploads/`) doimiy diskda turishi va zaxiralanishi kerak.
