"""Sof hisob-kitob funksiyalari (Django'siz sinash mumkin): reyting, jarima, streak, test bahosi."""
import math
from datetime import date, timedelta

DEFAULT_WEIGHTS = {"q": 50, "r": 25, "g": 15, "t": 10, "xMax": 10}


def r(x):
    """JavaScript Math.round bilan bir xil yaxlitlash (Python round() juftga yaxlitlaydi: 94.5 -> 94)."""
    return int(math.floor(x + 0.5))


def avg(values):
    values = list(values)
    return sum(values) / len(values) if values else 0


def adjusted_score(score, due, submitted, penalty_per_day=5):
    """Muddatdan kech topshirilsa har kun uchun penalty% (ko'pi bilan 50%) ayriladi."""
    late = 0
    if due and submitted > due:
        late = (date.fromisoformat(submitted) - date.fromisoformat(due)).days
    return max(0, r(score * (1 - min(50, late * penalty_per_day) / 100)))


def test_score(questions, answers):
    """questions: 'Savol|A|B|C|D|to'g'ri harf' qatorlari. -> (ball, to'g'ri soni)"""
    ok = sum(1 for i, q in enumerate(questions) if i < len(answers) and answers[i] == q.split("|")[5])
    return r(ok / len(questions) * 100), ok


def rating(cur, extra, prev, weights, expected_days):
    """Adolatli oylik reyting. cur/extra/prev: {'avg': int, 'date': 'YYYY-MM-DD..', 'late': bool} ro'yxatlari."""
    w = {**DEFAULT_WEIGHTS, **(weights or {})}
    if not cur and not extra:
        return {"score": 0, "days": 0, "avg": 0}
    a = avg(r["avg"] for r in cur)
    days = len({r["date"][:10] for r in cur})
    reg = min(1, days / max(1, expected_days))
    growth = max(0, min(1, (a - avg(r["avg"] for r in prev) + 20) / 40)) if prev else 0.5
    on_time = (sum(1 for r in cur if not r.get("late")) / len(cur)) if cur else 0
    score = r(a / 100 * w["q"] + reg * w["r"] + growth * w["g"] + on_time * w["t"] + min(w["xMax"], len(extra) * 2))
    return {"score": score, "days": days, "avg": r(a)}


def streak(day_strings, today):
    """Bugundan (yoki kechadan) orqaga ketma-ket yozuvli kunlar soni."""
    days = {d[:10] for d in day_strings}
    t = date.fromisoformat(today)
    if t.isoformat() not in days:
        t -= timedelta(days=1)
    n = 0
    while t.isoformat() in days:
        n += 1
        t -= timedelta(days=1)
    return n


def xp_level(records):
    """records: [(avg_score, is_extra)] -> (xp, daraja)"""
    xp = sum(r((s or 0) / 10) + (5 if extra else 0) for s, extra in records)
    return xp, int(math.sqrt(xp / 10)) + 1


def net_price(price, discount):
    return r(price * (1 - (discount or 0) / 100))


def payment_status(paid, price, discount):
    net = net_price(price, discount)
    return "paid" if net > 0 and paid >= net else ("partial" if paid > 0 else "unpaid")


def day_average(final_scores, total):
    """Kunlik umumiy foiz: topshirilmagan vazifalar 0 hisoblanadi (jami vazifalar soniga bo'linadi)."""
    return r(sum(final_scores) / max(1, total))


def gets_certificate(avg_score):
    return avg_score >= 95
