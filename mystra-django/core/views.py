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
from .models import (Account, Attendance, Certificate, DaySubmit, Group, HwRecord, Homework, Notification, ParentChat, Payment, Signup, StoredFile, Student,
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
    level = str(b.get("level") or "").strip()

    if not title:
        raise E(400, "Vazifa nomini kiriting.")

    if len(title) > 200:
        raise E(400, "Vazifa nomi 200 belgidan oshmasligi kerak.")

    if group_id:
        # Bitta guruhga (eski usul, moslik uchun)
        g = Group.objects.filter(id=group_id).first()
        if not g:
            raise E(400, "Tanlangan guruh topilmadi.")
        h = Homework.objects.create(title=title, level=g.level, group=g)
        students = Student.objects.filter(group=g)
        where = g.name
    else:
        # Darajaga: shu darajadagi barcha guruhlarga umumiy vazifa
        if not level:
            raise E(400, "Vazifa uchun darajani tanlang.")
        h = Homework.objects.create(title=title, level=level, group=None)
        students = Student.objects.filter(level=level)
        where = level + " — barcha guruhlar"

    for student in students:
        L.notify(student.id, "Yangi vazifa: " + h.title, "/tasks")

    L.tg("tasks", f"📚 Yangi vazifa: {h.title} ({where})")

    return {"id": h.id, "title": h.title, "level": h.level, "groupId": h.group_id, "groupName": h.group.name if h.group else None}


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
                                    date=L.today(), day=t["createdAt"], attempt=att, status="done" if daily else "ai", ai_score=ai["score"], ai_feedback=ai["feedback"], ai_details=ai.get("details") or {})
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
            items.append({"id": s.id, "taskId": s.task_id, "title": (t or {}).get("title"), "ai": {"score": s.ai_score, "feedback": s.ai_feedback, **(s.ai_details or {})},
                          "suggested": L.suggested(s, t), "attempt": s.attempt, **media(s)})
        days.append({"id": ds.id, "day": ds.day, "total": ds.total, "student": L.pub_student(ds.student), "items": items})
    extra = []
    for s in Submission.objects.select_related("student").filter(status="ai", kind="extra"):
        t = L.find_task(s.task_id)
        extra.append({"id": s.id, "student": L.pub_student(s.student), "title": (t or {}).get("title"), "ai": {"score": s.ai_score, "feedback": s.ai_feedback, **(s.ai_details or {})},
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
    return L.generate_task(b["prompt"], b.get("type", "writing"), int(b.get("count") or 10), b.get("level") or "")


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
    return [{"group": row(o["group"], ["id", "name", "level", "days"]),
             "students": [{"id": s.id, "name": s.name, "avg": r["avg"], "streak": r["streak"], "last": r["last"], "weak": r["weak"]} for s, r in o["low"]]}
            for o in L.suggestions()]


def mark_suggested(o):
    for s, _ in o["low"]:
        SugLog.objects.update_or_create(student=s, defaults={"ts": L.now_ms()})


@api(["POST"], T)
def suggestions_send(request):
    """Ha → har bir zaif o'quvchiga o'zining xatolariga mos alohida 10 ta test; 'all' → butun guruhga umumiy test."""
    import concurrent.futures

    b = body(request)
    o = next((x for x in L.suggestions() if x["group"].id == b.get("groupId")), None)
    if not o:
        raise E(404, "Taklif topilmadi")
    g = o["group"]
    if b.get("all"):
        weak = sorted({w for _, r in o["low"] for w in r["weak"]})[:4]
        gen = L.generate_task(g.name + " guruhi uchun takrorlash", "test", 10, g.level, weak)
        r = L.create_task({**gen, "type": "test", "kind": "extra", "level": g.level, "groupId": g.id, "studentIds": []})
        mark_suggested(o)
        return {**r, "tasks": 1, "ai": gen.get("ai", False)}

    def make(item):
        st, rr = item
        topic = (", ".join(rr["weak"]) or "oxirgi darslar") + " — shaxsiy takrorlash"
        return st, L.generate_task(topic, "test", 10, g.level, rr["weak"])

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
        gens = list(ex.map(make, o["low"]))
    n, ai_used = 0, False
    for st, gen in gens:
        gen["title"] = (gen["title"] + " · " + st.name)[:120]
        L.create_task({**gen, "type": "test", "kind": "extra", "level": g.level, "groupId": None, "studentIds": [st.id]})
        n, ai_used = n + 1, ai_used or gen.get("ai", False)
    mark_suggested(o)
    return {"recipients": n, "tasks": n, "ai": ai_used}


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
    prev = Attendance.objects.filter(date=b["date"], student=st).values_list("v", flat=True).first()
    Attendance.objects.update_or_create(date=b["date"], student=st, defaults={"v": b["v"]})
    if b["v"] == "a" and prev != "a" and b["date"] == L.today():
        L.notify_parents(st, f"❗️ <b>{st.name}</b> bugun ({b['date']}) darsga kelmadi.")
    return {"ok": True}


@api(["GET", "PUT"], T)
def settings_view(request):
    if request.method == "GET":
        bot = L.cfg("bot_cfg") or {}
        return {"rating_weights": L.weights(), "late_pen": L.cfg("late_pen", 5), "pay_settings": L.cfg("pay_settings", {"levelPrices": {}}),
                "tg_opts": {"teacher": 1, "tasks": 1, **(L.cfg("tg_opts") or {})}, "bot": {"configured": bool(bot.get("token")), "gid": bot.get("gid", "")},
                "gemini": L.ai_enabled(), "ai": {"groq": bool(os.environ.get("GROQ_API_KEY")), "gemini": bool(os.environ.get("GEMINI_API_KEY"))}}
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


@api(["POST"], T)
def telegram_send_results(request):
    """'Yuborish' sahifasi: guruh natijalari matnini Telegram guruhiga yuboradi."""
    text = str(body(request).get("text") or "").strip()[:3500]
    if not text:
        raise E(400, "Yuboriladigan matn bo'sh")
    bot = L.cfg("bot_cfg") or {}
    if not bot.get("token") or not bot.get("gid"):
        raise E(400, "Telegram bot sozlanmagan. Sozlamalar bo'limini tekshiring.")
    if not L.tg_api("sendMessage", {"chat_id": bot["gid"], "text": text}):
        raise E(502, "Telegram xabarni yubora olmadi. Bot sozlamalarini tekshiring.")
    return {"sent": True}


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


# ───────── Moliya
@api(["GET"], T)
def finance(request):
    from datetime import date as _d
    today_ = timezone.localdate()
    months = []
    y, m = today_.year, today_.month
    for _ in range(6):
        months.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    months.reverse()
    students = list(Student.objects.select_related("group").all())
    pays = {(p.student_id, p.ym): p for p in Payment.objects.filter(ym__in=months)}
    series = []
    for ym in months:
        paid = expected = 0
        for st in students:
            if st.created.strftime("%Y-%m") > ym:
                continue
            p = pays.get((st.id, ym))
            disc = p.discount if p else 0
            expected += scoring.net_price(price_of(st.level), disc)
            paid += p.paid if p else 0
        series.append({"ym": ym, "paid": paid, "expected": expected})
    cur = months[-1]
    debtors, by_level = [], {}
    for st in students:
        p = pays.get((st.id, cur))
        net = scoring.net_price(price_of(st.level), p.discount if p else 0)
        paid = p.paid if p else 0
        lv = by_level.setdefault(st.level, {"level": st.level, "students": 0, "paid": 0, "expected": 0})
        lv["students"] += 1
        lv["paid"] += paid
        lv["expected"] += net
        if net > 0 and paid < net:
            debtors.append({"student": L.pub_student(st), "group": st.group.name if st.group_id else "", "net": net, "paid": paid, "debt": net - paid})
    debtors.sort(key=lambda x: -x["debt"])
    now_, prev_ = series[-1], series[-2] if len(series) > 1 else {"paid": 0}
    new_students = sum(1 for st in students if st.created.strftime("%Y-%m") == cur)
    return {"months": series, "current": {**now_, "debt": max(0, now_["expected"] - now_["paid"]),
            "growth": (round((now_["paid"] - prev_["paid"]) / prev_["paid"] * 100) if prev_["paid"] else None), "newStudents": new_students,
            "students": len(students)}, "debtors": debtors[:50], "byLevel": sorted(by_level.values(), key=lambda x: -x["paid"])}


@api(["POST"], T)
def remind_debtors(request):
    """Qarzdorlarning ota-onalariga (Telegram ulangan bo'lsa) eslatma yuboradi."""
    cur = L.ym_now()
    n = 0
    for st in Student.objects.all():
        p = Payment.objects.filter(student=st, ym=cur).first()
        net = scoring.net_price(price_of(st.level), p.discount if p else 0)
        if net > 0 and (p.paid if p else 0) < net:
            L.notify(st.id, "Eslatma: shu oy uchun to'lov hali to'liq qilinmagan.", "/pay")
            if st.parent_chats.exists():
                L.notify_parents(st, f"💳 Eslatma: <b>{st.name}</b> uchun {cur} oyi to'lovi hali to'liq qilinmagan. Qoldiq: {net - (p.paid if p else 0):,} so'm".replace(",", " "))
            n += 1
    return {"sent": n}


# ───────── So'z kartochkalari (AI topgan xatolardan)
@api(["GET"], STU)
def my_cards(request):
    st, seen, cards = request.user.obj, set(), []
    for s in Submission.objects.filter(student=st).exclude(ai_details={}).order_by("-date")[:80]:
        for e in (s.ai_details or {}).get("errors", []):
            key = (e.get("wrong", "").lower(), e.get("right", "").lower())
            if not e.get("right") or key in seen:
                continue
            seen.add(key)
            cards.append({"id": f"{s.id}-{len(cards)}", "type": e.get("type"), "wrong": e.get("wrong"), "right": e.get("right"), "why": e.get("why", ""), "date": s.date})
    return cards[:120]


# ───────── O'yin elementlari
@api(["GET"], STU)
def my_game(request):
    return L.game_info(request.user.obj)


# ───────── Ota-onalar
@api(["GET"])
def parent_view(request, token):
    st = Student.objects.select_related("group").filter(parent_token=token).first() if len(token) >= 16 else None
    if not st:
        raise E(404, "Havola noto'g'ri yoki eskirgan")
    return L.parent_report(st, 7 if request.query_params.get("p") != "month" else 30)


@api(["GET", "POST"], T)
def parent_link(request, id):
    st = Student.objects.filter(id=id).first()
    if not st:
        raise E(404, "Topilmadi")
    if request.method == "POST":  # yangi havola (eskisi ishlamay qoladi)
        st.parent_token = ""
        st.save(update_fields=["parent_token"])
        ParentChat.objects.filter(student=st).delete()
    tok = L.parent_token(st)
    bot = L.bot_cfg()
    return {"token": tok, "path": f"/#/p/{tok}", "telegram": f"https://t.me/{bot['username']}?start={tok}" if bot.get("username") else None,
            "chats": ParentChat.objects.filter(student=st).count()}


@api(["GET"], T)
def parent_links(request):
    bot = L.bot_cfg()
    out = []
    for st in Student.objects.select_related("group").order_by("name"):
        tok = L.parent_token(st)
        out.append({"student": L.pub_student(st), "group": st.group.name if st.group_id else "", "token": tok, "path": f"/#/p/{tok}",
                    "telegram": f"https://t.me/{bot['username']}?start={tok}" if bot.get("username") else None,
                    "chats": st.parent_chats.count()})
    return {"bot": {"configured": bool(bot.get("token")), "username": bot.get("username"), "connected": bool(bot.get("webhook"))}, "items": out}


@api(["POST"], T)
def telegram_connect(request):
    """Botni ota-onalar uchun ulaydi: webhook o'rnatadi va bot nomini saqlaydi."""
    bot = L.bot_cfg()
    if not bot.get("token"):
        raise E(400, "Avval Sozlamalarda bot tokenini kiriting")
    me = L.tg_api("getMe", {})
    if not me or not me.get("ok"):
        raise E(400, "Bot token noto'g'ri yoki Telegram javob bermadi")
    url = request.build_absolute_uri(f"/api/telegram/webhook/{L.webhook_secret()}").replace("http://", "https://")
    r = L.tg_api("setWebhook", {"url": url, "allowed_updates": ["message"]})
    if not r or not r.get("ok"):
        raise E(400, "Webhook o'rnatilmadi: " + str((r or {}).get("description", "Telegram xatosi")))
    L.tg_api("setMyCommands", {"commands": [{"command": "hisobot", "description": "Farzandim haftalik hisoboti"},
                                            {"command": "start", "description": "Boshlash"}]})
    L.set_cfg("bot_cfg", {**bot, "username": me["result"].get("username"), "webhook": url})
    return {"ok": True, "username": me["result"].get("username")}


@api(["POST"])
def telegram_webhook(request, secret):
    if secret != L.webhook_secret():
        raise E(404, "Topilmadi")
    msg = (body(request).get("message") or {})
    chat = msg.get("chat") or {}
    chat_id, text = str(chat.get("id") or ""), str(msg.get("text") or "").strip()
    if not chat_id or not text:
        return {"ok": True}
    name = " ".join(x for x in [chat.get("first_name"), chat.get("last_name")] if x)[:120]
    if text.startswith("/start"):
        tok = text.split(" ", 1)[1].strip() if " " in text else ""
        st = Student.objects.filter(parent_token=tok).first() if len(tok) >= 16 else None
        if not st:
            L.tg_to(chat_id, "Salom! 👋 Farzandingiz hisobotini olish uchun ustoz bergan maxsus havola orqali kiring.")
            return {"ok": True}
        ParentChat.objects.get_or_create(student=st, chat_id=chat_id, defaults={"name": name})
        L.tg_to(chat_id, f"✅ Ulandingiz! Endi <b>{st.name}</b> natijalari, davomati va tasdiqlangan vazifalari haqida shu yerga xabar keladi.\n\n"
                         "Haftalik hisobot uchun /hisobot yozing.")
        L.tg_to(chat_id, L.parent_report_text(st))
        return {"ok": True}
    if text.startswith("/hisobot"):
        chats = ParentChat.objects.select_related("student").filter(chat_id=chat_id)
        if not chats:
            L.tg_to(chat_id, "Siz hali hech bir o'quvchiga ulanmagansiz. Ustoz bergan havola orqali kiring.")
        for c in chats:
            L.tg_to(chat_id, L.parent_report_text(c.student))
        return {"ok": True}
    L.tg_to(chat_id, "Buyruqlar: /hisobot — haftalik hisobot")
    return {"ok": True}


@api(["GET"])
def health(request):
    return {"ok": True, "time": L.now_ms()}
