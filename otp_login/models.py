# otp_login/models.py
from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    PATIENT = 'PATIENT'
    ASSISTANT = 'ASSISTANT'
    CLINICIAN = 'CLINICIAN'
    ADMIN = 'ADMIN'
    ROLE_CHOICES = (
        (PATIENT, 'Patient'),
        (ASSISTANT, 'Assistant'),
        (CLINICIAN, 'Clinician'),
        (ADMIN, 'Admin'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15, unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=PATIENT)
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
    otp_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    send_count = models.PositiveSmallIntegerField(default=0)
    last_sent_at = models.DateTimeField(null=True, blank=True)
    last_request_ip = models.GenericIPAddressField(null=True, blank=True)

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


class ClinicalPatientAssignment(models.Model):
    patient = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='clinical_assignments')
    clinician = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='assigned_patients')
    assistant = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assistant_assignments',
    )
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['patient', 'clinician', 'assistant'],
                name='unique_active_clinical_assignment',
            ),
        ]


class OAuthState(models.Model):
    state_hash = models.CharField(max_length=64, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=40, blank=True, default='')
    redirect_uri = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)


class PrescriptionDraft(models.Model):
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    STATUS_CHOICES = (
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
    )

    patient_phone = models.CharField(max_length=15)
    uploaded_image = models.ImageField(upload_to='prescriptions/%Y/%m/%d/')
    raw_gemini_response = models.TextField(blank=True, default='')
    extracted_data = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    reviewed_by = models.CharField(max_length=150, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class PrescriptionMedicine(models.Model):
    draft = models.ForeignKey(PrescriptionDraft, on_delete=models.CASCADE, related_name='medicines')
    medicine_name = models.CharField(max_length=200, blank=True, default='')
    dosage = models.CharField(max_length=100, blank=True, default='')
    frequency = models.CharField(max_length=100, blank=True, default='')
    duration = models.CharField(max_length=100, blank=True, default='')
    instructions = models.TextField(blank=True, default='')


class ClinicalIntakeSession(models.Model):
    draft = models.OneToOneField(PrescriptionDraft, on_delete=models.CASCADE)
    patient_phone = models.CharField(max_length=15)
    symptoms = models.TextField(blank=True)
    duration = models.CharField(max_length=150, blank=True)
    severity = models.CharField(max_length=100, blank=True)
    doctor_suggestion = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    additional_notes = models.TextField(blank=True)
    unanswered_questions = models.JSONField(default=list, blank=True)
    merged_record = models.JSONField(default=dict, blank=True)
    patient_summary = models.TextField(blank=True)
    hip_status = models.CharField(
        max_length=30,
        default='NOT_SENT',
        choices=(('NOT_SENT', 'Not sent'), ('SENT', 'Sent to HIP')),
    )
    hip_reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)