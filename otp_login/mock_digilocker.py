# otp_login/mock_digilocker.py
from django.http import HttpResponseRedirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.conf import settings
from .models import DigiLockerDocument
from .permissions import IsClinician, IsOwnerOrClinicalStaff, can_access_patient_record
from .authentication import CookieJWTAuthentication
import time
import uuid
from datetime import datetime

# In-memory mock DigiLocker cloud storage
DIGILOCKER_STORAGE = [
    {
        "uri": "in.gov.cowin-VACIC-1234",
        "name": "COVID-19 Vaccination Certificate",
        "type": "Vaccination",
        "issuer": "Ministry of Health & Family Welfare",
        "date": "15-Jan-2022",
        "note": "2 Doses Completed. Authenticated by MoHFW."
    },
    {
        "uri": "in.gov.nha-ABHA-5678",
        "name": "Ayushman Bharat Health Account",
        "type": "Government ID",
        "issuer": "National Health Authority",
        "date": "20-Aug-2026",
        "phone_number": "+919876543210",
        "note": "Verified via DigiLocker.\nName: Avneesh Pathak\nAge: 19\nBlood Group: B+\nABHA ID: 12-3456-7890-1234"
    }
]

# Simulates: /public/oauth2/1/authorize
class MockAuthorizeAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request):
        if not settings.ENABLE_MOCK_DIGILOCKER:
            return Response({'error': 'Not available'}, status=404)
        redirect_uri = request.GET.get('redirect_uri')
        state = request.GET.get('state', '')
        if redirect_uri != settings.DIGILOCKER_REDIRECT_URI:
            return Response({'error': 'Invalid redirect URI'}, status=400)
        time.sleep(1.0)
        auth_code = f"auth_code_{uuid.uuid4().hex[:8]}"
        return HttpResponseRedirect(f"{redirect_uri}?code={auth_code}&state={state}")

# Simulates: /public/oauth2/1/token
class MockTokenAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        if not settings.ENABLE_MOCK_DIGILOCKER:
            return Response({'error': 'Not available'}, status=404)
        time.sleep(0.5)
        return Response({
            "access_token": f"token_{uuid.uuid4().hex}",
            "expires_in": 3600,
            "token_type": "Bearer",
            "refresh_token": f"refresh_{uuid.uuid4().hex}"
        })

# Simulates: /public/oauth2/1/files/issued (GET)
class MockIssuedFilesAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsOwnerOrClinicalStaff]
    
    def get(self, request):
        if not settings.ENABLE_MOCK_DIGILOCKER:
            return Response({'error': 'Not available'}, status=404)
        profile = request.user.userprofile
        docs = DigiLockerDocument.objects.filter(
            user_identifier=profile.phone_number
        ).order_by('-created_at')
        
        items = []
        for doc in docs:
            items.append({
                "uri": doc.uri,
                "name": doc.title,
                "type": doc.doc_type,
                "issuer": doc.issuer,
                "date": doc.date,
                "note": doc.note
            })
            
        return Response({"items": items})

class MockUploadDocAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsClinician]
    
    def post(self, request):
        if not settings.ENABLE_MOCK_DIGILOCKER:
            return Response({'error': 'Not available'}, status=404)
        title = request.data.get('title')
        doc_type = request.data.get('type', 'Medical Record')
        
        if not title:
            return Response({"error": "Document title is required"}, status=400)
            
        profile_id = request.data.get('profile_id') or request.data.get('patient_id')
        if not profile_id:
            return Response({'error': 'Target patient profile is required'}, status=400)
        from .models import UserProfile
        try:
            profile = UserProfile.objects.get(pk=profile_id)
        except (UserProfile.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'Target patient profile not found'}, status=404)
        if not can_access_patient_record(request.user, profile):
            return Response({'error': 'Target patient profile not found'}, status=404)

        new_doc = DigiLockerDocument.objects.create(
            user_identifier=profile.phone_number,
            uri=f"in.gov.health-{uuid.uuid4().hex[:6]}",
            title=title,
            doc_type=doc_type,
            issuer="Self Uploaded via Vault",
            date=datetime.now().strftime("%d-%b-%Y"),
            note="Encrypted and stored in external database."
        )
        
        return Response({"message": "Successfully saved to secure database!"}, status=201)