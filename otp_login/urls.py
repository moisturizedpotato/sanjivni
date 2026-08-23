# otp_login/urls.py
from django.urls import path
from .views import SendOTPAPI, VerifyOTPAPI, MedicineFinderAPI
from . import views, mock_digilocker

urlpatterns = [
    # Your API endpoints that match the JavaScript fetch calls
    path('api/send-otp/', SendOTPAPI.as_view(), name='api_send_otp'),
    path('api/verify-otp/', VerifyOTPAPI.as_view(), name='api_verify_otp'),
    path('api/onboarding/upload-abha/', views.UploadABHAAPI.as_view(), name='upload_abha'),
    path('api/onboarding/link-digilocker/', views.LinkDigiLockerAPI.as_view(), name='link_digilocker'),
    path('', views.arogya_frontend, name='frontend'),
    path('api/agent/symptoms/', views.SymptomCheckerAPI.as_view(), name='agent_symptoms'),
    path('api/agent/summary/', views.AISummaryAPI.as_view(), name='agent_summary'),
    
    path('mock-api/public/oauth2/1/authorize', mock_digilocker.MockAuthorizeAPI.as_view()),
    path('mock-api/public/oauth2/1/token', mock_digilocker.MockTokenAPI.as_view()),
    path('mock-api/public/oauth2/1/files/issued', mock_digilocker.MockIssuedFilesAPI.as_view()),
    path('mock-api/public/oauth2/1/files/upload', mock_digilocker.MockUploadDocAPI.as_view()),

    # YOUR AROGYA BACKEND ENDPOINTS
    path('api/digilocker/callback/', views.ArogyaDigiLockerCallback.as_view()),
    path('api/vault/sync-digilocker/', views.VaultDigiLockerSyncAPI.as_view()),

    path('api/agent/medicine/', MedicineFinderAPI.as_view(), name='medicine_finder'),
]