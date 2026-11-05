import os
import secrets

from django.core.management.base import BaseCommand

from core.auth import make_password
from core.models import Account


class Command(BaseCommand):
    help = "Birinchi admin va ustoz akkauntlarini yaratadi (faqat hech kim yo'q bo'lsa)."

    def handle(self, *a, **o):
        if Account.objects.exists():
            return self.stdout.write("Akkauntlar allaqachon bor.")
        for role, name, username, env in (("admin", "Admin", "admin", "ADMIN_PASSWORD"), ("teacher", "Muslima Teacher", "muslima", "TEACHER_PASSWORD")):
            pw = os.environ.get(env) or secrets.token_hex(6)
            Account.objects.create(role=role, name=name, username=username, password=make_password(pw))
            if not os.environ.get(env):
                self.stdout.write(f"[BIRINCHI ISHGA TUSHISH] {username} paroli: {pw}  (o'zgartiring!)")
