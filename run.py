"""
MYSTRA - Barcha serverlarni bir buyruq bilan ishga tushiruvchi skript.
Ishlatish: python run.py
"""
import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DJANGO_DIR = ROOT / "mystra-django"
REACT_DIR = ROOT / "react_src"

def main():
    print("=" * 60)
    print("       MYSTRA - Tizimni Ishga Tushirish")
    print("=" * 60)

    # 1. Python paketlarini tekshirish
    print("\n[1/4] Python kutubxonalarini tekshirish...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], cwd=DJANGO_DIR, check=True)

    # 2. Migratsiyalar va bootstrap
    print("\n[2/4] Ma'lumotlar bazasini sozlash...")
    subprocess.run([sys.executable, "manage.py", "migrate"], cwd=DJANGO_DIR, check=True)
    subprocess.run([sys.executable, "manage.py", "bootstrap"], cwd=DJANGO_DIR, check=True)

    # 3. Node modullari
    print("\n[3/4] Frontend kutubxonalarini tekshirish...")
    if not (REACT_DIR / "node_modules").exists():
        print("Node modullari o'rnatilmoqda...")
        subprocess.run(["npm", "install"], cwd=REACT_DIR, shell=True, check=True)

    # 4. Ikkala serverni ishga tushirish
    print("\n[4/4] Serverlar ishga tushirilmoqda...")
    print(" - Backend:  http://127.0.0.1:8000/api/")
    print(" - Frontend: http://localhost:5173/")

    backend_proc = subprocess.Popen([sys.executable, "manage.py", "runserver", "127.0.0.1:8000"], cwd=DJANGO_DIR)
    frontend_proc = subprocess.Popen(["npm", "run", "dev"], cwd=REACT_DIR, shell=True)

    time.sleep(3)
    webbrowser.open("http://localhost:5173/")

    print("\n" + "=" * 60)
    print(" MYSTRA muvaffaqiyatli ishga tushirildi!")
    print(" Sayt ochildi: http://localhost:5173/")
    print("\n Kirish: login va parollar .env faylida (ADMIN_PASSWORD, TEACHER_PASSWORD).")
    print("\n Serverlarni to'xtatish uchun Ctrl+C bosing.")
    print("=" * 60 + "\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nServerlar to'xtatilmoqda...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
