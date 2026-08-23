from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('otp_login', '0003_digilockerdocument'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='full_name',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='age',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='blood_group',
            field=models.CharField(blank=True, default='', max_length=5),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='abha_id',
            field=models.CharField(blank=True, default='', max_length=32),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='details',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='details_source',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
    ]
