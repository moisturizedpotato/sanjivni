from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('otp_login', '0007_security_models'),
    ]

    operations = [
        migrations.AlterField(
            model_name='otp',
            name='expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
