from django.contrib import admin
from .models import (
	ClinicalPatientAssignment, DigiLockerDocument, OAuthState, OTP,
	PrescriptionDraft, PrescriptionMedicine, UserProfile,
	ClinicalIntakeSession,
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
	list_display = ('user', 'phone_number', 'role', 'full_name')
	list_filter = ('role',)
	search_fields = ('user__username', 'phone_number', 'full_name', 'role')


admin.site.register(OTP)
admin.site.register(DigiLockerDocument)
admin.site.register(ClinicalPatientAssignment)
admin.site.register(OAuthState)
admin.site.register(PrescriptionDraft)
admin.site.register(PrescriptionMedicine)
admin.site.register(ClinicalIntakeSession)
