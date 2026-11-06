#!/usr/bin/env bash
# Render.com (yoki boshqa server) uchun to'liq build: backend + frontend + baza
set -o errexit

echo "==> Python kutubxonalari"
pip install --upgrade pip
pip install -r mystra-django/requirements.txt

echo "==> Frontend (React) build"
cd react_src
npm ci
npm run build -- --outDir ../mystra-django/frontend_dist --emptyOutDir
cd ..
# Sayt fayllarini oldindan siqish (gzip) — tezroq yuklanadi
python -m whitenoise.compress mystra-django/frontend_dist

echo "==> Django: static, migratsiya, birinchi akkauntlar"
cd mystra-django
python manage.py collectstatic --noinput
python manage.py migrate --noinput
python manage.py bootstrap
