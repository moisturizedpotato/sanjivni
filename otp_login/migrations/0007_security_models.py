from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('otp_login', '0006_userprofile_role'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RenameField(
            model_name='otp', old_name='otp_code', new_name='otp_hash',
        ),
        migrations.AddField(
            model_name='otp', name='expires_at',
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name='otp', name='failed_attempts',
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='otp', name='locked_until',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='otp', name='send_count',
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='otp', name='last_sent_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='otp', name='last_request_ip',
            field=models.GenericIPAddressField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='otp', name='otp_hash',
            field=models.CharField(max_length=128),
        ),
        migrations.CreateModel(
            name='ClinicalPatientAssignment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('assistant', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assistant_assignments', to='otp_login.userprofile')),
                ('clinician', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assigned_patients', to='otp_login.userprofile')),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='clinical_assignments', to='otp_login.userprofile')),
            ],
            options={'constraints': [models.UniqueConstraint(fields=('patient', 'clinician', 'assistant'), name='unique_active_clinical_assignment')]},
        ),
        migrations.CreateModel(
            name='OAuthState',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('state_hash', models.CharField(max_length=64, unique=True)),
                ('session_key', models.CharField(blank=True, default='', max_length=40)),
                ('redirect_uri', models.URLField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('used_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]