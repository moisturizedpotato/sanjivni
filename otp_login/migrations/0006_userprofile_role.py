from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('otp_login', '0005_userprofile_health_summary'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[
                    ('PATIENT', 'Patient'),
                    ('ASSISTANT', 'Assistant'),
                    ('CLINICIAN', 'Clinician'),
                    ('ADMIN', 'Admin'),
                ],
                default='PATIENT',
                max_length=10,
            ),
        ),
    ]