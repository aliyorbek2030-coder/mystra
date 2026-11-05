import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_submission_ai_details"),
    ]

    operations = [
        migrations.AddField(
            model_name="student",
            name="parent_token",
            field=models.CharField(blank=True, db_index=True, default="", max_length=40),
        ),
        migrations.CreateModel(
            name="ParentChat",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("chat_id", models.CharField(max_length=40)),
                ("name", models.CharField(blank=True, default="", max_length=120)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="parent_chats", to="core.student")),
            ],
            options={"unique_together": {("student", "chat_id")}},
        ),
    ]
