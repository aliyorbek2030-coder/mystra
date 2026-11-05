from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_homework_group"),
    ]

    operations = [
        migrations.CreateModel(
            name="StoredFile",
            fields=[
                ("name", models.CharField(max_length=64, primary_key=True, serialize=False)),
                ("mime", models.CharField(max_length=100)),
                ("data", models.BinaryField()),
                ("created", models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
