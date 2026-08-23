# otp_login/models.py
from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15, unique=True)
    full_name = models.CharField(max_length=150, blank=True, default='')
    age = models.PositiveIntegerField(null=True, blank=True)
    blood_group = models.CharField(max_length=5, blank=True, default='')
    abha_id = models.CharField(max_length=32, blank=True, default='')
    details = models.JSONField(default=dict, blank=True)
    details_source = models.CharField(max_length=20, blank=True, default='')
    health_summary = models.TextField(blank=True, default='')
    health_summary_source_hash = models.CharField(max_length=64, blank=True, default='')
    health_summary_updated_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.phone_number}"

class OTP(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now=True)

class DigiLockerDocument(models.Model):
    # This table acts as the isolated DigiLocker cloud database
    user_identifier = models.CharField(max_length=255, default="arogya_user_1") 
    uri = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=200)
    doc_type = models.CharField(max_length=100)
    issuer = models.CharField(max_length=200)
    date = models.CharField(max_length=50)
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.doc_type}"