from django.contrib import admin
from .models import UserProfile, OTP

# Register your models here.
admin.site.register(UserProfile)
admin.site.register(OTP)
