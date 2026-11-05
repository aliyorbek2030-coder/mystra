# MYSTRA

O'quv markazi platformasi: o'quvchi, ustoz va admin kabinetlari, AI bilan vazifa tekshirish, to'lov, davomat, sertifikatlar.

- `mystra-django/` — backend (Django + DRF). Batafsil: [mystra-django/README.md](mystra-django/README.md)
- `react_src/` — frontend (React + Vite)

## Ishga tushirish (Windows)
1. `mystra-django/.env.example` ni `mystra-django/.env` ga nusxalang va qiymatlarni to'ldiring.
2. `start.bat` ni ishga tushiring (yoki `python run.py`).
3. Brauzerda: http://localhost:5173/

## Internetga joylash (doimiy havola, bepul)
Sayt **Render.com** da (Django + React bitta servisda), ma'lumotlar bazasi **Neon.tech** da (bepul PostgreSQL).

1. **Neon.tech** da ro'yxatdan o'ting → yangi loyiha → *Connection string* ni nusxalang (`postgresql://...`).
2. **Render.com** da GitHub orqali kiring → **New → Blueprint** → `mystra` repozitoriyasini tanlang.
3. So'ralgan qiymatlarni kiriting:
   - `DATABASE_URL` — Neon dan olingan qator
   - `ADMIN_PASSWORD`, `TEACHER_PASSWORD` — admin va ustoz uchun yangi parollar
   - `GEMINI_API_KEY` — AI kaliti (ixtiyoriy), `GEMINI_MODEL` — model nomi
4. **Apply** → 5–10 daqiqada sayt `https://mystra-xxxx.onrender.com` manzilida ochiladi.

GitHub ga har yangi `push` dan keyin sayt avtomatik yangilanadi.
Bepul tarifda sayt 15 daqiqa ishlatilmasa "uxlaydi", birinchi ochilishi ~1 daqiqa olishi mumkin.
