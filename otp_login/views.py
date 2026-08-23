# otp_login/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import UserProfile, OTP, DigiLockerDocument
from rest_framework.permissions import AllowAny
from django.http import HttpResponseRedirect
from django.shortcuts import render
from .utils import generate_and_send_sms_otp # Your Twilio utility function
from .agent import format_agent_response, generate_health_summary
import traceback
import requests
import os
import asyncio
import json
import re
import uuid
import hashlib
from datetime import datetime
from django.utils import timezone
from fastmcp import Client
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken



def _profile_payload(profile):
    return {
        'name': profile.full_name,
        'age': profile.age,
        'blood_group': profile.blood_group,
        'abha_id': profile.abha_id,
        **(profile.details or {}),
        'source': profile.details_source,
    }


def _save_profile_details(profile, details, source):
    profile.full_name = str(details.get('name') or details.get('full_name') or '').strip()
    age = details.get('age')
    profile.age = int(age) if str(age).isdigit() else None
    profile.blood_group = str(details.get('blood_group') or details.get('blood') or '').strip()
    profile.abha_id = str(details.get('abha_id') or details.get('abha') or '').strip()
    profile.details = details
    profile.details_source = source
    profile.save()


def _parse_abha_text(text):
    details = {}
    for line in text.splitlines():
        if ':' not in line:
            continue
        key, value = line.split(':', 1)
        normalized_key = re.sub(r'[^a-z0-9]+', '_', key.lower()).strip('_')
        details[normalized_key] = value.strip()
    return details


class UploadABHAAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone', '').strip()
        upload = request.FILES.get('file')
        if not phone or not upload:
            return Response({'error': 'Phone number and ABHA text file are required'}, status=400)

        try:
            profile = UserProfile.objects.get(phone_number=phone)
            details = _parse_abha_text(upload.read().decode('utf-8-sig'))
            if not details.get('name') or not details.get('abha_id'):
                return Response({'error': 'The file must include Name and ABHA ID'}, status=400)

            _save_profile_details(profile, details, 'upload')
            DigiLockerDocument.objects.get_or_create(
                user_identifier=phone,
                doc_type='ABHA ID Card',
                defaults={
                    'uri': f'in.gov.nha-ABHA-{uuid.uuid4().hex[:8]}',
                    'title': 'Ayushman Bharat Health Account',
                    'issuer': 'National Health Authority',
                    'date': datetime.now().strftime('%d-%b-%Y'),
                    'note': upload.name + '\n' + '\n'.join(f'{key}: {value}' for key, value in details.items()),
                },
            )
            return Response({'profile': _profile_payload(profile)}, status=200)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Account not found for this phone number'}, status=404)
        except UnicodeDecodeError:
            return Response({'error': 'ABHA file must be a UTF-8 text file'}, status=400)


class LinkDigiLockerAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone', '').strip()
        if not phone:
            return Response({'error': 'Phone number is required'}, status=400)
        try:
            profile = UserProfile.objects.get(phone_number=phone)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Account not found for this phone number'}, status=404)

        document = DigiLockerDocument.objects.filter(
            user_identifier=phone, doc_type='ABHA ID Card'
        ).first()
        if not document:
            from .mock_digilocker import DIGILOCKER_STORAGE
            dummy_abha = next((item for item in DIGILOCKER_STORAGE
                               if item['type'] == 'Government ID'
                               and item.get('phone_number') == phone), None)
            if dummy_abha:
                document = DigiLockerDocument.objects.create(
                    user_identifier=phone,
                    uri=dummy_abha['uri'],
                    title=dummy_abha['name'],
                    doc_type='ABHA ID Card',
                    issuer=dummy_abha['issuer'],
                    date=dummy_abha['date'],
                    note=dummy_abha['note'],
                )
        if not document:
            return Response({'error': 'No ABHA ID card found in DigiLocker'}, status=404)

        note = document.note or ''
        abha_match = re.search(r'ABHA\s*ID\s*:\s*([\d-]+)', note, re.IGNORECASE)
        details = _parse_abha_text(note)
        details.setdefault('name', profile.full_name or profile.user.get_full_name())
        details.setdefault('abha_id', abha_match.group(1) if abha_match else '')
        _save_profile_details(profile, details, 'digilocker')
        return Response({'profile': _profile_payload(profile)}, status=200)

class MedicineFinderAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        user_query = request.data.get('query')
        if not user_query:
            return Response({"error": "No medicine query provided"}, status=400)

        async def run_mcp_query():
            # Dynamically find the path to server.py
            server_path = os.path.abspath(os.path.join(
                os.path.dirname(__file__), '..', 'INDIAN_MEDICINE_MCP_SERVER', 'server.py'
            ))
            
            # NOTE: We are passing ONLY the variable, no "python" text!
            client = Client(server_path)
            
            async with client:
                result = await client.call_tool("fuzzy_search_by_name", {
                    "partial_name": user_query,
                    "similarity_threshold": 0.72,
                    "max_results": 5
                })
                return result.content

        try:
            raw_result = asyncio.run(run_mcp_query())
            
            # Extract text string from the MCP list wrapper
            if isinstance(raw_result, list) and len(raw_result) > 0:
                text_response = raw_result[0].text
            else:
                text_response = raw_result
                
            try:
                mcp_data = json.loads(text_response)
            except json.JSONDecodeError:
                return Response({"error": str(text_response)}, status=404)

            ai_response = {
                "purpose": "Verified via local MCP database.",
                "usage": "Check prescription details.",
                "doses": "Follow doctor instructions.",
                "results": []
            }

            # Since fuzzy_search_by_name returns a list of items:
            # Format: [{"similarity_score": "0.85", "medicine": {...}}, ...]
            items_to_process = mcp_data if isinstance(mcp_data, list) else [mcp_data]

            valid_items = []
            for item in items_to_process:
                med = item.get("medicine", item) if isinstance(item, dict) else item
                if isinstance(med, dict) and "Name" in med:
                    valid_items.append(med)

            prices = [float(med.get("MRP", 0)) for med in valid_items]
            best_price = min(prices) if prices else None

            for med in valid_items:
                # Extract the medicine record whether it's wrapped or direct
                price = float(med.get("MRP", 0))
                ai_response["results"].append({
                    "ph": med.get("Manufacturer", "Local Pharmacy"),
                    "brand": med.get("Name"),
                    "pack": "Standard Pack",
                    "price": price,
                    "bestPrice": price == best_price,
                    "inStock": True,
                    "delivery": True
                })

            ai_response["results"].sort(key=lambda result: result["price"])

            return Response(ai_response, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)
        
User = get_user_model()

class ArogyaDigiLockerCallback(APIView):
    """Catches the code from DigiLocker and exchanges it for a Token."""
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request):
        code = request.GET.get('code')
        
        # 1. Exchange the code for a Token via POST request
        # (Change to sandbox.digitallocker.gov.in for production)
        token_url = "http://127.0.0.1:8000/auth/mock-api/public/oauth2/1/token"
        
        payload = {
            "code": code,
            "grant_type": "authorization_code",
            "client_id": "arogya_test_client",
            "client_secret": "arogya_test_secret",
            "redirect_uri": "http://127.0.0.1:8000/auth/api/digilocker/callback/"
        }
        
        token_response = requests.post(token_url, data=payload).json()
        access_token = token_response.get("access_token")
        
        # In a real app, you save this access_token to the User's database profile here.
        # For the prototype, we will return it to the frontend to store in memory.
        
        # Redirect the user back to the frontend dashboard
        frontend_url = f"http://127.0.0.1:8000/auth/?dl_token={access_token}"
        return HttpResponseRedirect(frontend_url)

class VaultDigiLockerSyncAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        access_token = request.data.get('dl_token')
        
        if not access_token:
            return Response({"error": "Not connected to DigiLocker"}, status=400)
            
        files_url = "http://127.0.0.1:8000/auth/mock-api/public/oauth2/1/files/issued"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        api_response = requests.get(files_url, headers=headers)
        
        if api_response.status_code != 200:
             return Response({"error": "DigiLocker API failed"}, status=400)
             
        raw_docs = api_response.json().get("items", [])
        
        formatted_docs = []
        for doc in raw_docs:
            doc_type = doc.get("type", "Medical Record")
            
            # Dynamic UI icon and accent styling based on document category
            if doc_type == "Vaccination":
                icon, ac = "💉", "#4d9de0"
            elif doc_type == "Lab Report":
                icon, ac = "🧪", "#10b981"
            elif doc_type == "Prescription":
                icon, ac = "💊", "#8b5cf6"
            else:
                icon, ac = "🇮🇳", "#f0b429"
                
            formatted_docs.append({
                "id": doc["uri"],
                "type": doc_type,
                "title": doc["name"],
                "doctor": doc["issuer"],
                "date": doc["date"],
                "icon": icon,
                "ac": ac,
                "shared": False,
                "note": doc.get("note", f"Verified via DigiLocker URI: {doc['uri']}"),
                "medicines": []
            })
            
        return Response({"documents": formatted_docs})
    
class AISummaryAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        phone = str(request.data.get('phone', '')).strip()
        if not phone:
            return Response({"error": "Phone number is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile = UserProfile.objects.get(phone_number=phone)
            documents = list(DigiLockerDocument.objects.filter(
                user_identifier=phone
            ).order_by('uri').values('title', 'doc_type', 'issuer', 'date', 'note'))
            source = {
                'profile': _profile_payload(profile),
                'digilocker_documents': documents,
            }
            source_json = json.dumps(source, sort_keys=True, ensure_ascii=False)
            source_hash = hashlib.sha256(source_json.encode('utf-8')).hexdigest()

            if profile.health_summary and profile.health_summary_source_hash == source_hash:
                return Response({
                    'summary': profile.health_summary,
                    'cached': True,
                    'updated_at': profile.health_summary_updated_at,
                }, status=status.HTTP_200_OK)

            summary_markdown = generate_health_summary(source_json)
            profile.health_summary = summary_markdown
            profile.health_summary_source_hash = source_hash
            profile.health_summary_updated_at = timezone.now()
            profile.save(update_fields=[
                'health_summary', 'health_summary_source_hash', 'health_summary_updated_at'
            ])
            return Response({
                'summary': summary_markdown,
                'cached': False,
                'updated_at': profile.health_summary_updated_at,
            }, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({"error": "Account not found for this phone number"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SymptomCheckerAPI(APIView):
    # Disable session authentication to bypass CSRF requirements
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        print("\n" + "="*40)
        print("📥 Received Symptom Check Request")
        print("Payload:", request.data)
        
        user_text = request.data.get('text')
        phone = request.data.get('phone', '')
        
        if not user_text:
            print("❌ Error: No text provided in request body")
            return Response({"error": "No symptoms provided"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            print(f"🤖 Invoking Gemini Agent for text: '{user_text}'...")
            ai_response = format_agent_response(user_text, phone)
            print(" AI Output:", ai_response)
            print("="*40 + "\n")
            return Response(ai_response, status=status.HTTP_200_OK)
            
        except Exception as e:
            print("❌ Agent execution failed:")
            traceback.print_exc()
            return Response({
                "specialist": "General Physician",
                "urgency": "medium",
                "advice": f"AI Error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class SendOTPAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):
        phone = str(request.data.get('phone', '')).strip()
        
        if not phone:
            return Response({"error": "Phone number is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        create_account = request.data.get('create_account') is True or str(
            request.data.get('create_account', '')
        ).lower() == 'true'
        existing_profile = UserProfile.objects.select_related('user').filter(phone_number=phone).first()
        if not existing_profile and not create_account:
            return Response({"error": "No account found for this phone number. Please create an account first."}, status=404)

        created = False
        try:
            if existing_profile:
                user = existing_profile.user
                profile = existing_profile
            else:
                user, created = User.objects.get_or_create(
                    username=phone,
                    defaults={'first_name': 'Arogya User'},
                )
                profile, profile_created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={'phone_number': phone},
                )
                if not profile_created and profile.phone_number != phone:
                    return Response({"error": "This phone number is already linked to another account"}, status=409)
        except IntegrityError:
            return Response({"error": "This phone number is already linked to another account"}, status=409)

        generate_and_send_sms_otp(user, phone)
        return Response({"message": "OTP sent successfully", "new_account": created}, status=200)

class VerifyOTPAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        phone = request.data.get('phone')
        entered_otp = request.data.get('otp')
        
        if not phone or not entered_otp:
            return Response({"error": "Phone and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            profile = UserProfile.objects.get(phone_number=phone)
            otp_record = OTP.objects.get(user=profile.user)
            
            if otp_record.otp_code == entered_otp:
                # 2. Generate the JWT tokens for the authenticated user
                refresh = RefreshToken.for_user(profile.user)
                
                # Delete the OTP so it cannot be reused
                otp_record.delete() 
                
                # 3. Return the tokens and phone number to the frontend
                return Response({
                    "message": "Login successful",
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                    "phone": phone,
                    "profile": _profile_payload(profile),
                    "needs_onboarding": not bool(profile.abha_id)
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
                
        except (UserProfile.DoesNotExist, OTP.DoesNotExist):
            return Response({"error": "OTP expired or not requested"}, status=status.HTTP_400_BAD_REQUEST)
        
def arogya_frontend(request):
    return render(request, 'index.html')
