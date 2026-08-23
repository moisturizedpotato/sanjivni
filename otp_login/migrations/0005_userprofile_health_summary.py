from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('otp_login', '0004_userprofile_abha_details'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='health_summary',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='health_summary_source_hash',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='health_summary_updated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]