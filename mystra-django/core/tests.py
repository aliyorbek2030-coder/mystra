"""Ishga tushirish:  AUTH_SECRET=xxxxxxxxxxxxxxxxxxxx python manage.py test
Node versiyadagi 47 ta tekshiruvning asosiy qismini takrorlaydi."""
import base64

from django.test import TestCase
from rest_framework.test import APIClient

from . import scoring
from .auth import make_password
from .models import Account


class ScoringTests(TestCase):
    def test_rules(self):
        self.assertEqual(scoring.adjusted_score(80, "2020-01-01", "2020-01-05", 5), 64)
        self.assertEqual(scoring.day_average([94, 95], 2), 95)  # JS Math.round bilan bir xil
        self.assertTrue(scoring.gets_certificate(95) and not scoring.gets_certificate(94))
        self.assertEqual(scoring.net_price(400000, 25), 300000)


class ApiFlow(TestCase):
    def setUp(self):
        Account.objects.create(role="admin", name="A", username="admin", password=make_password("adminpass"))
        Account.objects.create(role="teacher", name="T", username="muslima", password=make_password("teachpass"))
        self.c = APIClient()

    def call(self, method, path, tok=None, data=None):
        kw = {"HTTP_AUTHORIZATION": "Bearer " + tok} if tok else {}
        if method == "get":
            return self.c.get(path, **kw)
        return getattr(self.c, method)(path, data or {}, format="json", **kw)

    def login(self, u, p):
        r = self.call("post", "/api/auth/login", data={"username": u, "password": p})
        return r.json().get("token"), r

    def test_full_flow(self):
        T, _ = self.login("muslima", "teachpass")
        A, _ = self.login("admin", "adminpass")
        self.assertEqual(self.login("muslima", "bad")[1].status_code, 401)
        self.assertEqual(self.call("get", "/api/students").status_code, 401)
        g = self.call("post", "/api/groups", T, {"name": "Beg A", "level": "Beginner", "days": "Mon,Wed"}).json()["id"]
        h1 = self.call("post", "/api/homeworks", T, {"title": "Unit 5", "level": "Beginner"}).json()["id"]
        h2 = self.call("post", "/api/homeworks", T, {"title": "Words", "level": "Beginner"}).json()["id"]
        # ro'yxatdan o'tish
        self.assertEqual(self.call("post", "/api/auth/signup", data={"name": "Ali V", "phone": "998901234567", "username": "ali", "password": "1234", "groupId": g}).status_code, 200)
        self.assertEqual(self.call("post", "/api/auth/signup", data={"name": "X", "phone": "998901234567", "username": "ali", "password": "1234", "groupId": g}).status_code, 409)
        self.assertEqual(self.login("ali", "1234")[1].status_code, 403)
        sg = self.call("get", "/api/signups", T).json()
        self.assertNotIn("password", sg[0])
        self.call("post", f"/api/signups/{sg[0]['id']}/approve", T)
        S, _ = self.login("ali", "1234")
        self.assertTrue(S)
        self.assertEqual(self.call("get", "/api/students", S).status_code, 403)
        sid = self.call("get", "/api/students", T).json()[0]["id"]
        # kunlik vazifalar
        my = self.call("get", "/api/my/tasks", S).json()
        self.assertEqual(len(my["tasks"]), 2)
        self.assertTrue(my["sub"]["active"])
        day = my["tasks"][0]["createdAt"]
        self.assertEqual(self.call("post", f"/api/tasks/{h1}/submit", S, {"text": "first"}).status_code, 200)
        self.assertEqual(self.call("post", f"/api/tasks/{h1}/submit", S, {"text": "second answer here"}).json()["attempt"], 2)
        audio = "data:audio/webm;base64," + base64.b64encode(b"fake-audio").decode()
        self.assertEqual(self.call("post", f"/api/tasks/{h2}/submit", S, {"text": "words", "audio": audio}).status_code, 200)
        self.assertEqual(self.call("post", f"/api/tasks/{h1}/submit", S, {"audio": "data:text/html;base64,PGI+"}).status_code, 415)
        self.assertEqual(self.call("post", f"/api/days/{day}/finish", S).json()["total"], 2)
        self.assertEqual(self.call("post", f"/api/tasks/{h1}/submit", S, {"text": "late"}).status_code, 409)
        # tekshirish -> sertifikat
        rv = self.call("get", "/api/review", T).json()
        self.assertEqual(len(rv["days"]), 1)
        scores = {it["id"]: (100 if i == 0 else 96) for i, it in enumerate(rv["days"][0]["items"])}
        ap = self.call("post", f"/api/review/days/{rv['days'][0]['id']}/approve", T, {"scores": scores}).json()
        self.assertEqual((ap["avg"], ap["cert"]), (98, True))
        self.assertEqual(len(self.call("get", "/api/my/certificates", S).json()), 1)
        # extra < 95 -> sertifikat yo'q
        ex = self.call("post", "/api/tasks", T, {"title": "Bonus", "type": "test", "kind": "extra", "level": "Beginner", "questions": ["Q1?|a|b|c|d|A", "Q2?|a|b|c|d|B"]}).json()
        self.assertEqual(self.call("post", f"/api/tasks/{ex['id']}/submit", S, {"answers": ["A", "B"]}).status_code, 200)
        rv = self.call("get", "/api/review", T).json()
        self.assertEqual(rv["extra"][0]["ai"]["score"], 100)
        ea = self.call("post", f"/api/review/submissions/{rv['extra'][0]['id']}/approve", T, {"final": 90}).json()
        self.assertEqual((ea["avg"], ea["cert"]), (90, False))
        # obuna tugashi -> 402
        self.assertEqual(self.call("put", f"/api/subscriptions/{sid}", A, {"until": 1}).status_code, 200)
        ex2 = self.call("post", "/api/tasks", T, {"title": "T2", "type": "writing", "kind": "extra", "level": "Beginner"}).json()
        self.assertEqual(self.call("post", f"/api/tasks/{ex2['id']}/submit", S, {"text": "abc"}).status_code, 402)
        self.assertTrue(self.call("post", f"/api/subscriptions/{sid}/extend", T).json()["active"])
        self.assertEqual(self.call("post", f"/api/tasks/{ex2['id']}/submit", S, {"text": "abc"}).status_code, 200)
        # to'lov
        self.call("put", "/api/settings", T, {"pay_settings": {"levelPrices": {"Beginner": 400000}}})
        self.assertEqual(self.call("put", "/api/settings", T, {"rating_weights": {"q": 50, "r": 30, "g": 15, "t": 10, "xMax": 10}}).status_code, 400)
        self.call("put", f"/api/payments/{sid}/2026-10", T, {"paid": 300000, "discount": 25, "method": "Click"})
        pay = self.call("get", "/api/payments?ym=2026-10", T).json()[0]
        self.assertEqual((pay["netPrice"], pay["status"]), (300000, "paid"))
        # parol, admin, brute-force
        self.assertEqual(self.call("post", "/api/auth/change-password", S, {"oldPassword": "bad", "newPassword": "newpass1"}).status_code, 400)
        self.assertEqual(self.call("post", "/api/auth/change-password", S, {"oldPassword": "1234", "newPassword": "newpass1"}).status_code, 200)
        self.assertEqual(self.login("ali", "newpass1")[1].status_code, 200)
        self.assertEqual(self.call("post", "/api/teachers", T, {"name": "X", "username": "x", "password": "1234"}).status_code, 403)
        self.assertEqual(self.call("post", "/api/teachers", A, {"name": "Karim", "username": "karim", "password": "1234"}).status_code, 200)
        last = None
        for i in range(6):
            last = self.login("brute", f"x{i}")[1]
        self.assertEqual(last.status_code, 429)
