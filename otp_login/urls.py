# otp_login/urls.py
from django.urls import path
from .views import SendOTPAPI, VerifyOTPAPI, MedicineFinderAPI
from . import views, mock_digilocker

urlpatterns = [
    # Your API endpoints that match the JavaScript fetch calls
    path('api/send-otp/', SendOTPAPI.as_view(), name='api_send_otp'),
    path('api/verify-otp/', VerifyOTPAPI.as_view(), name='api_verify_otp'),
    path('api/csrf/', views.CSRFTokenAPI.as_view(), name='api_csrf'),
    path('api/auth/refresh/', views.RefreshTokenAPI.as_view(), name='api_auth_refresh'),
    path('api/auth/logout/', views.LogoutAPI.as_view(), name='api_auth_logout'),
    path('api/onboarding/upload-abha/', views.UploadABHAAPI.as_view(), name='upload_abha'),
    path('api/onboarding/link-digilocker/', views.LinkDigiLockerAPI.as_view(), name='link_digilocker'),
    path('api/onboarding/profile/', views.ProfileAPI.as_view(), name='profile_onboarding'),
    path('', views.arogya_frontend, name='frontend'),
    path('api/agent/symptoms/', views.SymptomCheckerAPI.as_view(), name='agent_symptoms'),
    path('api/agent/summary/', views.AISummaryAPI.as_view(), name='agent_summary'),
    
    path('mock-api/public/oauth2/1/authorize', mock_digilocker.MockAuthorizeAPI.as_view()),
    path('mock-api/public/oauth2/1/token', mock_digilocker.MockTokenAPI.as_view()),
    path('mock-api/public/oauth2/1/files/issued', mock_digilocker.MockIssuedFilesAPI.as_view()),
    path('mock-api/public/oauth2/1/files/upload', mock_digilocker.MockUploadDocAPI.as_view()),

    # YOUR AROGYA BACKEND ENDPOINTS
    path('api/digilocker/callback/', views.ArogyaDigiLockerCallback.as_view()),
    path('api/digilocker/authorize/', views.DigiLockerAuthorizeAPI.as_view()),
    path('api/vault/sync-digilocker/', views.VaultDigiLockerSyncAPI.as_view()),

    path('api/agent/medicine/', MedicineFinderAPI.as_view(), name='medicine_finder'),
    path('api/prescriptions/upload/', views.PrescriptionUploadAPI.as_view(), name='prescription_upload'),
    path('api/prescriptions/pending/', views.PrescriptionPendingAPI.as_view(), name='prescription_pending'),
    path('api/prescriptions/<int:pk>/', views.PrescriptionDetailAPI.as_view(), name='prescription_detail'),
    path('api/prescriptions/<int:pk>/edit/', views.PrescriptionEditAPI.as_view(), name='prescription_edit'),
    path('api/prescriptions/<int:pk>/approve/', views.PrescriptionApproveAPI.as_view(), name='prescription_approve'),
    path('api/intake/<int:draft_id>/start/', views.ClinicalIntakeStartAPI.as_view(), name='intake_start'),
    path('api/intake/<int:draft_id>/preferences/', views.ClinicalIntakePreferencesAPI.as_view(), name='intake_preferences'),
    path('api/intake/<int:draft_id>/answer/', views.ClinicalIntakeAnswerAPI.as_view(), name='intake_answer'),
    path('api/intake/<int:draft_id>/summary/', views.ClinicalIntakeSummaryAPI.as_view(), name='intake_summary'),
    path('api/intake/<int:draft_id>/send-to-hip/', views.ClinicalIntakeSendToHIPAPI.as_view(), name='intake_send_hip'),
]