# otp_login/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import (
    UserProfile, OTP, DigiLockerDocument, PrescriptionDraft, PrescriptionMedicine,
    ClinicalIntakeSession,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.http import HttpResponseRedirect
from django.conf import settings
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.shortcuts import render
from .utils import generate_and_send_sms_otp # Your Twilio utility function
from .agent import format_agent_response, generate_health_summary
import logging
import secrets
from urllib.parse import urlencode
import os
import asyncio
import json
import re
import uuid
import hashlib
from datetime import datetime, timedelta
from django.utils import timezone
from fastmcp import Client
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .permissions import IsClinicalStaff, IsOwnerOrClinicalStaff, can_access_patient_record
from .utils import verify_otp
from .authentication import CookieJWTAuthentication

logger = logging.getLogger('otp_login.security')

ACCESS_COOKIE = 'access_token'
REFRESH_COOKIE = 'refresh_token'


def _set_auth_cookies(response, refresh):
    secure = not settings.DEBUG
    response.set_cookie(ACCESS_COOKIE, str(refresh.access_token), httponly=True, secure=secure, samesite='Lax', max_age=3600)
    response.set_cookie(REFRESH_COOKIE, str(refresh), httponly=True, secure=secure, samesite='Lax', max_age=604800)
    return response


def _clear_auth_cookies(response):
    response.delete_cookie(ACCESS_COOKIE)
    response.delete_cookie(REFRESH_COOKIE)
    return response


def _blacklist_refresh(raw_refresh):
    try:
        token = RefreshToken(raw_refresh)
        blacklist = getattr(token, 'blacklist', None)
        if blacklist:
            blacklist()
    except TokenError:
        pass

LOCAL_SYMPTOM_GUIDANCE = {
    'headache': ('Neurologist', 'medium', 'Could be tension headache, migraine or dehydration. Monitor 24 hours and see a doctor if it persists.'),
    'chest pain': ('Cardiologist', 'high', 'Seek immediate attention and call 112. Do not drive yourself.'),
    'skin rash': ('Dermatologist', 'low', 'Avoid irritants and consult a doctor if the rash spreads or comes with fever.'),
    'toothache': ('Dentist', 'medium', 'Avoid very hot or cold foods and arrange a dental consultation soon.'),
    'fever': ('General Physician', 'medium', 'Stay hydrated and see a doctor if the fever exceeds 103 F or lasts three days.'),
    'back pain': ('Orthopedic', 'low', 'Rest and apply heat or ice. See a doctor if pain radiates down the legs.'),
    'cough': ('Pulmonologist', 'low', 'Seek care if the cough produces blood or lasts more than three weeks.'),
    'eye pain': ('Ophthalmologist', 'medium', 'Rest your eyes and seek specialist care if pain persists beyond 48 hours.'),
    'kidney pain': ('Urologist', 'high', 'Sharp flank pain may indicate kidney stones. Seek urgent medical evaluation.'),
    'knee pain': ('Orthopedic', 'medium', 'Rest and ice the knee. Arrange an orthopedic consultation if swelling persists.'),
    'stomach pain': ('Gastroenterologist', 'medium', 'Seek urgent care if the pain is severe or sudden.'),
    'breathlessness': ('Pulmonologist', 'high', 'Sit upright and call 112 immediately if breathing difficulty is severe.'),
    'diabetes': ('Endocrinologist', 'medium', 'Monitor blood glucose and arrange an endocrinology review.'),
    'thyroid': ('Endocrinologist', 'low', 'Arrange a TSH test and consult an endocrinologist.'),
    'depression': ('Psychiatrist', 'medium', 'Seek professional support. If you are in crisis, call iCall at 9152987821.'),
}


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


def _request_profile(request):
    try:
        return request.user.userprofile
    except (AttributeError, UserProfile.DoesNotExist):
        return None


def _target_profile(request):
    """Resolve patients from JWT identity; staff may select a target profile."""
    requester = _request_profile(request)
    if not requester:
        return None
    if requester.role == UserProfile.PATIENT:
        return requester

    profile_id = (
        request.data.get('profile_id') or request.data.get('patient_id')
        or request.query_params.get('profile_id') or request.query_params.get('patient_id')
    )
    if profile_id:
        try:
            return UserProfile.objects.get(pk=profile_id)
        except (UserProfile.DoesNotExist, ValueError, TypeError):
            return None

    phone = str(request.data.get('phone') or request.query_params.get('phone', '')).strip()
    if phone:
        return UserProfile.objects.filter(phone_number=phone).first()
    return requester


def _phone_variants(phone):
    variants = {phone}
    if phone.startswith('+91'):
        variants.add(phone[3:])
    elif len(phone) == 10:
        variants.add(f'+91{phone}')
    return variants


def _canonical_phone(phone):
    phone = str(phone or '').strip()
    if len(phone) == 10 and phone.isdigit():
        return f'+91{phone}'
    return phone


def _find_profile_by_phone(phone):
    canonical = _canonical_phone(phone)
    profiles = UserProfile.objects.select_related('user').filter(
        phone_number__in=_phone_variants(canonical)
    )
    return next((profile for profile in profiles if profile.phone_number == canonical), None) or profiles.first()


def _prescription_payload(draft):
    medicines = list(draft.medicines.values(
        'medicine_name', 'dosage', 'frequency', 'duration', 'instructions'
    ))
    return {
        'id': draft.pk,
        'patient_phone': draft.patient_phone,
        'status': draft.status,
        'reviewed_by': draft.reviewed_by,
        'image_url': draft.uploaded_image.url if draft.uploaded_image else '',
        'raw_gemini_response': draft.raw_gemini_response,
        'extracted_data': draft.extracted_data,
        'medicines': medicines,
        'created_at': draft.created_at,
        'updated_at': draft.updated_at,
    }


def _prescription_patient(draft):
    return UserProfile.objects.filter(phone_number=draft.patient_phone).first()


def _prescription_allowed(request, draft):
    profile = _prescription_patient(draft)
    return bool(profile and can_access_patient_record(request.user, profile))


def _update_prescription_fields(draft, data):
    extracted = dict(draft.extracted_data or {})
    for field in ('doctor_name', 'prescription_date', 'diagnosis'):
        if field in data:
            extracted[field] = str(data[field] or '')
    if 'medicines' in data and isinstance(data['medicines'], list):
        extracted['medicines'] = data['medicines']
    draft.extracted_data = extracted
    draft.save(update_fields=['extracted_data', 'updated_at'])
    if 'medicines' in data and isinstance(data['medicines'], list):
        draft.medicines.all().delete()
        PrescriptionMedicine.objects.bulk_create([
            PrescriptionMedicine(
                draft=draft,
                medicine_name=str(item.get('medicine_name', '') or ''),
                dosage=str(item.get('dosage', '') or ''),
                frequency=str(item.get('frequency', '') or ''),
                duration=str(item.get('duration', '') or ''),
                instructions=str(item.get('instructions', '') or ''),
            )
            for item in data['medicines'] if isinstance(item, dict)
        ])


INTAKE_QUESTIONS = [
    ('symptoms', 'Site and character: what symptom are you experiencing, and what does it feel like?', 'text'),
    ('duration', 'Onset and timing: when did it start, and how has it changed over time?', 'text'),
    ('severity', 'Severity: how severe is it from mild to severe?', 'options'),
    ('doctor_suggestion', 'What did the doctor advise you to do, take, or avoid?', 'text'),
    ('allergies', 'Associated symptoms and allergies: what else is happening, and do you have allergies?', 'text'),
    ('additional_notes', 'Radiation and modifiers: does it spread, and what makes it better or worse?', 'text'),
]


def _intake_question_payload(key, question, kind):
    return {
        'key': key,
        'question': question,
        'type': kind,
        'options': ['Mild', 'Moderate', 'Severe', 'I do not know / I cannot answer'] if kind == 'options' else ['I do not know / I cannot answer'],
    }


def _intake_next(session):
    for key, question, kind in INTAKE_QUESTIONS:
        if not getattr(session, key):
            return _intake_question_payload(key, question, kind)
    extraction = session.draft.extracted_data or {}
    follow_up = (session.merged_record or {}).get('follow_up_answers', {})
    for index, medicine in enumerate(extraction.get('medicines', []), 1):
        for field, question in (
            ('medicine_name', 'The medicine name is unclear in the prescription. Do you remember its name?'),
            ('dosage', 'The dosage is unclear. What dosage did the doctor tell you?'),
            ('duration', 'How many days did the doctor ask you to take this medicine?'),
            ('instructions', 'The medicine instructions are unclear. What did the doctor tell you?'),
        ):
            if not medicine.get(field) and f'medicine_{index}_{field}' not in follow_up:
                return _intake_question_payload(f'medicine_{index}_{field}', question, 'text')
    return None


def _intake_payload(session):
    preferences = session.merged_record or {}
    return {
        'draft_id': session.draft_id,
        'answers': {key: getattr(session, key) for key, _, _ in INTAKE_QUESTIONS},
        'unanswered_questions': session.unanswered_questions,
        'next_question': _intake_next(session),
        'ready_for_summary': _intake_next(session) is None,
        'language': preferences.get('language', 'English'),
        'mode': preferences.get('mode', 'chat'),
    }


def _intake_allowed(request, draft):
    return _prescription_allowed(request, draft)


def _build_intake_summary(session):
    extraction = session.draft.extracted_data or {}
    medicines = [dict(item) for item in extraction.get('medicines', [])]
    follow_up = (session.merged_record or {}).get('follow_up_answers', {})
    confidence = extraction.get('confidence_by_field', {}) or {}
    threshold = 0.25
    patient_confirmed_fields = set()
    for index, medicine in enumerate(medicines, 1):
        for field in ('medicine_name', 'dosage', 'duration', 'instructions'):
            answer = follow_up.get(f'medicine_{index}_{field}')
            if answer and not answer.lower().startswith('i do not know'):
                medicine[field] = answer
                patient_confirmed_fields.add(f'medicine_{index}_{field}')
    uncertain = []
    field_confidence = {}
    for field, label in (('diagnosis', 'diagnosis'), ('doctor_name', 'doctor name'), ('prescription_date', 'prescription date')):
        extracted_confidence = float(confidence.get(field, 0.0) or 0.0)
        field_confidence[field] = extracted_confidence
        if not extraction.get(field) or extracted_confidence < threshold:
            extraction[field] = ''
            uncertain.append(f'{label} is unclear or missing')
    for index, medicine in enumerate(medicines, 1):
        for field, label in (('medicine_name', 'medicine name'), ('dosage', 'dosage'), ('frequency', 'frequency'), ('duration', 'duration'), ('instructions', 'instructions')):
            confidence_key = f'medicine_{index}_{field}'
            extracted_confidence = float(confidence.get(confidence_key, 0.0) or 0.0)
            field_confidence[confidence_key] = extracted_confidence
            if not medicine.get(field) or extracted_confidence < threshold:
                medicine[field] = ''
                uncertain.append(f'medicine {index} {label} is unclear')
    uncertain.extend(session.unanswered_questions)
    for field in patient_confirmed_fields:
        field_confidence[field] = 0.8
    testimony = {key: getattr(session, key) for key, _, _ in INTAKE_QUESTIONS}
    summary = 'Patient reports '
    summary += testimony['symptoms'] or 'no symptoms recorded'
    if testimony['duration']:
        summary += f" for {testimony['duration']}"
    if testimony['severity']:
        summary += f", described as {testimony['severity'].lower()}"
    summary += '. A handwritten prescription was uploaded.'
    names = [item.get('medicine_name') for item in medicines if item.get('medicine_name')]
    if names:
        summary += f" {', '.join(names)} identified."
    if uncertain:
        summary += ' Some dosage, duration, or prescription details remain unclear.'
    if testimony['allergies']:
        summary += f" Allergies: {testimony['allergies']}."
    testimony = {key: getattr(session, key) for key, _, _ in INTAKE_QUESTIONS}
    language = str((session.merged_record or {}).get('language', 'English'))
    ai_summary = {'summary': '', 'anomalies': [], 'confidence_notes': {}}
    if os.getenv('ENABLE_GEMINI_SUMMARY', 'false').lower() == 'true':
        from .prescription_ai import generate_prescription_summary
        ai_summary = generate_prescription_summary(
            {'doctor_name': extraction.get('doctor_name', ''),
             'prescription_date': extraction.get('prescription_date', ''),
             'diagnosis': extraction.get('diagnosis', ''), 'medicines': medicines},
            testimony,
            language,
        )
        uncertain.extend(ai_summary.get('anomalies', []))
    fhir_bundle = _fhir_prescription_bundle(
        extraction, medicines, testimony, uncertain, ai_summary.get('summary', ''), language, field_confidence,
    )
    return {
        'document_details': {
            'doctor_name': extraction.get('doctor_name', ''),
            'prescription_date': extraction.get('prescription_date', ''),
            'diagnosis_from_prescription': extraction.get('diagnosis', ''),
        },
        'patient_testimony': testimony,
        'medicines': medicines,
        'missing_or_uncertain_information': uncertain,
        'short_clinical_summary': summary,
        'ai_summary': ai_summary.get('summary', '') or summary,
        'confidence_threshold': 0.25,
        'overall_extraction_confidence': extraction.get('overall_confidence', 0.0),
        'field_confidence': field_confidence,
        'fhir_bundle': fhir_bundle,
        'language': language,
    }


def _fhir_prescription_bundle(extraction, medicines, testimony, anomalies, summary, language, field_confidence):
    """Build a FHIR R4 Bundle from only extracted or patient-confirmed values."""
    patient_id = re.sub(r'[^A-Za-z0-9.-]', '-', str(testimony.get('patient_name') or 'patient'))[:64]
    patient_entry = {
        'fullUrl': f'urn:uuid:patient-{patient_id}',
        'resource': {
            'resourceType': 'Patient', 'id': patient_id,
            'name': [{'text': str(extraction.get('patient_name') or '')}],
        },
    }
    entries = []
    composition = {
        'fullUrl': 'urn:uuid:clinical-note',
        'resource': {
            'resourceType': 'Composition', 'id': 'clinical-note', 'status': 'final',
            'type': {'text': 'Prescription summary'},
            'subject': {'reference': f'Patient/{patient_id}'},
            'title': 'AI-assisted prescription summary',
            'language': 'hi' if language.lower().startswith('h') else 'en',
            'text': {'status': 'generated', 'div': summary or 'Prescription summary pending.'},
            'extension': [
                {'url': 'https://sanjeevni.local/fhir/anomaly', 'valueString': str(item)}
                for item in anomalies
            ],
        },
    }
    entries.append(composition)
    entries.append(patient_entry)
    for index, medicine in enumerate(medicines, 1):
        entries.append({
            'fullUrl': f'urn:uuid:medication-request-{index}',
            'resource': {
                'resourceType': 'MedicationRequest', 'id': f'medication-request-{index}',
                'status': 'active', 'intent': 'order',
                'subject': {'reference': f'Patient/{patient_id}'},
                'medicationCodeableConcept': {'text': medicine.get('medicine_name', '')},
                'dosageInstruction': [{
                    'text': ' '.join(filter(None, [medicine.get('dosage', ''), medicine.get('frequency', ''), medicine.get('duration', ''), medicine.get('instructions', '')]))
                }],
                'extension': [{
                    'url': 'https://sanjeevni.local/fhir/confidence',
                    'valueDecimal': min(field_confidence.get(f'medicine_{index}_{field}', 0.0) for field in ('medicine_name', 'dosage', 'duration', 'instructions')),
                }],
            },
        })
    return {
        'resourceType': 'Bundle', 'type': 'document',
        'timestamp': timezone.now().isoformat(), 'entry': entries,
    }


class UploadABHAAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsOwnerOrClinicalStaff]

    def post(self, request):
        profile = _target_profile(request)
        upload = request.FILES.get('file')
        if not profile or not upload:
            return Response({'error': 'ABHA text file is required'}, status=400)

        try:
            details = _parse_abha_text(upload.read().decode('utf-8-sig'))
            if not details.get('name') or not details.get('abha_id'):
                return Response({'error': 'The file must include Name and ABHA ID'}, status=400)

            _save_profile_details(profile, details, 'upload')
            DigiLockerDocument.objects.get_or_create(
                user_identifier=profile.phone_number,
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
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsOwnerOrClinicalStaff]

    def post(self, request):
        profile = _target_profile(request)
        if not profile:
            return Response({'error': 'Account not found'}, status=404)
        phone_variants = _phone_variants(profile.phone_number)

        document = DigiLockerDocument.objects.filter(
            user_identifier__in=phone_variants, doc_type='ABHA ID Card'
        ).first()
        if not document:
            from .mock_digilocker import DIGILOCKER_STORAGE
            dummy_abha = next((item for item in DIGILOCKER_STORAGE
                               if item['type'] == 'Government ID'
                               and item.get('phone_number') in phone_variants), None)
            if dummy_abha:
                document = DigiLockerDocument.objects.create(
                    user_identifier=profile.phone_number,
                    uri=dummy_abha['uri'],
                    title=dummy_abha['name'],
                    doc_type='ABHA ID Card',
                    issuer=dummy_abha['issuer'],
                    date=dummy_abha['date'],
                    note=dummy_abha['note'],
                )
        if not document:
            return Response({
                'profile': _profile_payload(profile),
                'linked': False,
                'message': 'No ABHA ID card was found in DigiLocker. Upload the ABHA text file instead.',
            }, status=200)

        note = document.note or ''
        abha_match = re.search(r'ABHA\s*ID\s*:\s*([\d-]+)', note, re.IGNORECASE)
        details = _parse_abha_text(note)
        details.setdefault('name', profile.full_name or profile.user.get_full_name())
        details.setdefault('abha_id', abha_match.group(1) if abha_match else '')
        _save_profile_details(profile, details, 'digilocker')
        return Response({'profile': _profile_payload(profile)}, status=200)


class ProfileAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsOwnerOrClinicalStaff]

    def get(self, request):
        profile = _target_profile(request)
        if not profile or not can_access_patient_record(request.user, profile):
            return Response({'error': 'Profile not found'}, status=404)
        return Response({'profile': _profile_payload(profile)}, status=200)

    def post(self, request):
        profile = _target_profile(request)
        if not profile or not can_access_patient_record(request.user, profile):
            return Response({'error': 'Account not found'}, status=404)
        details = {
            'name': request.data.get('name', ''),
            'age': request.data.get('age'),
            'blood_group': request.data.get('blood_group', ''),
            'abha_id': profile.abha_id,
        }
        _save_profile_details(profile, details, profile.details_source or 'profile')
        return Response({'profile': _profile_payload(profile)}, status=200)


class PrescriptionUploadAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsOwnerOrClinicalStaff]

    def post(self, request):
        profile = _request_profile(request)
        phone = str(request.data.get('phone', '')).strip()
        image = request.FILES.get('image')
        if not profile or not image:
            return Response({'error': 'Image and authenticated patient are required'}, status=400)
        target = _find_profile_by_phone(phone) if phone else profile
        if not target or not can_access_patient_record(request.user, target):
            return Response({'error': 'Patient profile not found'}, status=404)
        logger.info('prescription_event action=upload_received result=accepted')
        draft = PrescriptionDraft.objects.create(patient_phone=target.phone_number, uploaded_image=image)
        from .prescription_ai import extract_prescription_from_image
        extracted = extract_prescription_from_image(draft.uploaded_image.path)
        if extracted.get('fallback_result') and not extracted.get('upload_allowed', False):
            extracted['ocr_pending'] = True
            draft.extracted_data = extracted
            draft.raw_gemini_response = json.dumps(extracted, ensure_ascii=False)
            draft.save(update_fields=['extracted_data', 'raw_gemini_response', 'updated_at'])
            logger.warning('prescription_event action=ocr_pending providers=%s', extracted.get('provider_attempts', []))
            return Response({
                **_prescription_payload(draft),
                'warning': 'Prescription uploaded, but OCR is temporarily unavailable. Please retry analysis later.',
                'provider_attempts': extracted.get('provider_attempts', []),
            }, status=201)
        draft.extracted_data = extracted
        draft.raw_gemini_response = json.dumps(extracted, ensure_ascii=False)
        draft.save(update_fields=['extracted_data', 'raw_gemini_response', 'updated_at'])
        medicines = extracted.get('medicines', []) if isinstance(extracted, dict) else []
        PrescriptionMedicine.objects.bulk_create([
            PrescriptionMedicine(draft=draft, **{
                field: str(item.get(field, '') or '')
                for field in ('medicine_name', 'dosage', 'frequency', 'duration', 'instructions')
            })
            for item in medicines if isinstance(item, dict)
        ])
        logger.info('prescription_event action=draft_created result=success')
        return Response(_prescription_payload(draft), status=201)


class PrescriptionPendingAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsClinicalStaff]

    def get(self, request):
        drafts = PrescriptionDraft.objects.filter(status=PrescriptionDraft.PENDING)
        profile = _request_profile(request)
        if profile and profile.role != UserProfile.ADMIN:
            assigned_phones = UserProfile.objects.filter(
                clinical_assignments__clinician=profile,
                clinical_assignments__active=True,
            ).values_list('phone_number', flat=True)
            assistant_phones = UserProfile.objects.filter(
                clinical_assignments__assistant=profile,
                clinical_assignments__active=True,
            ).values_list('phone_number', flat=True)
            drafts = drafts.filter(patient_phone__in=list(assigned_phones) + list(assistant_phones))
        return Response({'drafts': [_prescription_payload(draft) for draft in drafts]}, status=200)


class PrescriptionDetailAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsOwnerOrClinicalStaff]

    def get_object(self, pk):
        try:
            return PrescriptionDraft.objects.get(pk=pk)
        except PrescriptionDraft.DoesNotExist:
            return None

    def get(self, request, pk):
        draft = self.get_object(pk)
        if not draft or not _prescription_allowed(request, draft):
            return Response({'error': 'Prescription draft not found'}, status=404)
        return Response(_prescription_payload(draft), status=200)


class PrescriptionEditAPI(PrescriptionDetailAPI):
    def patch(self, request, pk):
        draft = self.get_object(pk)
        if not draft or draft.status != PrescriptionDraft.PENDING or not _prescription_allowed(request, draft):
            return Response({'error': 'Prescription draft not found'}, status=404)
        _update_prescription_fields(draft, request.data)
        return Response(_prescription_payload(draft), status=200)


class PrescriptionApproveAPI(PrescriptionDetailAPI):
    def post(self, request, pk):
        draft = self.get_object(pk)
        reviewer = _request_profile(request)
        if not draft or not reviewer or reviewer.role not in {UserProfile.CLINICIAN, UserProfile.ADMIN}:
            return Response({'error': 'Prescription draft not found'}, status=404)
        if draft.status != PrescriptionDraft.PENDING or not _prescription_allowed(request, draft):
            return Response({'error': 'Prescription draft not found'}, status=404)
        reviewed_by = str(request.data.get('reviewed_by', '')).strip()
        if not reviewed_by:
            return Response({'error': 'reviewed_by is required'}, status=400)
        draft.reviewed_by = reviewed_by
        draft.status = PrescriptionDraft.APPROVED
        draft.save(update_fields=['reviewed_by', 'status', 'updated_at'])
        document = DigiLockerDocument.objects.create(
            user_identifier=draft.patient_phone,
            uri=f'in.gov.health-prescription-{uuid.uuid4().hex[:10]}',
            title='Verified Prescription',
            doc_type='Prescription',
            issuer='Arogya Doctor Portal',
            date=str(draft.extracted_data.get('prescription_date', '') or ''),
            note=json.dumps(draft.extracted_data, ensure_ascii=False),
        )
        logger.info('prescription_event action=approved result=stored')
        return Response({'message': 'Prescription approved', 'document_uri': document.uri}, status=200)


class ClinicalIntakeStartAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsOwnerOrClinicalStaff]

    def post(self, request, draft_id):
        try:
            draft = PrescriptionDraft.objects.get(pk=draft_id)
        except PrescriptionDraft.DoesNotExist:
            return Response({'error': 'Prescription draft not found'}, status=404)
        if not _intake_allowed(request, draft):
            return Response({'error': 'Prescription draft not found'}, status=404)
        session, _ = ClinicalIntakeSession.objects.get_or_create(
            draft=draft, defaults={'patient_phone': draft.patient_phone}
        )
        quality = draft.extracted_data or {}
        return Response({
            'extraction': quality,
            'image_quality': quality.get('image_quality', 'clear'),
            'reupload_required': quality.get('reupload_required', False),
            'reupload_message': quality.get('reupload_reason', ''),
            **_intake_payload(session),
        }, status=200)


class ClinicalIntakeAnswerAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsOwnerOrClinicalStaff]

    def post(self, request, draft_id):
        try:
            session = ClinicalIntakeSession.objects.select_related('draft').get(draft_id=draft_id)
        except ClinicalIntakeSession.DoesNotExist:
            return Response({'error': 'Intake session not found'}, status=404)
        if not _intake_allowed(request, session.draft):
            return Response({'error': 'Intake session not found'}, status=404)
        key = request.data.get('question_key')
        answer = str(request.data.get('answer', '')).strip()
        valid_keys = {item[0] for item in INTAKE_QUESTIONS}
        targeted_key = re.fullmatch(r'medicine_(\d+)_(medicine_name|dosage|duration|instructions)', str(key or ''))
        if key not in valid_keys and not targeted_key or not answer:
            return Response({'error': 'Question and answer are required'}, status=400)
        if targeted_key:
            merged_record = dict(session.merged_record or {})
            follow_up = dict(merged_record.get('follow_up_answers', {}))
            follow_up[key] = answer
            merged_record['follow_up_answers'] = follow_up
            session.merged_record = merged_record
            if answer.lower().startswith('i do not know'):
                unanswered = list(session.unanswered_questions or [])
                if key not in unanswered:
                    unanswered.append(key)
                session.unanswered_questions = unanswered
            session.save(update_fields=['merged_record', 'unanswered_questions', 'updated_at'])
            return Response(_intake_payload(session), status=200)
        if answer.lower().startswith('i do not know'):
            unanswered = list(session.unanswered_questions or [])
            if key not in unanswered:
                unanswered.append(key)
            session.unanswered_questions = unanswered
        setattr(session, key, answer)
        session.save(update_fields=[key, 'unanswered_questions', 'updated_at'])
        return Response(_intake_payload(session), status=200)


class ClinicalIntakePreferencesAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsOwnerOrClinicalStaff]

    def post(self, request, draft_id):
        try:
            session = ClinicalIntakeSession.objects.select_related('draft').get(draft_id=draft_id)
        except ClinicalIntakeSession.DoesNotExist:
            return Response({'error': 'Intake session not found'}, status=404)
        if not _intake_allowed(request, session.draft):
            return Response({'error': 'Intake session not found'}, status=404)
        merged_record = dict(session.merged_record or {})
        merged_record['language'] = 'Hindi' if str(request.data.get('language', '')).lower().startswith('h') else 'English'
        merged_record['mode'] = 'talk' if request.data.get('mode') == 'talk' else 'chat'
        session.merged_record = merged_record
        session.save(update_fields=['merged_record', 'updated_at'])
        return Response(_intake_payload(session), status=200)


class ClinicalIntakeSummaryAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsOwnerOrClinicalStaff]

    def get(self, request, draft_id):
        try:
            session = ClinicalIntakeSession.objects.select_related('draft').get(draft_id=draft_id)
        except ClinicalIntakeSession.DoesNotExist:
            return Response({'error': 'Intake session not found'}, status=404)
        if not _intake_allowed(request, session.draft):
            return Response({'error': 'Intake session not found'}, status=404)
        session.merged_record = _build_intake_summary(session)
        session.patient_summary = session.merged_record['short_clinical_summary']
        session.save(update_fields=['merged_record', 'patient_summary', 'updated_at'])
        return Response(session.merged_record, status=200)


class ClinicalIntakeSendToHIPAPI(ClinicalIntakeSummaryAPI):
    def post(self, request, draft_id):
        response = self.get(request, draft_id)
        if response.status_code != 200:
            return response
        session = ClinicalIntakeSession.objects.get(draft_id=draft_id)
        reference = f'HIP-DEMO-{uuid.uuid4().hex[:8].upper()}'
        session.hip_status = 'SENT'
        session.hip_reference = reference
        session.save(update_fields=['hip_status', 'hip_reference', 'updated_at'])
        DigiLockerDocument.objects.update_or_create(
            user_identifier=session.patient_phone,
            uri=f'in.gov.health-clinical-summary-{session.pk}',
            defaults={
                'title': 'AI-Assisted Clinical Intake Summary',
                'doc_type': 'Clinical Summary',
                'issuer': 'MediKiosk Hospital HIP (Demo)',
                'date': datetime.now().strftime('%d-%b-%Y'),
                'note': json.dumps(session.merged_record, ensure_ascii=False),
            },
        )
        logger.info('clinical_intake action=send_to_hip result=success')
        return Response({
            'success': True,
            'hip_status': 'SENT',
            'hip_reference': reference,
            'message': 'Structured clinical summary securely sent to Hospital HIP (demo).',
        }, status=200)

class MedicineFinderAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

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
                return Response({"error": "Service temporarily unavailable"}, status=503)

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

        except Exception:
            logger.error('medicine_search action=lookup result=error')
            return Response({"error": "Service temporarily unavailable"}, status=503)
        
User = get_user_model()

class DigiLockerAuthorizeAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import OAuthState
        state = secrets.token_urlsafe(32)
        OAuthState.objects.create(
            state_hash=hashlib.sha256(state.encode()).hexdigest(),
            user=request.user,
            session_key=request.session.session_key or '',
            redirect_uri=settings.DIGILOCKER_REDIRECT_URI,
        )
        query = urlencode({
            'response_type': 'code',
            'client_id': settings.DIGILOCKER_CLIENT_ID,
            'redirect_uri': settings.DIGILOCKER_REDIRECT_URI,
            'state': state,
        })
        return Response({'authorization_url': f'/auth/mock-api/public/oauth2/1/authorize?{query}'})


class ArogyaDigiLockerCallback(APIView):
    """Catches the code from DigiLocker and exchanges it for a Token."""
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request):
        code = request.GET.get('code')
        state = request.GET.get('state')
        if not code or not state:
            return Response({'error': 'Authorization failed'}, status=400)
        from .models import OAuthState
        state_hash = hashlib.sha256(state.encode()).hexdigest()
        oauth_state = OAuthState.objects.filter(state_hash=state_hash, used_at__isnull=True).first()
        if (
            not oauth_state
            or oauth_state.redirect_uri != settings.DIGILOCKER_REDIRECT_URI
            or oauth_state.session_key != (request.session.session_key or '')
            or timezone.now() - oauth_state.created_at > timedelta(minutes=5)
        ):
            return Response({'error': 'Authorization failed'}, status=400)
        oauth_state.used_at = timezone.now()
        oauth_state.save(update_fields=['used_at'])
        logger.info('oauth_event action=callback result=accepted')
        return HttpResponseRedirect('/auth/?digilocker=connected')

class VaultDigiLockerSyncAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsOwnerOrClinicalStaff]
    
    def post(self, request):
        profile = _target_profile(request)
        if not profile or not can_access_patient_record(request.user, profile):
            return Response({'error': 'Patient profile not found'}, status=404)

        from .mock_digilocker import DIGILOCKER_STORAGE
        phone_variants = _phone_variants(profile.phone_number)
        stored_docs = DigiLockerDocument.objects.filter(
            user_identifier__in=phone_variants
        ).order_by('-created_at')
        documents = []
        seen_uris = set()
        for doc in stored_docs:
            documents.append({
                'id': doc.uri,
                'type': doc.doc_type,
                'title': doc.title,
                'doctor': doc.issuer,
                'date': doc.date,
                'icon': '💊' if doc.doc_type == 'Prescription' else '🧪' if doc.doc_type == 'Lab Report' else '💉' if doc.doc_type == 'Vaccination' else '🇮🇳',
                'ac': '#4d9de0' if doc.doc_type == 'Lab Report' else '#10b981' if doc.doc_type == 'Vaccination' else '#f0b429',
                'shared': False,
                'note': doc.note or '',
                'medicines': [],
            })
            seen_uris.add(doc.uri)

        for doc in DIGILOCKER_STORAGE:
            if doc['uri'] in seen_uris:
                continue
            if doc.get('phone_number') not in phone_variants:
                continue
            documents.append({
                'id': doc['uri'],
                'type': doc.get('type', 'Medical Record'),
                'title': doc['name'],
                'doctor': doc.get('issuer', 'DigiLocker'),
                'date': doc.get('date', ''),
                'icon': '💉' if doc.get('type') == 'Vaccination' else '🇮🇳',
                'ac': '#4d9de0' if doc.get('type') == 'Vaccination' else '#f0b429',
                'shared': False,
                'note': doc.get('note', ''),
                'medicines': [],
            })
        return Response({'documents': documents}, status=200)
    
class AISummaryAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsOwnerOrClinicalStaff]

    def post(self, request):
        profile = _target_profile(request)
        if not profile or not can_access_patient_record(request.user, profile):
            return Response({'error': 'Patient profile not found'}, status=404)
        phone = profile.phone_number

        try:
            documents = list(DigiLockerDocument.objects.filter(
                user_identifier__in=_phone_variants(phone)
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
        except Exception:
            logger.error('health_summary action=generate result=error')
            return Response({"error": "Service temporarily unavailable"}, status=503)

class SymptomCheckerAPI(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsOwnerOrClinicalStaff]

    def post(self, request):
        user_text = request.data.get('text')
        profile = _target_profile(request)
        
        if not user_text or not profile or not can_access_patient_record(request.user, profile):
            return Response({"error": "No symptoms provided"}, status=status.HTTP_400_BAD_REQUEST)

        normalized_text = str(user_text).lower()
        for symptom, (specialist, urgency, advice) in LOCAL_SYMPTOM_GUIDANCE.items():
            if symptom in normalized_text:
                return Response({
                    'specialist': specialist,
                    'urgency': urgency,
                    'advice': advice,
                    'source': 'local-guidance',
                }, status=status.HTTP_200_OK)

        try:
            logger.info(
                'security_access_decision user_id=%s role=%s action=symptom_analysis '
                'target_profile_id=%s allowed=%s',
                request.user.id, profile.role, profile.pk, True,
            )
            ai_response = format_agent_response(user_text, profile.phone_number)
            return Response(ai_response, status=status.HTTP_200_OK)
            
        except Exception:
            logger.error('symptom_analysis action=generate result=error')
            return Response({
                "specialist": "General Physician",
                "urgency": "medium",
                "advice": "The AI service is temporarily unavailable. Please consult a General Physician for an in-person evaluation.",
                "degraded": True,
            }, status=status.HTTP_200_OK)
        
class SendOTPAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):
        phone = str(request.data.get('phone', '')).strip()
        email = str(request.data.get('email', '')).strip().lower()
        
        if not phone:
            return Response({"error": "Unable to process request"}, status=400)
        
        create_account = request.data.get('create_account') is True or str(
            request.data.get('create_account', '')
        ).lower() == 'true'
        phone = _canonical_phone(phone)
        existing_profile = _find_profile_by_phone(phone)

        created = False
        try:
            if existing_profile:
                if existing_profile.phone_number != phone:
                    existing_profile.phone_number = phone
                    existing_profile.save(update_fields=['phone_number'])
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
                    return Response({"error": "Unable to process request"}, status=409)
            if email and user.email != email:
                user.email = email
                user.save(update_fields=['email'])
        except IntegrityError:
            return Response({"error": "Unable to process request"}, status=409)

        sent = generate_and_send_sms_otp(
            user, phone, request_ip=request.META.get('REMOTE_ADDR'), email=email
        )
        if not sent:
            return Response({"error": "OTP delivery is not configured. Please contact support."}, status=503)
        return Response({"message": "OTP request accepted", "new_account": created}, status=200)

class VerifyOTPAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        phone = _canonical_phone(request.data.get('phone'))
        entered_otp = str(request.data.get('otp', '')).strip()
        
        if not phone or not entered_otp:
            return Response({"error": "Unable to verify credentials"}, status=400)
            
        try:
            profile = _find_profile_by_phone(phone)
            if not profile:
                raise UserProfile.DoesNotExist
            otp_record = OTP.objects.get(user=profile.user)
            
            valid, reason = verify_otp(otp_record, entered_otp)
            if valid:
                refresh = RefreshToken.for_user(profile.user)
                otp_record.delete()
                response = Response({
                    "message": "Login successful",
                    "profile": _profile_payload(profile),
                    "needs_onboarding": not bool(profile.abha_id)
                }, status=status.HTTP_200_OK)
                return _set_auth_cookies(response, refresh)
            return Response({"error": f"OTP verification failed: {reason}"}, status=400)
                
        except (UserProfile.DoesNotExist, OTP.DoesNotExist):
            return Response({"error": "No active OTP was found. Request a new code."}, status=400)


class CSRFTokenAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({'csrfToken': get_token(request)})


class RefreshTokenAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @method_decorator(csrf_protect)
    def post(self, request):
        raw_refresh = request.COOKIES.get(REFRESH_COOKIE)
        if not raw_refresh:
            return Response({'error': 'Authentication required'}, status=401)
        try:
            old_refresh = RefreshToken(raw_refresh)
            user = User.objects.get(pk=old_refresh['user_id'])
            refresh = RefreshToken.for_user(user)
            _blacklist_refresh(raw_refresh)
            return _set_auth_cookies(Response({'message': 'Token refreshed'}), refresh)
        except (TokenError, User.DoesNotExist):
            return _clear_auth_cookies(Response({'error': 'Authentication required'}, status=401))


class LogoutAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @method_decorator(csrf_protect)
    def post(self, request):
        raw_refresh = request.COOKIES.get(REFRESH_COOKIE)
        if raw_refresh:
            try:
                _blacklist_refresh(raw_refresh)
            except TokenError:
                pass
        return _clear_auth_cookies(Response({'message': 'Logged out'}))
        
def arogya_frontend(request):
    return render(request, 'index.html')
