from django.contrib import admin

from . import models

for m in (models.Group, models.Account, models.Student, models.Signup, models.Homework, models.Task, models.Submission,
          models.DaySubmit, models.HwRecord, models.Certificate, models.Payment, models.Attendance, models.Notification, models.Setting):
    admin.site.register(m)
