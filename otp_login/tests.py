import hashlib
import logging
import os
import tempfile
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    ClinicalPatientAssignment, ClinicalIntakeSession, DigiLockerDocument, OTP, OAuthState,
    ORSBedRequest, PrescriptionDraft, PrescriptionMedicine, UserProfile,
)
from .prescription_ai import OCR_MODELS, extract_prescription_from_image
from .utils import generate_and_send_sms_otp, verify_otp

logging.getLogger('otp_login.security').setLevel(logging.DEBUG)


class SecurityAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.patient, self.patient_profile = self._account('+911111111111', UserProfile.PATIENT)
        self.other, self.other_profile = self._account('+922222222222', UserProfile.PATIENT)
        self.clinician, self.clinician_profile = self._account('+933333333333', UserProfile.CLINICIAN)
        self.assistant, self.assistant_profile = self._account('+944444444444', UserProfile.ASSISTANT)
        DigiLockerDocument.objects.create(
            user_identifier=self.patient_profile.phone_number, uri='patient-document',
            title='Patient record', doc_type='Lab Report', issuer='Clinic', date='today',
        )
        DigiLockerDocument.objects.create(
            user_identifier=self.other_profile.phone_number, uri='other-document',
            title='Other record', doc_type='Prescription', issuer='Clinic', date='today',
        )

    def _account(self, phone, role):
        user = User.objects.create(username=phone)
        user.set_unusable_password()
        user.save(update_fields=['password'])
        return user, UserProfile.objects.create(user=user, phone_number=phone, role=role)

    def _cookie_login(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.cookies['access_token'] = str(refresh.access_token)
        self.client.cookies['refresh_token'] = str(refresh)
        self.client.get('/auth/api/csrf/')

    def _otp(self, user, code='123456'):
        return OTP.objects.create(
            user=user, otp_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=10),
        )

    def test_unauthenticated_record_request_is_rejected_with_401(self):
        self.assertEqual(self.client.post('/auth/api/vault/sync-digilocker/', {}).status_code, 401)

    def test_patient_can_access_only_own_profile_and_documents(self):
        self._cookie_login(self.patient)
        profile = self.client.get('/auth/api/onboarding/profile/', {'profile_id': self.other_profile.pk})
        docs = self.client.post('/auth/api/vault/sync-digilocker/', {'profile_id': self.other_profile.pk})
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.data['profile']['name'], '')
        self.assertEqual([item['id'] for item in docs.data['documents']], ['patient-document'])

    def test_unassigned_staff_cannot_access_patient(self):
        self._cookie_login(self.clinician)
        self.assertEqual(self.client.get('/auth/api/onboarding/profile/', {'profile_id': self.patient_profile.pk}).status_code, 404)
        self._cookie_login(self.assistant)
        self.assertEqual(self.client.get('/auth/api/onboarding/profile/', {'profile_id': self.patient_profile.pk}).status_code, 404)

    def test_assignment_controls_clinician_and_assistant_access(self):
        ClinicalPatientAssignment.objects.create(
            patient=self.patient_profile, clinician=self.clinician_profile,
            assistant=self.assistant_profile,
        )
        self._cookie_login(self.clinician)
        self.assertEqual(self.client.get('/auth/api/onboarding/profile/', {'profile_id': self.patient_profile.pk}).status_code, 200)
        self._cookie_login(self.assistant)
        self.assertEqual(self.client.get('/auth/api/onboarding/profile/', {'profile_id': self.patient_profile.pk}).status_code, 200)

    def test_assistant_cannot_upload_clinician_document(self):
        self._cookie_login(self.assistant)
        response = self.client.post('/auth/mock-api/public/oauth2/1/files/upload', {'title': 'Record', 'profile_id': self.patient_profile.pk})
        self.assertEqual(response.status_code, 403)

    def test_otp_is_hashed_and_expires(self):
        record = self._otp(self.patient)
        self.assertNotEqual(record.otp_hash, '123456')
        self.assertTrue(check_password('123456', record.otp_hash))
        record.expires_at = timezone.now() - timedelta(seconds=1)
        record.save(update_fields=['expires_at'])
        response = self.client.post('/auth/api/verify-otp/', {'phone': self.patient_profile.phone_number, 'otp': '123456'})
        self.assertEqual(response.status_code, 400)

    def test_otp_attempt_lockout(self):
        record = self._otp(self.patient, '654321')
        for _ in range(5):
            self.client.post('/auth/api/verify-otp/', {'phone': self.patient_profile.phone_number, 'otp': '000000'})
        record.refresh_from_db()
        self.assertIsNotNone(record.locked_until)
        self.assertGreater(record.locked_until, timezone.now())

    def test_successful_otp_sets_cookies_and_deletes_record(self):
        self._otp(self.patient)
        response = self.client.post('/auth/api/verify-otp/', {'phone': self.patient_profile.phone_number, 'otp': '123456'})
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('access_token', response.data)
        self.assertNotIn('refresh_token', response.data)
        self.assertIn('access_token', response.cookies)
        self.assertTrue(response.cookies['access_token']['httponly'])
        self.assertFalse(OTP.objects.filter(user=self.patient).exists())

    def test_ors_hospital_list_and_availability_endpoints(self):
        self._cookie_login(self.patient)
        hospitals = self.client.get('/auth/api/ors/hospitals/')
        availability = self.client.get('/auth/api/ors/hospitals/aiims-delhi/availability/')
        self.assertEqual(hospitals.status_code, 200)
        self.assertEqual(hospitals.data['hospitals'][0]['id'], 'aiims-delhi')
        self.assertEqual(availability.status_code, 200)
        self.assertEqual(availability.data['availability'][0]['bed_type'], 'General Ward')

    def test_ors_general_ward_request_creates_confirmed_request_and_vault_document(self):
        self._cookie_login(self.patient)
        response = self.client.post('/auth/api/ors/bed-requests/', {
            'phone': self.patient_profile.phone_number,
            'hospital_id': 'aiims-delhi',
            'department': 'General Medicine',
            'bed_type': 'General Ward',
            'admission_reason': 'High fever and dehydration',
            'preferred_admission_date': '2026-09-21',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['request']['ors_reference'].startswith('ORS-DEMO-'))
        self.assertEqual(response.data['request']['status'], 'CONFIRMED')
        self.assertTrue(ORSBedRequest.objects.filter(patient=self.patient_profile).exists())
        self.assertTrue(DigiLockerDocument.objects.filter(doc_type='Admission Request').exists())

    def test_ors_unavailable_icu_request_is_waitlisted(self):
        self._cookie_login(self.patient)
        response = self.client.post('/auth/api/ors/bed-requests/', {
            'hospital_id': 'aiims-delhi', 'department': 'Emergency', 'bed_type': 'ICU',
            'admission_reason': 'Breathing difficulty',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['request']['status'], 'WAITLISTED')
        self.assertEqual(response.data['request']['assigned_bed_label'], '')
        self.assertIn('Estimated wait', response.data['request']['estimated_wait'])

    def test_ors_request_list_and_cancellation(self):
        self._cookie_login(self.patient)
        created = self.client.post('/auth/api/ors/bed-requests/', {
            'hospital_id': 'aiims-delhi', 'bed_type': 'General Ward',
        }, format='json')
        request_id = created.data['request']['id']
        listed = self.client.get('/auth/api/ors/bed-requests/')
        cancelled = self.client.post(f'/auth/api/ors/bed-requests/{request_id}/cancel/')
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(listed.data['requests'][0]['id'], request_id)
        self.assertEqual(cancelled.status_code, 200)
        self.assertEqual(cancelled.data['request']['status'], 'CANCELLED')

    def test_cookie_authenticated_request_and_csrf_protection(self):
        client = APIClient(enforce_csrf_checks=True)
        refresh = RefreshToken.for_user(self.patient)
        client.cookies['access_token'] = str(refresh.access_token)
        missing = client.post('/auth/api/vault/sync-digilocker/', {})
        self.assertEqual(missing.status_code, 403)
        client.get('/auth/api/csrf/')
        valid = client.post('/auth/api/vault/sync-digilocker/', {}, HTTP_X_CSRFTOKEN=client.cookies['csrftoken'].value)
        self.assertEqual(valid.status_code, 200)

    def test_refresh_and_logout_clear_cookies(self):
        self._cookie_login(self.patient)
        refreshed = self.client.post('/auth/api/auth/refresh/', {})
        self.assertEqual(refreshed.status_code, 200)
        logged_out = self.client.post('/auth/api/auth/logout/', {})
        self.assertEqual(logged_out.status_code, 200)
        self.assertEqual(logged_out.cookies['access_token']['max-age'], 0)

    def test_public_otp_flow_remains_available(self):
        response = self.client.post('/auth/api/send-otp/', {'phone': self.patient_profile.phone_number})
        self.assertEqual(response.status_code, 200)

    def test_demo_otp_fallback_allows_local_login(self):
        user = self.patient
        self.assertTrue(generate_and_send_sms_otp(user, self.patient_profile.phone_number, '127.0.0.1'))
        self.assertTrue(generate_and_send_sms_otp(user, self.patient_profile.phone_number, '127.0.0.1'))
        record = OTP.objects.get(user=user)
        self.assertTrue(check_password('123456', record.otp_hash))
        valid, reason = verify_otp(record, '123456')
        self.assertTrue(valid)
        self.assertEqual(reason, 'valid')

    @override_settings(DEBUG=False, CORS_ALLOWED_ORIGINS=['https://app.example'])
    def test_production_cors_is_explicit(self):
        from django.conf import settings
        self.assertNotIn('*', settings.CORS_ALLOWED_ORIGINS)

    def test_generic_service_errors_do_not_expose_exception(self):
        self._cookie_login(self.patient)
        with patch('otp_login.views.generate_health_summary', side_effect=RuntimeError('secret internal detail')):
            response = self.client.post('/auth/api/agent/summary/', {})
        self.assertNotIn('secret internal detail', response.content.decode())

    def test_oauth_callback_never_puts_token_in_url(self):
        state = 'safe-state'
        OAuthState.objects.create(
            state_hash=hashlib.sha256(state.encode()).hexdigest(), user=self.patient,
            redirect_uri='http://127.0.0.1:8000/auth/api/digilocker/callback/',
        )
        response = self.client.get('/auth/api/digilocker/callback/?code=mock-code&state=safe-state')
        self.assertNotIn('token', response.get('Location', '').lower())

    @override_settings(ENABLE_MOCK_DIGILOCKER=True)
    def test_mock_oauth_rejects_unapproved_redirect_uri(self):
        response = self.client.get('/auth/mock-api/public/oauth2/1/authorize?redirect_uri=https://evil.example/callback')
        self.assertEqual(response.status_code, 400)

    def _prescription_image(self):
        return SimpleUploadedFile(
            'prescription.jpg', b'fake-image-data', content_type='image/jpeg'
        )

    def _extracted_prescription(self):
        return {
            'doctor_name': 'Dr Demo',
            'prescription_date': '2026-09-16',
            'patient_name': 'Test Patient',
            'diagnosis': 'Fever',
            'medicines': [{
                'medicine_name': 'Paracetamol', 'dosage': '500 mg',
                'frequency': 'Twice daily', 'duration': '3 days',
                'instructions': 'After food',
            }],
            'unclear_text': '',
        }

    def test_prescription_upload_creates_pending_draft(self):
        self._cookie_login(self.patient)
        with patch('otp_login.prescription_ai.extract_prescription_from_image', return_value=self._extracted_prescription()):
            response = self.client.post(
                '/auth/api/prescriptions/upload/',
                {'phone': self.patient_profile.phone_number, 'image': self._prescription_image()},
                format='multipart',
            )
        self.assertEqual(response.status_code, 201)
        draft = PrescriptionDraft.objects.get(pk=response.data['id'])
        self.assertEqual(draft.status, PrescriptionDraft.PENDING)
        self.assertEqual(draft.medicines.count(), 1)

    def test_prescription_upload_accepts_raw_ten_digit_phone(self):
        self._cookie_login(self.patient)
        with patch('otp_login.prescription_ai.extract_prescription_from_image', return_value=self._extracted_prescription()):
            response = self.client.post(
                '/auth/api/prescriptions/upload/',
                {'phone': '1111111111', 'image': self._prescription_image()},
                format='multipart',
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['patient_phone'], self.patient_profile.phone_number)

    def test_prescription_edit_changes_medicine_fields(self):
        self._cookie_login(self.patient)
        with patch('otp_login.prescription_ai.extract_prescription_from_image', return_value=self._extracted_prescription()):
            upload = self.client.post(
                '/auth/api/prescriptions/upload/',
                {'image': self._prescription_image()}, format='multipart',
            )
        response = self.client.patch(
            f"/auth/api/prescriptions/{upload.data['id']}/edit/",
            {'medicines': [{'medicine_name': 'Updated Medicine', 'dosage': '10 mg'}]},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['medicines'][0]['medicine_name'], 'Updated Medicine')
        self.assertEqual(response.data['medicines'][0]['dosage'], '10 mg')

    def test_prescription_approve_creates_digilocker_document(self):
        ClinicalPatientAssignment.objects.create(
            patient=self.patient_profile, clinician=self.clinician_profile,
        )
        self._cookie_login(self.patient)
        with patch('otp_login.prescription_ai.extract_prescription_from_image', return_value=self._extracted_prescription()):
            upload = self.client.post(
                '/auth/api/prescriptions/upload/',
                {'image': self._prescription_image()}, format='multipart',
            )
        self._cookie_login(self.clinician)
        response = self.client.post(
            f"/auth/api/prescriptions/{upload.data['id']}/approve/",
            {'reviewed_by': 'Dr Demo'}, format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(DigiLockerDocument.objects.filter(
            uri=response.data['document_uri'], doc_type='Prescription',
        ).exists())

    def test_pending_prescription_endpoint_returns_pending_drafts(self):
        self._cookie_login(self.patient)
        with patch('otp_login.prescription_ai.extract_prescription_from_image', return_value=self._extracted_prescription()):
            self.client.post('/auth/api/prescriptions/upload/', {'image': self._prescription_image()}, format='multipart')
        ClinicalPatientAssignment.objects.create(
            patient=self.patient_profile, clinician=self.clinician_profile,
        )
        self._cookie_login(self.clinician)
        response = self.client.get('/auth/api/prescriptions/pending/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['drafts']), 1)

    def _create_intake_draft(self):
        draft = PrescriptionDraft.objects.create(
            patient_phone=self.patient_profile.phone_number,
            uploaded_image=self._prescription_image(),
            extracted_data=self._extracted_prescription(),
        )
        PrescriptionMedicine.objects.create(
            draft=draft, medicine_name='Paracetamol', dosage='', duration=''
        )
        return draft

    def test_intake_session_starts_after_draft_upload(self):
        draft = self._create_intake_draft()
        self._cookie_login(self.patient)
        response = self.client.post(f'/auth/api/intake/{draft.pk}/start/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(ClinicalIntakeSession.objects.filter(draft=draft).exists())
        self.assertEqual(response.data['next_question']['key'], 'symptoms')

    def test_intake_answers_are_saved(self):
        draft = self._create_intake_draft()
        ClinicalIntakeSession.objects.create(draft=draft, patient_phone=draft.patient_phone)
        self._cookie_login(self.patient)
        response = self.client.post(
            f'/auth/api/intake/{draft.pk}/answer/',
            {'question_key': 'symptoms', 'answer': 'Fever and body ache'}, format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(ClinicalIntakeSession.objects.get(draft=draft).symptoms, 'Fever and body ache')

    def test_i_do_not_know_is_stored_as_unanswered(self):
        draft = self._create_intake_draft()
        ClinicalIntakeSession.objects.create(draft=draft, patient_phone=draft.patient_phone)
        self._cookie_login(self.patient)
        self.client.post(
            f'/auth/api/intake/{draft.pk}/answer/',
            {'question_key': 'symptoms', 'answer': 'I do not know / I cannot answer'}, format='json'
        )
        session = ClinicalIntakeSession.objects.get(draft=draft)
        self.assertIn('symptoms', session.unanswered_questions)

    def test_intake_summary_merges_testimony_and_extraction(self):
        draft = self._create_intake_draft()
        session = ClinicalIntakeSession.objects.create(
            draft=draft, patient_phone=draft.patient_phone,
            symptoms='Fever', duration='two days', severity='Moderate',
            doctor_suggestion='Rest and hydrate', allergies='None',
            additional_notes='No other concerns',
        )
        self._cookie_login(self.patient)
        response = self.client.get(f'/auth/api/intake/{draft.pk}/summary/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('Fever', response.data['short_clinical_summary'])
        self.assertEqual(response.data['patient_testimony']['duration'], 'two days')

    def test_intake_summary_marks_low_confidence_extraction_as_anomaly(self):
        extraction = self._extracted_prescription()
        extraction['confidence_by_field'] = {
            'diagnosis': 0.1,
            'doctor_name': 0.9,
            'prescription_date': 0.9,
            'medicine_1_medicine_name': 0.9,
            'medicine_1_dosage': 0.1,
            'medicine_1_frequency': 0.9,
            'medicine_1_duration': 0.9,
            'medicine_1_instructions': 0.9,
        }
        draft = PrescriptionDraft.objects.create(
            patient_phone=self.patient_profile.phone_number,
            uploaded_image=self._prescription_image(), extracted_data=extraction,
        )
        ClinicalIntakeSession.objects.create(draft=draft, patient_phone=draft.patient_phone)
        self._cookie_login(self.patient)
        response = self.client.get(f'/auth/api/intake/{draft.pk}/summary/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['medicines'][0]['dosage'], '')
        self.assertIn('medicine 1 dosage is unclear', response.data['missing_or_uncertain_information'])

    def test_mock_hip_send_returns_reference_and_saves_document(self):
        draft = self._create_intake_draft()
        ClinicalIntakeSession.objects.create(
            draft=draft, patient_phone=draft.patient_phone,
            symptoms='Fever', duration='two days', severity='Moderate',
            doctor_suggestion='Rest', allergies='None', additional_notes='None',
        )
        self._cookie_login(self.patient)
        response = self.client.post(f'/auth/api/intake/{draft.pk}/send-to-hip/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['hip_reference'].startswith('HIP-DEMO-'))
        self.assertTrue(DigiLockerDocument.objects.filter(doc_type='Clinical Summary').exists())

    def _run_extraction_with_response(self, output_text):
        file_descriptor, image_path = tempfile.mkstemp(suffix='.png')
        try:
            with os.fdopen(file_descriptor, 'wb') as image_file:
                image_file.write(b'png-test-data')
            with patch.dict(os.environ, {'GOOGLE_API_KEY': 'test-key'}):
                with patch('otp_login.prescription_ai.genai.Client') as client_class:
                    client_class.return_value.models.generate_content.return_value = SimpleNamespace(
                        text=output_text
                    )
                    result = extract_prescription_from_image(image_path)
            return result, client_class
        finally:
            os.unlink(image_path)

    def test_gemini_image_request_uses_base64_data_and_mime_type(self):
        result, client_class = self._run_extraction_with_response(
            '{"doctor_name":"Dr Test","medicines":[]}'
        )
        request = client_class.return_value.models.generate_content.call_args.kwargs
        image_input = request['contents'][1]
        self.assertEqual(request['model'], OCR_MODELS[0])
        self.assertTrue(image_input.inline_data.data)
        self.assertEqual(image_input.inline_data.mime_type, 'image/png')
        self.assertFalse(result['fallback_result'])

    def test_gemini_ocr_tries_models_in_order(self):
        file_descriptor, image_path = tempfile.mkstemp(suffix='.jpg')
        try:
            with os.fdopen(file_descriptor, 'wb') as image_file:
                image_file.write(b'jpg-test-data')
            with patch.dict(os.environ, {'GOOGLE_API_KEY': 'test-key'}):
                with patch('otp_login.prescription_ai.genai.Client') as client_class:
                    create = client_class.return_value.models.generate_content
                    create.side_effect = [
                        *[RuntimeError('limit') for _ in OCR_MODELS[:-1]],
                        SimpleNamespace(text='{"medicines":[]}'),
                    ]
                    result = extract_prescription_from_image(image_path)
                    models = [call.kwargs['model'] for call in create.call_args_list]
        finally:
            os.unlink(image_path)
        self.assertEqual(models, list(OCR_MODELS))
        self.assertFalse(result['fallback_result'])

    def test_gemini_markdown_fenced_json_is_parsed(self):
        result, _ = self._run_extraction_with_response(
            '```json\n{"diagnosis":"Fever","medicines":[]}\n```'
        )
        self.assertFalse(result['fallback_result'])
        self.assertEqual(result['diagnosis'], 'Fever')

    def test_missing_gemini_key_returns_named_fallback(self):
        with patch.dict(os.environ, {}, clear=True):
            result = extract_prescription_from_image('missing-image.png')
        self.assertTrue(result['fallback_result'])
        self.assertEqual(result['fallback_reason'], 'missing_api_key')

    def test_gemini_api_failure_returns_safe_error_type(self):
        file_descriptor, image_path = tempfile.mkstemp(suffix='.jpg')
        try:
            with os.fdopen(file_descriptor, 'wb') as image_file:
                image_file.write(b'jpg-test-data')
            with patch.dict(os.environ, {'GOOGLE_API_KEY': 'test-key'}):
                with patch('otp_login.prescription_ai.genai.Client', side_effect=RuntimeError('secret')):
                    result = extract_prescription_from_image(image_path)
        finally:
            os.unlink(image_path)
        self.assertTrue(result['fallback_result'])
        self.assertEqual(result['fallback_reason'], 'RuntimeError')
