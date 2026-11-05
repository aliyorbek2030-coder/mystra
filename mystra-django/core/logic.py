"""Biznes-mantiq (Node versiyadagi logic.js bilan bir xil qoidalar)."""
import base64
import json
import logging
import math
import os
import random
import threading
import urllib.request
import uuid
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from . import scoring
from .errors import E
from .models import (Attendance, Certificate, DaySubmit, Group, HwRecord, Homework, Notification, Setting, Student,
                     Submission, SugLog, Task)

log = logging.getLogger("mystra")
CERT = json.loads((Path(__file__).parent / "cert_data.json").read_text(encoding="utf-8"))
LEVELS = ["Beginner", "Elementary", "Pre-Intermediate", "Intermediate", "Upper-Intermediate", "IELTS"]


def today():
    return timezone.localdate().isoformat()  # TIME_ZONE = Asia/Tashkent


def ym_now():
    return today()[:7]


def now_ms():
    return int(timezone.now().timestamp() * 1000)


def cfg(key, default=None):
    s = Setting.objects.filter(k=key).first()
    return s.v if s else default


def set_cfg(key, value):
    Setting.objects.update_or_create(k=key, defaults={"v": value})


def pub_student(s):
    return {"id": s.id, "name": s.name, "phone": s.phone, "level": s.level, "groupId": s.group_id, "username": s.username}


# ── vazifalar
def task_dict(t):
    return {"id": t.id, "title": t.title, "body": t.body, "questions": t.questions, "type": t.type, "kind": t.kind, "level": t.level,
            "groupId": t.group_id, "studentIds": t.student_ids, "due": t.due, "createdAt": t.created_at}


def all_tasks():
    hw = [{"id": w.id, "title": w.title, "body": "Vazifani bajarib, javobingizni yozing, audio yoki rasm yuboring.", "questions": [], "type": "writing",
           "kind": "daily", "level": w.level, "groupId": None, "studentIds": [], "due": "", "createdAt": today(), "fromList": True} for w in Homework.objects.all()]
    return [task_dict(t) for t in Task.objects.all()] + hw


def find_task(task_id):
    return next((t for t in all_tasks() if t["id"] == task_id), None)


def tasks_for(st):
    return [t for t in all_tasks() if (st.id in t["studentIds"] if t["studentIds"] else t["level"] == st.level and (not t["groupId"] or t["groupId"] == st.group_id))]


# ── obuna (7 kun sinov, keyin 9 900 so'm/oy)
def sub_info(st):
    secs = (st.sub_until - timezone.now()).total_seconds()
    return {"active": secs > 0, "days": math.ceil(secs / 86400), "until": int(st.sub_until.timestamp() * 1000)}


# ── xabarlar va Telegram (token faqat serverda)
def notify(to, text, page=""):
    Notification.objects.create(to_id=to, text=text, page=page, date=now_ms())


def tg_sync(kind, text):
    o = {"teacher": 1, "tasks": 1, **(cfg("tg_opts") or {})}
    c = cfg("bot_cfg") or {}
    if not o.get(kind) or not c.get("token") or not c.get("gid"):
        return False
    try:
        req = urllib.request.Request(f"https://api.telegram.org/bot{c['token']}/sendMessage", method="POST", headers={"Content-Type": "application/json"},
                                     data=json.dumps({"chat_id": c["gid"], "text": "MYSTRA: " + text}).encode())
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except Exception as e:  # noqa: BLE001
        log.warning("Telegram xato: %s", e)
        return False


def tg(kind, text):
    """Foydalanuvchini kutdirmaslik uchun fonda yuboradi."""
    threading.Thread(target=tg_sync, args=(kind, text), daemon=True).start()


# ── fayllar
OK_TYPES = {"audio/webm": "webm", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/ogg": "ogg", "audio/wav": "wav", "audio/x-m4a": "m4a", "image/png": "png",
            "image/jpeg": "jpg", "image/webp": "webp", "application/pdf": "pdf", "application/msword": "doc",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx"}


def save_data_url(data_url, max_bytes=3_000_000):
    import re
    m = re.match(r"^data:([\w/+.\-]+)(?:;[^,]*)?;base64,(.+)$", data_url or "", re.S)
    if not m:
        raise E(400, "Fayl formati noto'g'ri")
    mime = m.group(1)
    if mime not in OK_TYPES:
        raise E(415, "Bu fayl turi qabul qilinmaydi: " + mime)
    try:
        buf = base64.b64decode(m.group(2), validate=False)
    except Exception:  # noqa: BLE001
        raise E(400, "Fayl formati noto'g'ri")
    if len(buf) > max_bytes:
        raise E(413, "Fayl juda katta")
    from .models import StoredFile

    name = uuid.uuid4().hex[:16] + "." + OK_TYPES[mime]
    StoredFile.objects.create(name=name, mime=mime, data=buf)
    return {"name": name, "mime": mime, "buf": buf}


# ── AI (Gemini bo'lsa u, bo'lmasa namunaviy)
def _gemini(parts):
    from google import genai

    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )
    tools = [
        {
            'type': 'google_search',
        },
    ]
    generation_config = {
        'max_output_tokens': 65536,
        'thinking_level': 'medium',
    }

    input_text = ""
    for p in parts:
        if isinstance(p, dict):
            if "text" in p:
                input_text += p["text"] + "\n"
        elif isinstance(p, str):
            input_text += p + "\n"

    model = os.environ.get("GEMINI_MODEL", "models/gemini-3.8-flash")
    if not model.startswith("models/"):
        model = f"models/{model}"

    try:
        interaction = client.interactions.create(
            model=model,
            input=input_text.strip(),
            tools=tools,
            generation_config=generation_config,
        )
    except Exception as err:
        log.warning("Interactions with tools failed, retrying without tools: %s", err)
        interaction = client.interactions.create(
            model=model,
            input=input_text.strip(),
            generation_config=generation_config,
        )

    txt = ""
    if getattr(interaction, "output_text", None):
        txt = interaction.output_text
    elif getattr(interaction, "steps", None) and interaction.steps:
        last_step = interaction.steps[-1]
        if hasattr(last_step, "content"):
            for c in last_step.content:
                if hasattr(c, "text") and c.text:
                    txt += c.text

    txt = txt.strip()
    if "```json" in txt:
        txt = txt.split("```json", 1)[1].split("```", 1)[0]
    elif "```" in txt:
        txt = txt.split("```", 1)[1].split("```", 1)[0]
    return json.loads(txt.strip())


def ai_check(text, answers, audio, files, task):
    if task["type"] == "test" and task["questions"]:
        score, ok = scoring.test_score(task["questions"], answers)
        return {"score": score, "feedback": f"Avto-tekshiruv: {ok}/{len(task['questions'])} to'g'ri."}
    if os.environ.get("GEMINI_API_KEY"):
        try:
            parts = [{"text": f"Siz ingliz tili o'qituvchisisiz. Vazifa turi: {task['type']}. Vazifa: {task['title']}. {task['body']}\n"
                              "Talaba javobini 0-100 ball bilan baholang va qisqa o'zbekcha izoh yozing. FAQAT JSON: {\"score\":number,\"feedback\":string}"}]
            if text:
                parts.append({"text": "Talaba javobi:\n" + text})
            for f in ([audio] if audio else []) + files:
                if f["mime"].startswith(("audio/", "image/")) or f["mime"] == "application/pdf":
                    parts.append({"inlineData": {"mimeType": f["mime"], "data": base64.b64encode(f["buf"]).decode()}})
            o = _gemini(parts)
            return {"score": max(0, min(100, int(o["score"]))), "feedback": str(o.get("feedback", ""))[:600]}
        except Exception as e:  # noqa: BLE001
            log.warning("Gemini xato, namunaviy javob: %s", e)
    n = len(text or "") + (300 if audio else 0) + len(files) * 150
    return {"score": min(95, 45 + scoring.r(n / 8)), "feedback": "AI (namuna javob): Gemini ulanmagan, ustoz tekshiradi."}


def generate_task(prompt, type_="writing", count=10):
    if os.environ.get("GEMINI_API_KEY"):
        try:
            fmt = (f"{count} ta test: har biri \"Savol|A variant|B variant|C variant|D variant|to'g'ri harf (A/B/C/D)\" formatida."
                   if type_ == "test" else "Matn/topshiriq yozing.")
            o = _gemini([{"text": f"Ingliz tili vazifasi tuzing. Mavzu: {prompt}. Tur: {type_}. {fmt} FAQAT JSON: {{\"title\":string,\"body\":string,\"questions\":string[]}}"}])
            return {"title": str(o.get("title", prompt))[:80], "body": str(o.get("body", "")), "questions": [str(q) for q in o.get("questions", [])]}
        except Exception as e:  # noqa: BLE001
            log.warning("Gemini generate_task xato: %s", e)
    qs = [f"{prompt}: {i}-savol?|A variant|B variant|C variant|D variant|A" for i in range(1, min(50, count) + 1)] if type_ == "test" else []
    return {"title": str(prompt)[:60], "body": "" if type_ == "test" else "(AI yaratgan matn) " + prompt, "questions": qs}


# ── reyting, streak, davomat
def weights():
    return {**scoring.DEFAULT_WEIGHTS, **(cfg("rating_weights") or {})}


def calc_rating(st):
    ym = ym_now()
    d = timezone.localdate().replace(day=1) - timedelta(days=1)
    prev_ym = d.strftime("%Y-%m")
    recs = list(HwRecord.objects.filter(student=st))

    def pick(prefix, extra):
        return [{"avg": r.avg_score, "date": r.date, "late": r.late} for r in recs if r.date.startswith(prefix) and r.extra == extra]

    days = st.group.days if st.group_id and st.group.days else ""
    return scoring.rating(pick(ym, False), pick(ym, True), pick(prev_ym, False), weights(), (len(days.split(",")) if days else 3) * 4)


def streak_xp(st):
    recs = list(HwRecord.objects.filter(student=st).values_list("date", "avg_score", "extra"))
    xp, lvl = scoring.xp_level([(a, e) for _, a, e in recs])
    return {"streak": scoring.streak([r[0] for r in recs], today()), "xp": xp, "lvl": lvl}


def att_stats(st, ym=None):
    rows = list(Attendance.objects.filter(student=st, date__startswith=ym or ym_now()).values_list("v", flat=True))
    return {"p": rows.count("p"), "t": len(rows)}


# ── yozuv va sertifikat (95%+)
def add_record(st, date, items, avg, note, extra=False, late=False, manual=False, rid=None):
    rec = HwRecord(student=st, date=date, items=items, avg_score=avg, note=note, extra=extra, late=late, manual=manual)
    if rid:
        rec.id = rid
    rec.save()
    return rec.id


def give_cert(st, rid, avg, date):
    if not scoring.gets_certificate(avg) or Certificate.objects.filter(hw_record_id=rid).exists():
        return False
    Certificate.objects.create(student=st, hw_record_id=rid, avg_score=avg, date=date, quote=random.choice(CERT["CQ"]), msg=random.choice(CERT["CM"]),
                               style=random.choice(CERT["CS"]))
    return True


def suggested(sub, task):
    return scoring.adjusted_score(sub.ai_score or 0, (task or {}).get("due", ""), sub.date, cfg("late_pen", 5))


@transaction.atomic
def approve_day(ds_id, scores):
    ds = DaySubmit.objects.select_related("student").filter(id=ds_id, status="sent").first()
    if not ds:
        raise E(404, "Kutayotgan kun topilmadi")
    st, items, finals = ds.student, [], []
    for s in Submission.objects.filter(student=st, day=ds.day, kind="daily"):
        t = find_task(s.task_id)
        fin = max(0, min(100, int(scores.get(s.id, suggested(s, t)) or 0)))
        s.status, s.final = "approved", fin
        s.save()
        finals.append(fin)
        items.append({"hwId": s.task_id, "title": (t or {}).get("title", "Vazifa"), "ticked": True, "crossed": False, "pct": fin})
    avg = scoring.day_average(finals, ds.total)
    date = ds.day + "T" + timezone.localtime().strftime("%H:%M:%S")
    ds.status, ds.final = "approved", avg
    ds.save()
    rid = add_record(st, date, items, avg, "Kunlik vazifalar (online)")
    cert = give_cert(st, rid, avg, date)
    notify(st.id, f"{ds.day} kunlik vazifalari tasdiqlandi: {avg}%" + (" 🏆 Sertifikat berildi!" if cert else ""), "/certs" if cert else "/tasks")
    return {"avg": avg, "cert": cert}


@transaction.atomic
def approve_extra(sub_id, final):
    s = Submission.objects.select_related("student").filter(id=sub_id, status="ai").first()
    if not s:
        raise E(404, "Topilmadi")
    t = find_task(s.task_id)
    f = max(0, min(100, int(suggested(s, t) if final is None else final)))
    s.status, s.final = "approved", f
    s.save()
    late = bool(t and t["due"] and s.date > t["due"])
    rid = add_record(s.student, s.date + "T12:00:00", [{"hwId": s.task_id, "title": (t or {}).get("title"), "ticked": True, "crossed": False, "pct": f}], f,
                     (t or {}).get("title", "Extra work"), extra=True, late=late)
    cert = give_cert(s.student, rid, f, s.date)
    notify(s.student_id, f"\"{(t or {}).get('title')}\" tasdiqlandi: {f}%" + (" 🏆 Sertifikat berildi!" if cert else ""), "/certs" if cert else "/tasks")
    return {"avg": f, "cert": cert}


@transaction.atomic
def manual_record(st, date, items, note):
    ticked = [i for i in items if i.get("ticked") and not i.get("crossed")]
    avg = scoring.r(sum(max(0, min(100, float(i.get("pct") or 0))) for i in ticked) / len(ticked)) if ticked else 0
    old = HwRecord.objects.filter(student=st, date__startswith=date, manual=True).first()
    rid = add_record(st, date + "T12:00:00", items, avg, note or "Dars (qo'lda)", manual=True, rid=old.id if old else None)
    cert = give_cert(st, rid, avg, date + "T12:00:00")
    notify(st.id, f"{date} darsi natijasi: {avg}%" + (" 🏆 Sertifikat berildi!" if cert else ""), "/certs" if cert else "/results")
    return {"avg": avg, "cert": cert}


# ── AI takliflari: o'rtacha foizi 60% dan past (haftada bir marta)
def suggestions():
    log_ = {s.student_id: s.ts for s in SugLog.objects.all()}
    out = []
    for g in Group.objects.all():
        low = []
        for st in Student.objects.filter(group=g):
            r = calc_rating(st)
            if 0 < r["avg"] < 60 and now_ms() - log_.get(st.id, 0) > 7 * 864e5:
                low.append((st, r))
        if low:
            out.append({"group": g, "low": low})
    return out


def create_task(t):
    obj = Task.objects.create(title=t["title"], body=t.get("body", ""), questions=t.get("questions", []), type=t.get("type", "writing"),
                              kind="daily" if t.get("kind") == "daily" else "extra", level=t["level"], group_id=t.get("groupId") or None,
                              student_ids=t.get("studentIds") or [], due=t.get("due", ""), created_at=today())
    if obj.student_ids:
        rec = list(obj.student_ids)
    else:
        q = Student.objects.filter(level=obj.level)
        rec = list((q.filter(group_id=obj.group_id) if obj.group_id else q).values_list("id", flat=True))
    for i in rec:
        notify(i, "Yangi " + ("kunlik vazifa" if obj.kind == "daily" else "extra work") + ": " + obj.title, "/tasks")
    return {"id": obj.id, "recipients": len(rec)}
