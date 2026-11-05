from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_storedfile"),
    ]

    operations = [
        migrations.AddField(
            model_name="submission",
            name="ai_details",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
