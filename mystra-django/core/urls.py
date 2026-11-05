from django.urls import path

from . import views as v

urlpatterns = [
    path("api/health", v.health),
    # auth
    path("api/auth/login", v.login), path("api/auth/signup", v.signup), path("api/auth/change-password", v.change_password),
    path("api/groups/public", v.groups_public), path("api/me", v.me),
    # ustoz
    path("api/groups", v.groups), path("api/groups/<str:id>", v.group_detail),
    path("api/students", v.students), path("api/students/<str:id>", v.student_detail),
    path("api/homeworks", v.homeworks), path("api/homeworks/<str:id>", v.homework_delete),
    path("api/signups", v.signups_list), path("api/signups/<str:id>/approve", v.signup_approve), path("api/signups/<str:id>/reject", v.signup_reject),
    # admin
    path("api/teachers", v.teachers), path("api/teachers/<str:id>", v.teacher_detail), path("api/admin/stats", v.admin_stats),
    # o'quvchi
    path("api/my/tasks", v.my_tasks), path("api/tasks/<str:id>/submit", v.task_submit), path("api/days/<str:day>/finish", v.day_finish),
    path("api/my/certificates", v.my_certificates), path("api/my/payments", v.my_payments), path("api/my/archive", v.my_archive),
    # xabarlar
    path("api/notifications", v.notifications), path("api/notifications/<str:id>/read", v.notification_read),
    # tekshirish
    path("api/review", v.review), path("api/review/days/<str:id>/approve", v.day_approve), path("api/review/days/<str:id>/return", v.day_return),
    path("api/review/submissions/<str:id>/approve", v.submission_approve), path("api/review/submissions/<str:id>/return", v.submission_return),
    path("api/manual-records", v.manual_records),
    path("api/hwcheck/submissions", v.hwcheck_submissions),
    # AI
    path("api/ai/generate-task", v.ai_generate), path("api/tasks", v.tasks_create),
    path("api/suggestions", v.suggestions), path("api/suggestions/send", v.suggestions_send), path("api/suggestions/skip", v.suggestions_skip),
    # to'lov, obuna, davomat, sozlamalar, hisobot
    path("api/payments", v.payments_list), path("api/payments/<str:sid>/<str:ym>", v.payment_set),
    path("api/subscriptions/<str:sid>/extend", v.sub_extend), path("api/subscriptions/<str:sid>", v.sub_set),
    path("api/attendance", v.attendance), path("api/settings", v.settings_view), path("api/rating", v.rating),
    path("api/reports/month", v.reports_month), path("api/certificates", v.certificates), path("api/telegram/send", v.telegram_send),
    # ota-onalar
    path("api/parent/<str:token>", v.parent_view), path("api/parent-links", v.parent_links), path("api/students/<str:id>/parent-link", v.parent_link),
    path("api/telegram/connect", v.telegram_connect), path("api/telegram/webhook/<str:secret>", v.telegram_webhook),
    path("uploads/<str:name>", v.upload),
]
