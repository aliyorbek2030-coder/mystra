"""API endpointlari (Node versiyadagi server.js bilan bir xil yo'llar va javob shakllari)."""
import mimetypes
import os
import re
from functools import wraps
from pathlib import Path

from django.conf import settings
from django.core.cache import cache
from django.http import FileResponse, HttpResponse
from django.http.response import HttpResponseBase
from django.utils import timezone
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from . import logic as L
from . import scoring
from .auth import TokenAuth, check_password, make_password, make_token, role_permission
from .errors import E
from .models import (Account, Attendance, Certificate, DaySubmit, Group, HwRecord, Homework, Notification, Payment, Signup, StoredFile, Student,
                     Submission, SugLog, Task)

T = ["teacher", "admin"]
ANY = ["teacher", "admin", "student"]
STU = ["student"]
ADM = ["admin"]


def api(methods, roles=None):
    def deco(fn):
        @wraps(fn)
        def inner(request, *a, **k):
            out = fn(request, *a, **k)
            return out if isinstance(out, HttpResponseBase) else Response(out)
        inner = authentication_classes([TokenAuth])(inner)
        inner = permission_classes([role_permission(roles) if roles else AllowAny])(inner)
        return api_view(methods)(inner)
    return deco


def body(request):
    return request.data if isinstance(request.data, dict) else {}


def clamp(v, lo=0, hi=100):
    try:
        return max(lo, min(hi, float(v)))
    except (TypeError, ValueError):
        return lo


def price_of(level):
    return int(((L.cfg("pay_settings") or {}).get("levelPrices") or {}).get(level) or 0)


def row(o, fields):
    return {f: getattr(o, f) for f in fields}


def unique_username(un):
    return (Account.objects.filter(username=un).exists() or Student.objects.filter(username=un).exists())


# ───────── AUTH
@api(["POST"])
def login(request):
    b = body(request)
    username, pw = str(b.get("username", "")), str(b.get("password", ""))
    key = f"fail:{request.META.get('REMOTE_ADDR')}|{username.lower()}"
    n = cache.get(key, 0)
    if n >= 5:
        raise E(429, "Ko'p urinish. 10 daqiqadan keyin qayta urining.")
    acc = Account.objects.filter(username=username).first()
    stu = None if acc else Student.objects.filter(username=username).first()
    r = acc or stu
    if not r or not check_password(pw, r.password):
        cache.set(key, n + 1, 600)
        sg = Signup.objects.filter(username=username).exclude(status="approved").first()
        if sg and check_password(pw, sg.password):
            raise E(403, "So'rovingiz hali tasdiqlanmagan." if sg.status == "pending" else "So'rovingiz rad etilgan.")
        raise E(401, "Login yoki parol noto'g'ri.")
    cache.delete(key)
    role = acc.role if acc else "student"
    user = {"id": r.id, "role": role, "name": r.name, "username": r.username}
    if stu:
        user.update(level=stu.level, groupId=stu.group_id)
    return {"token": make_token(r.id, role), "user": user}


@api(["GET"])
def groups_public(request):
    return list(Group.objects.values("id", "name", "level"))


@api(["POST"])
def signup(request):
    b = body(request)
    g = Group.objects.filter(id=b.get("groupId")).first()
    un, name = str(b.get("username") or "").strip(), str(b.get("name") or "").strip()
    if not name or not un or not g:
        raise E(400, "Hamma maydonni to'ldiring.")
    if len(re.sub(r"\D", "", str(b.get("phone") or ""))) < 9:
        raise E(400, "Telefon raqam noto'g'ri.")
    if len(str(b.get("password") or "")) < 4:
        raise E(400, "Parol kamida 4 belgi bo'lsin.")
    if unique_username(un) or Signup.objects.filter(username=un, status="pending").exists():
        raise E(409, "Bu login band.")
    Signup.objects.create(name=name, phone=str(b["phone"]).strip(), username=un, password=make_password(b["password"]), group=g, level=g.level)
    L.notify("teacher", "Yangi ro'yxatdan o'tish so'rovi: " + name, "/signups")
    L.tg("teacher", "🔔 Yangi ro'yxatdan o'tish so'rovi: " + name)
    return {"ok": True}


@api(["GET"], ANY)
def me(request):
    u = request.user
    return {"id": u.id, "role": u.role, "name": u.name, "username": u.obj.username}


@api(["POST"], ANY)
def change_password(request):
    b, o = body(request), request.user.obj
    if not check_password(str(b.get("oldPassword") or ""), o.password):
        raise E(400, "Joriy parol noto'g'ri.")
    if len(str(b.get("newPassword") or "")) < 4:
        raise E(400, "Parol kamida 4 belgi bo'lsin.")
    o.password = make_password(b["newPassword"])
    o.save()
    return {"ok": True}


# ───────── ustoz: guruh / o'quvchi / vazifalar ro'yxati / so'rovlar
@api(["GET", "POST"], T)
def groups(request):
    if request.method == "GET":
        return list(Group.objects.values("id", "name", "level", "days"))
    b = body(request)
    if not b.get("name") or b.get("level") not in L.LEVELS:
        raise E(400, "Nom va daraja kerak")
    return {"id": Group.objects.create(name=b["name"], level=b["level"], days=b.get("days", "")).id}


@api(["PATCH", "DELETE"], T)
def group_detail(request, id):
    g = Group.objects.filter(id=id).first()
    if g and request.method == "DELETE":
        g.delete()
    elif g:
        b = body(request)
        g.name, g.days = b.get("name") or g.name, b["days"] if "days" in b else g.days
        g.save()
    return {"ok": True}


@api(["GET", "POST"], T)
def students(request):
    if request.method == "GET":
        return [{**L.pub_student(s), "sub": L.sub_info(s)} for s in Student.objects.order_by("name")]
    b = body(request)
    g = Group.objects.filter(id=b.get("groupId")).first()
    if not b.get("name") or not b.get("username") or len(str(b.get("password") or "")) < 4 or not g:
        raise E(400, "Ism, login, parol (4+) va guruh kerak")
    if unique_username(b["username"]):
        raise E(409, "Login band")
    return {"id": Student.objects.create(name=b["name"], phone=b.get("phone", ""), level=g.level, group=g, username=b["username"], password=make_password(b["password"])).id}


@api(["PATCH", "DELETE"], T)
def student_detail(request, id):
    s = Student.objects.filter(id=id).first()
    if not s:
        return {"ok": True}
    if request.method == "DELETE":
        Notification.objects.filter(to_id=id).delete()
        s.delete()
        return {"ok": True}
    b = body(request)
    g = Group.objects.filter(id=b.get("groupId")).first() if b.get("groupId") else None
    s.name, s.phone = b.get("name") or s.name, b["phone"] if "phone" in b else s.phone
    if g:
        s.group, s.level = g, g.level
    if b.get("password"):
        if len(str(b["password"])) < 4:
            raise E(400, "Parol qisqa")
        s.password = make_password(b["password"])
    s.save()
    return {"ok": True}


@api(["GET", "POST"], T)
def homeworks(request):
    if request.method == "GET":
        return [
            {
                "id": h.id,
                "title": h.title,
                "level": h.level,
                "groupId": h.group_id,
                "groupName": h.group.name if h.group else None,
            }
            for h in Homework.objects.select_related("group").all()
        ]

    b = body(request)
    title = str(b.get("title") or "").strip()
    group_id = b.get("groupId")

    if not title:
        raise E(400, "Vazifa nomini kiriting.")

    if len(title) > 200:
        raise E(400, "Vazifa nomi 200 belgidan oshmasligi kerak.")

    if not group_id:
        raise E(400, "Vazifa uchun guruh tanlang.")

    g = Group.objects.filter(id=group_id).first()
    if not g:
        raise E(400, "Tanlangan guruh topilmadi.")

    # Guruhning darajasi avtomatik olinadi.
    h = Homework.objects.create(
        title=title,
        level=g.level,
        group=g,
    )

    # Faqat tanlangan guruh o'quvchilariga xabar yuboriladi.
    students = Student.objects.filter(group=g)

    for student in students:
        L.notify(
            student.id,
            "Yangi vazifa: " + h.title,
            "/tasks",
        )

    L.tg(
        "tasks",
        f"📚 Yangi vazifa: {h.title} ({g.name})",
    )

    return {
        "id": h.id,
        "title": h.title,
        "level": h.level,
        "groupId": g.id,
        "groupName": g.name,
    }


@api(["DELETE"], T)
def homework_delete(request, id):
    Homework.objects.filter(id=id).delete()
    return {"ok": True}


@api(["GET"], T)
def signups_list(request):
    return [{"id": s.id, "name": s.name, "phone": s.phone, "username": s.username, "groupId": s.group_id, "level": s.level} for s in Signup.objects.filter(status="pending")]


@api(["POST"], T)
def signup_approve(request, id):
    x = Signup.objects.filter(id=id, status="pending").first()
    if not x:
        raise E(404, "Topilmadi")
    if Student.objects.filter(username=x.username).exists():
        raise E(409, "Login band")
    Student.objects.create(name=x.name, phone=x.phone, level=x.level, group=x.group, username=x.username, password=x.password)
    x.status = "approved"
    x.save()
    return {"ok": True}


@api(["POST"], T)
def signup_reject(request, id):
    Signup.objects.filter(id=id).update(status="rejected")
    return {"ok": True}


# ───────── admin
@api(["GET", "POST"], ADM)
def teachers(request):
    if request.method == "GET":
        return list(Account.objects.filter(role="teacher").values("id", "name", "username", "role"))
    b = body(request)
    if not b.get("name") or not b.get("username") or len(str(b.get("password") or "")) < 4:
        raise E(400, "Ism, login, parol (4+) kerak")
    if unique_username(b["username"]):
        raise E(409, "Login band")
    return {"id": Account.objects.create(role="teacher", name=b["name"], username=b["username"], password=make_password(b["password"])).id}


@api(["PATCH", "DELETE"], ADM)
def teacher_detail(request, id):
    a = Account.objects.filter(id=id, role="teacher").first()
    if a and request.method == "DELETE":
        a.delete()
    elif a:
        b = body(request)
        a.name = b.get("name") or a.name
        if b.get("password"):
            if len(str(b["password"])) < 4:
                raise E(400, "Parol qisqa")
            a.password = make_password(b["password"])
        a.save()
    return {"ok": True}


@api(["GET"], ADM)
def admin_stats(request):
    return {"students": Student.objects.count(), "teachers": Account.objects.filter(role="teacher").count(), "certificates": Certificate.objects.count(),
            "submissions": Submission.objects.count()}


# ───────── o'quvchi
def pub_sub(s):
    return {"id": s.id, "taskId": s.task_id, "kind": s.kind, "date": s.date, "day": s.day, "attempt": s.attempt, "status": s.status, "final": s.final}


@api(["GET"], STU)
def my_tasks(request):
    st = request.user.obj
    return {"tasks": L.tasks_for(st), "submissions": [pub_sub(s) for s in Submission.objects.filter(student=st)],
            "daySubmits": list(DaySubmit.objects.filter(student=st).values("id", "day", "status", "total", "final")), "sub": L.sub_info(st),
            "stats": {**L.streak_xp(st), "att": L.att_stats(st)}, "rating": L.calc_rating(st)}


@api(["POST"], STU)
def task_submit(request, id):
    st, b = request.user.obj, body(request)
    t = next((x for x in L.tasks_for(st) if x["id"] == id), None)
    if not t:
        raise E(404, "Vazifa topilmadi")
    if not L.sub_info(st)["active"]:
        raise E(402, "Obuna muddati tugagan. Topshirish uchun obunani yangilang.")
    daily = t["kind"] == "daily"
    if daily and DaySubmit.objects.filter(student=st, day=t["createdAt"]).exists():
        raise E(409, "Bu kun ustozga yuborilgan, qayta topshirib bo'lmaydi.")
    text = str(b.get("text") or "")[:8000]
    answers = b["answers"][:100] if isinstance(b.get("answers"), list) else []
    if not text and not b.get("audio") and not (b.get("files") or []) and not answers:
        raise E(400, "Javob kiriting")
    audio = L.save_data_url(b["audio"], 5_000_000) if b.get("audio") else None
    files = [{**L.save_data_url(f.get("d"), 3_000_000), "n": str(f.get("n") or "fayl")[:80]} for f in (b.get("files") or [])[:3]]
    q = Submission.objects.filter(student=st, task_id=t["id"])
    if daily:
        q = q.filter(day=t["createdAt"])
    att = q.count() + 1
    ai = L.ai_check(text, answers, audio, files, t)
    q.exclude(status="approved").delete()
    sub = Submission.objects.create(task_id=t["id"], student=st, kind=t["kind"], text=text, audio="/uploads/" + audio["name"] if audio else None,
                                    files=[{"n": f["n"], "u": "/uploads/" + f["name"], "mime": f["mime"]} for f in files], answers=answers,
                                    date=L.today(), day=t["createdAt"], attempt=att, status="done" if daily else "ai", ai_score=ai["score"], ai_feedback=ai["feedback"])
    if not daily:
        L.notify("teacher", f"{st.name} extra work topshirdi: {t['title']}", "/review")
        L.tg("teacher", f"🔔 {st.name} extra work topshirdi: {t['title']}")
    return {"id": sub.id, "attempt": att, "status": sub.status}


@api(["POST"], STU)
def day_finish(request, day):
    st = request.user.obj
    if DaySubmit.objects.filter(student=st, day=day).exists():
        raise E(409, "Allaqachon yuborilgan")
    total = len([t for t in L.tasks_for(st) if t["kind"] == "daily" and t["createdAt"] == day])
    done = Submission.objects.filter(student=st, day=day, kind="daily").count()
    if not done:
        raise E(400, "Avval kamida bitta vazifani bajaring")
    DaySubmit.objects.create(student=st, day=day, status="sent", total=total)
    L.notify("teacher", f"{st.name}: {day} kunlik vazifalari yuborildi ({done}/{total})", "/review")
    L.tg("teacher", f"🔔 {st.name}: {day} kunlik vazifalari yuborildi ({done}/{total})")
    return {"ok": True, "done": done, "total": total}


def cert_row(c):
    return {"id": c.id, "student_id": c.student_id, "hw_record_id": c.hw_record_id, "avg_score": c.avg_score, "date": c.date, "quote": c.quote, "msg": c.msg, "style": c.style}


@api(["GET"], STU)
def my_certificates(request):
    return [cert_row(c) for c in Certificate.objects.filter(student=request.user.obj).order_by("-date")]


@api(["GET"], STU)
def my_payments(request):
    st = request.user.obj
    months = [{"student_id": st.id, "ym": p.ym, "paid": p.paid, "method": p.method, "note": p.note, "discount": p.discount, "date": p.date, "status": p.status}
              for p in Payment.objects.filter(student=st).order_by("-ym")[:6]]
    return {"price": price_of(st.level), "subscription": {**L.sub_info(st), "price": 9900}, "months": months}


@api(["GET"], STU)
def my_archive(request):
    st, months = request.user.obj, {}
    for r in HwRecord.objects.filter(student=st).order_by("-date"):
        months.setdefault(r.date[:7], []).append({"id": r.id, "date": r.date, "avgScore": r.avg_score, "extra": r.extra, "note": r.note})
    certs = list(Certificate.objects.filter(student=st).values_list("date", flat=True))
    return [{"ym": ym, "n": len(recs), "avg": scoring.r(sum(x["avgScore"] for x in recs) / len(recs)), "certs": len([c for c in certs if c.startswith(ym)]),
             "att": L.att_stats(st, ym), "recs": recs} for ym, recs in sorted(months.items(), reverse=True)]


# ───────── bildirishnomalar
def inbox_id(request):
    return request.user.id if request.user.role == "student" else "teacher"


@api(["GET"], ANY)
def notifications(request):
    return [{"id": n.id, "to_id": n.to_id, "text": n.text, "page": n.page, "date": n.date, "read": int(n.read)}
            for n in Notification.objects.filter(to_id=inbox_id(request), read=False).order_by("-date")[:20]]


@api(["POST"], ANY)
def notification_read(request, id):
    Notification.objects.filter(id=id, to_id=inbox_id(request)).update(read=True)
    return {"ok": True}


# ───────── tekshirish
def media(s):
    return {"audio": s.audio, "files": s.files, "text": s.text}


@api(["GET"], T)
def review(request):
    days = []
    for ds in DaySubmit.objects.select_related("student").filter(status="sent").order_by("day"):
        items = []
        for s in Submission.objects.filter(student=ds.student, day=ds.day, kind="daily"):
            t = L.find_task(s.task_id)
            items.append({"id": s.id, "taskId": s.task_id, "title": (t or {}).get("title"), "ai": {"score": s.ai_score, "feedback": s.ai_feedback},
                          "suggested": L.suggested(s, t), "attempt": s.attempt, **media(s)})
        days.append({"id": ds.id, "day": ds.day, "total": ds.total, "student": L.pub_student(ds.student), "items": items})
    extra = []
    for s in Submission.objects.select_related("student").filter(status="ai", kind="extra"):
        t = L.find_task(s.task_id)
        extra.append({"id": s.id, "student": L.pub_student(s.student), "title": (t or {}).get("title"), "ai": {"score": s.ai_score, "feedback": s.ai_feedback},
                      "suggested": L.suggested(s, t), **media(s)})
    return {"days": days, "extra": extra}


@api(["POST"], T)
def day_approve(request, id):
    return L.approve_day(id, body(request).get("scores") or {})


@api(["POST"], T)
def day_return(request, id):
    ds = DaySubmit.objects.filter(id=id).first()
    if not ds:
        raise E(404, "Topilmadi")
    sid, day = ds.student_id, ds.day
    ds.delete()
    L.notify(sid, day + " kunlik vazifalarini qayta topshiring", "/tasks")
    return {"ok": True}


@api(["POST"], T)
def submission_approve(request, id):
    return L.approve_extra(id, body(request).get("final"))


@api(["POST"], T)
def submission_return(request, id):
    s = Submission.objects.filter(id=id).first()
    if not s:
        raise E(404, "Topilmadi")
    s.status = "retake"
    s.save()
    L.notify(s.student_id, "Qayta topshiring: " + ((L.find_task(s.task_id) or {}).get("title") or "vazifa"), "/tasks")
    return {"ok": True}


@api(["POST"], T)
def manual_records(request):
    b = body(request)
    st = Student.objects.filter(id=b.get("studentId")).first()
    if not st:
        raise E(404, "O'quvchi topilmadi")
    return L.manual_record(st, str(b.get("date") or L.today())[:10], b.get("items") or [], b.get("note"))



@api(["GET"], T)
def hwcheck_submissions(request):
    group_id = request.GET.get("groupId", "").strip()

    if not group_id:
        return []

    submissions = (
        Submission.objects
        .select_related("student")
        .filter(student__group_id=group_id)
        .order_by("-date")
    )

    result = []

    for s in submissions:
        task = L.find_task(s.task_id)

        result.append({
            "id": s.id,
            "studentId": s.student_id,
            "taskId": s.task_id,
            "title": (task or {}).get("title", "Vazifa"),
            "date": s.date,
            "text": s.text,
            "audio": s.audio,
            "files": s.files,
        })

    return result

    
# ───────── AI vazifa va takliflar
@api(["POST"], T)
def ai_generate(request):
    b = body(request)
    if not b.get("prompt"):
        raise E(400, "Mavzu kerak")
    return L.generate_task(b["prompt"], b.get("type", "writing"), int(b.get("count") or 10))


@api(["POST"], T)
def tasks_create(request):
    b = body(request)
    if not b.get("title") or b.get("level") not in L.LEVELS:
        raise E(400, "Nom va daraja kerak")
    r = L.create_task(b)
    L.tg("tasks", f"📚 Yangi {'kunlik vazifa' if b.get('kind') == 'daily' else 'extra work ⭐'}: {b['title']} ({b['level']})")
    return r


@api(["GET"], T)
def suggestions(request):
    return [{"group": row(o["group"], ["id", "name", "level", "days"]), "students": [{"id": s.id, "name": s.name, "avg": r["avg"]} for s, r in o["low"]]} for o in L.suggestions()]


def mark_suggested(o):
    for s, _ in o["low"]:
        SugLog.objects.update_or_create(student=s, defaults={"ts": L.now_ms()})


@api(["POST"], T)
def suggestions_send(request):
    b = body(request)
    o = next((x for x in L.suggestions() if x["group"].id == b.get("groupId")), None)
    if not o:
        raise E(404, "Taklif topilmadi")
    gen = L.generate_task(o["group"].name + " guruhi uchun takrorlash", "test", 10)
    r = L.create_task({**gen, "type": "test", "kind": "extra", "level": o["group"].level, "groupId": o["group"].id if b.get("all") else None,
                       "studentIds": [] if b.get("all") else [s.id for s, _ in o["low"]]})
    mark_suggested(o)
    return r


@api(["POST"], T)
def suggestions_skip(request):
    o = next((x for x in L.suggestions() if x["group"].id == body(request).get("groupId")), None)
    if o:
        mark_suggested(o)
    return {"ok": True}


# ───────── to'lov, obuna, davomat, sozlamalar, hisobot
@api(["GET"], T)
def payments_list(request):
    ym, out = request.query_params.get("ym") or L.ym_now(), []
    for s in Student.objects.order_by("name"):
        p, price = Payment.objects.filter(student=s, ym=ym).first(), price_of(s.level)
        d = p.discount if p else 0
        out.append({"student": L.pub_student(s), "price": price, "discount": d, "netPrice": scoring.net_price(price, d), "paid": p.paid if p else 0,
                    "method": p.method if p else "", "note": p.note if p else "", "status": p.status if p else "unpaid"})
    return out


@api(["PUT"], T)
def payment_set(request, sid, ym):
    s = Student.objects.filter(id=sid).first()
    if not s or not re.fullmatch(r"\d{4}-\d{2}", ym):
        raise E(400, "O'quvchi yoki oy noto'g'ri")
    b = body(request)
    disc, paid = int(clamp(b.get("discount"))), max(0, int(float(b.get("paid") or 0)))
    Payment.objects.update_or_create(student=s, ym=ym, defaults={"paid": paid, "method": b.get("method") or "naqd", "note": str(b.get("note") or "")[:200], "discount": disc,
                                                                 "date": timezone.now().isoformat(), "status": scoring.payment_status(paid, price_of(s.level), disc)})
    return {"ok": True}


@api(["POST"], T)
def sub_extend(request, sid):
    s = Student.objects.filter(id=sid).first()
    if not s:
        raise E(404, "O'quvchi topilmadi")
    from datetime import timedelta
    s.sub_until = max(timezone.now(), s.sub_until) + timedelta(days=30)
    s.save()
    return L.sub_info(s)


@api(["PUT"], ADM)
def sub_set(request, sid):
    from datetime import datetime, timezone as tz
    Student.objects.filter(id=sid).update(sub_until=datetime.fromtimestamp((float(body(request).get("until") or 0)) / 1000, tz.utc))
    return {"ok": True}


@api(["GET", "PUT"], T)
def attendance(request):
    if request.method == "GET":
        date = request.query_params.get("date") or L.today()
        return [{"studentId": a.student_id, "v": a.v} for a in Attendance.objects.filter(date=date)]
    b = body(request)
    st = Student.objects.filter(id=b.get("studentId")).first()
    if b.get("v") not in ("p", "a") or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(b.get("date"))) or not st:
        raise E(400, "Noto'g'ri qiymat")
    Attendance.objects.update_or_create(date=b["date"], student=st, defaults={"v": b["v"]})
    return {"ok": True}


@api(["GET", "PUT"], T)
def settings_view(request):
    if request.method == "GET":
        bot = L.cfg("bot_cfg") or {}
        return {"rating_weights": L.weights(), "late_pen": L.cfg("late_pen", 5), "pay_settings": L.cfg("pay_settings", {"levelPrices": {}}),
                "tg_opts": {"teacher": 1, "tasks": 1, **(L.cfg("tg_opts") or {})}, "bot": {"configured": bool(bot.get("token")), "gid": bot.get("gid", "")},
                "gemini": bool(os.environ.get("GEMINI_API_KEY"))}
    b = body(request)
    if b.get("rating_weights"):
        w = b["rating_weights"]
        if sum(float(w.get(k) or 0) for k in "qrgt") != 100:
            raise E(400, "Ulushlar yig'indisi 100 bo'lsin")
        L.set_cfg("rating_weights", {**{k: float(w.get(k) or 0) for k in "qrgt"}, "xMax": float(w.get("xMax") or 0)})
    if "late_pen" in b:
        L.set_cfg("late_pen", clamp(b["late_pen"]))
    if b.get("pay_settings"):
        lp = b["pay_settings"].get("levelPrices") or {}
        L.set_cfg("pay_settings", {"levelPrices": {lv: max(0, int(float(lp.get(lv) or 0))) for lv in L.LEVELS}})
    if b.get("tg_opts"):
        L.set_cfg("tg_opts", {"teacher": 1 if b["tg_opts"].get("teacher") else 0, "tasks": 1 if b["tg_opts"].get("tasks") else 0})
    bot = b.get("bot") or {}
    if bot.get("token") or bot.get("gid"):
        o = L.cfg("bot_cfg") or {}
        L.set_cfg("bot_cfg", {"token": bot.get("token") or o.get("token", ""), "gid": bot.get("gid") or o.get("gid", "")})
    return {"ok": True}


@api(["GET"], T)
def rating(request):
    out = [{"student": L.pub_student(s), **L.calc_rating(s)} for s in Student.objects.all()]
    return sorted(out, key=lambda x: -x["score"])


@api(["GET"], T)
def reports_month(request):
    ym, out = request.query_params.get("ym") or L.ym_now(), []
    for s in Student.objects.order_by("name"):
        r = list(HwRecord.objects.filter(student=s, date__startswith=ym).values_list("avg_score", flat=True))
        out.append({"student": L.pub_student(s), "n": len(r), "avg": scoring.r(sum(r) / len(r)) if r else 0, "rating": L.calc_rating(s)["score"] if ym == L.ym_now() else None,
                    "certs": Certificate.objects.filter(student=s, date__startswith=ym).count(), "att": L.att_stats(s, ym)})
    return out


@api(["GET"], T)
def certificates(request):
    return [cert_row(c) for c in Certificate.objects.order_by("-date")[:100]]


@api(["POST"], T)
def telegram_send(request):
    return {"sent": L.tg_sync("teacher", str(body(request).get("text") or "")[:3500])}


@api(["GET"], ANY)
def upload(request, name):
    name = Path(name).name
    sf = StoredFile.objects.filter(name=name).first()
    if sf:
        resp = HttpResponse(bytes(sf.data), content_type=sf.mime)
        resp["Cache-Control"] = "private, max-age=86400"
        return resp
    f = settings.UPLOAD_DIR / name  # eski fayllar (diskda)
    if not f.exists():
        raise E(404, "Topilmadi")
    return FileResponse(open(f, "rb"), content_type=mimetypes.guess_type(f.name)[0] or "application/octet-stream")


@api(["GET"])
def health(request):
    return {"ok": True, "time": L.now_ms()}
