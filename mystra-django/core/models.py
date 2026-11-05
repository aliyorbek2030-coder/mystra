import uuid
from datetime import timedelta

from django.db import models
from django.utils import timezone


def uid():
    return uuid.uuid4().hex[:16]


def trial_end():
    return timezone.now() + timedelta(days=7)  # yangi o'quvchiga 7 kun bepul


class Base(models.Model):
    id = models.CharField(max_length=32, primary_key=True, default=uid, editable=False)

    class Meta:
        abstract = True


class Group(Base):
    name = models.CharField(max_length=100)
    level = models.CharField(max_length=30)
    days = models.CharField(max_length=60, blank=True, default="")

    def __str__(self):
        return f"{self.name} ({self.level})"


class Account(Base):
    """Ustoz va admin akkauntlari (o'quvchilar alohida Student modelida)."""
    role = models.CharField(max_length=10)  # admin | teacher
    name = models.CharField(max_length=100)
    username = models.CharField(max_length=60, unique=True)
    password = models.CharField(max_length=200)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Student(Base):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=30, blank=True, default="")
    level = models.CharField(max_length=30)
    group = models.ForeignKey(Group, null=True, blank=True, on_delete=models.SET_NULL)
    username = models.CharField(max_length=60, unique=True)
    password = models.CharField(max_length=200)
    created = models.DateTimeField(auto_now_add=True)
    sub_until = models.DateTimeField(default=trial_end)  # sayt obunasi tugash vaqti
    parent_token = models.CharField(max_length=40, blank=True, default="", db_index=True)  # ota-ona havolasi

    def __str__(self):
        return self.name


class Signup(Base):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=30)
    username = models.CharField(max_length=60)
    password = models.CharField(max_length=200)
    group = models.ForeignKey(Group, null=True, on_delete=models.SET_NULL)
    level = models.CharField(max_length=30)
    status = models.CharField(max_length=10, default="pending")  # pending | approved | rejected
    created = models.DateTimeField(auto_now_add=True)


class Homework(Base):
    """Homework assigned to a specific group."""
    title = models.CharField(max_length=200)
    level = models.CharField(max_length=30)
    group = models.ForeignKey(
        Group,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="homeworks",
    )


class Task(Base):
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True, default="")
    questions = models.JSONField(default=list)
    type = models.CharField(max_length=20, default="writing")
    kind = models.CharField(max_length=10, default="extra")  # daily | extra
    level = models.CharField(max_length=30)
    group_id = models.CharField(max_length=32, null=True, blank=True)
    student_ids = models.JSONField(default=list)
    due = models.CharField(max_length=10, blank=True, default="")
    created_at = models.CharField(max_length=10)  # YYYY-MM-DD


class Submission(Base):
    task_id = models.CharField(max_length=32)  # Task yoki Homework id
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    kind = models.CharField(max_length=10)
    text = models.TextField(blank=True, default="")
    audio = models.CharField(max_length=200, null=True, blank=True)
    files = models.JSONField(default=list)
    answers = models.JSONField(default=list)
    date = models.CharField(max_length=10)
    day = models.CharField(max_length=10)
    attempt = models.IntegerField(default=1)
    status = models.CharField(max_length=10)  # done | ai | approved | retake
    ai_score = models.IntegerField(null=True)
    ai_feedback = models.TextField(blank=True, default="")
    ai_details = models.JSONField(default=dict, blank=True)  # {"errors":[...], "criteria":{...}}
    final = models.IntegerField(null=True)

    class Meta:
        indexes = [models.Index(fields=["student", "task_id"])]


class DaySubmit(Base):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    day = models.CharField(max_length=10)
    status = models.CharField(max_length=10, default="sent")
    total = models.IntegerField(default=0)
    final = models.IntegerField(null=True)


class HwRecord(Base):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.CharField(max_length=19)  # YYYY-MM-DDTHH:MM:SS
    items = models.JSONField(default=list)
    avg_score = models.IntegerField()
    note = models.CharField(max_length=200, blank=True, default="")
    extra = models.BooleanField(default=False)
    late = models.BooleanField(default=False)
    manual = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["student", "date"])]


class Certificate(Base):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    hw_record_id = models.CharField(max_length=32, unique=True)
    avg_score = models.IntegerField()
    date = models.CharField(max_length=19)
    quote = models.TextField()
    msg = models.TextField()
    style = models.JSONField(default=dict)


class Payment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    ym = models.CharField(max_length=7)
    paid = models.IntegerField(default=0)
    method = models.CharField(max_length=20, default="naqd")
    note = models.CharField(max_length=200, blank=True, default="")
    discount = models.IntegerField(default=0)
    date = models.CharField(max_length=40, blank=True, default="")
    status = models.CharField(max_length=10, default="unpaid")

    class Meta:
        unique_together = [("student", "ym")]


class Setting(models.Model):
    k = models.CharField(max_length=60, primary_key=True)
    v = models.JSONField(default=dict)


class Attendance(models.Model):
    date = models.CharField(max_length=10)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    v = models.CharField(max_length=1)  # p | a

    class Meta:
        unique_together = [("date", "student")]


class Notification(Base):
    to_id = models.CharField(max_length=32, db_index=True)  # o'quvchi id yoki 'teacher'
    text = models.TextField()
    page = models.CharField(max_length=60, blank=True, default="")
    date = models.BigIntegerField()
    read = models.BooleanField(default=False)


class SugLog(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, primary_key=True)
    ts = models.BigIntegerField()


class StoredFile(models.Model):
    """Yuklangan fayllar bazada saqlanadi — bepul hostingda disk har safar tozalanadi."""
    name = models.CharField(max_length=64, primary_key=True)
    mime = models.CharField(max_length=100)
    data = models.BinaryField()
    created = models.DateTimeField(auto_now_add=True)


class ParentChat(models.Model):
    """Ota-onaning Telegram chati (bot orqali /start <token> bilan ulanadi)."""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="parent_chats")
    chat_id = models.CharField(max_length=40)
    name = models.CharField(max_length=120, blank=True, default="")
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("student", "chat_id")]
