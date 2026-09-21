import base64
import json
import logging
import mimetypes
import os
import re

from google import genai
from google.genai import types as genai_types


logger = logging.getLogger('otp_login.security')

OCR_MODELS = tuple(
    model.strip()
    for model in os.getenv(
        'GOOGLE_OCR_MODELS',
        'gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.0-flash',
    ).split(',')
    if model.strip()
)


def _is_rate_limit_error(exc):
    message = str(exc).lower()
    return any(value in message for value in (
        '429', 'rate limit', 'rate_limit', 'resource exhausted', 'quota',
    ))

SCHEMA = {
    'doctor_name': '',
    'prescription_date': '',
    'patient_name': '',
    'diagnosis': '',
    'medicines': [],
    'unclear_text': '',
    'image_quality': 'clear',
    'reupload_required': False,
    'reupload_reason': '',
    'confidence_by_field': {},
    'overall_confidence': 0.0,
}
CLINICAL_CONFIDENCE_THRESHOLD = 0.25


def _confidence_value(value):
    try:
        return max(0.0, min(1.0, float(value)))
    except (TypeError, ValueError):
        return 0.0


def _fallback(reason='unavailable'):
    result = dict(SCHEMA)
    result['unclear_text'] = 'Prescription extraction failed; no clinical data was accepted.'
    result['fallback_result'] = True
    result['fallback_reason'] = reason
    result['upload_allowed'] = False
    result['provider_attempts'] = []
    return result


def _normalise(data):
    result = {key: data.get(key, '') for key in SCHEMA if key != 'medicines'}
    result['medicines'] = []
    confidence = data.get('confidence_by_field', {})
    result['confidence_by_field'] = {
        str(key): _confidence_value(value)
        for key, value in confidence.items()
        if isinstance(value, (int, float, str)) and str(value).strip()
    }
    result['overall_confidence'] = _confidence_value(data.get('overall_confidence', 0))
    for index, medicine in enumerate(data.get('medicines', []), 1):
        if isinstance(medicine, dict):
            item_confidence = medicine.get('confidence_by_field', {}) or {}
            item = {
                field: (
                    str(medicine.get(field, '') or '')
                    if _confidence_value(
                        item_confidence.get(
                            field, confidence.get(f'medicine_{index}_{field}', 0.0)
                        )
                    ) >= CLINICAL_CONFIDENCE_THRESHOLD
                    else ''
                )
                for field in ('medicine_name', 'dosage', 'frequency', 'duration', 'instructions')
            }
            for field, value in item_confidence.items():
                if isinstance(value, (int, float, str)) and str(value).strip():
                    result['confidence_by_field'][f'medicine_{index}_{field}'] = _confidence_value(value)
            result['medicines'].append(item)
    return result


def extract_prescription_from_image(image_path):
    """Extract prescription fields using the configured Gemini model fallback chain."""
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        logger.info('prescription_extraction action=extract result=fallback reason=missing_api_key')
        return _fallback('missing_api_key')

    try:
        mime_type = mimetypes.guess_type(image_path)[0] or 'image/jpeg'
        with open(image_path, 'rb') as image_file:
            image_b64 = base64.b64encode(image_file.read()).decode('utf-8')
        prompt = '''Read this handwritten doctor prescription for a hackathon demo.
Return valid JSON only using exactly this schema:
{"doctor_name":"","prescription_date":"","patient_name":"","diagnosis":"","medicines":[{"medicine_name":"","dosage":"","frequency":"","duration":"","instructions":"","confidence_by_field":{"medicine_name":0.0,"dosage":0.0,"frequency":0.0,"duration":0.0,"instructions":0.0}}],"unclear_text":"","image_quality":"clear|blurry|clipped|unreadable","reupload_required":false,"reupload_reason":"","confidence_by_field":{"doctor_name":0.0,"prescription_date":0.0,"patient_name":0.0,"diagnosis":0.0},"overall_confidence":0.0}
Use confidence values from 0.0 to 1.0. A value below 0.25 means the field is unclear and must not be treated as extracted data.
Do not invent unreadable values. Use empty strings for unreadable fields. Put uncertainty in unclear_text.
Detect cropped, clipped, blurry, dark, or unreadable areas. If crucial medicine, dose, date, or advice text is not visible, set reupload_required true and explain why in reupload_reason.
Do not use Markdown code fences. Do not include explanatory text before or after JSON.'''
        timeout_ms = int(os.getenv('GOOGLE_OCR_TIMEOUT_MS', '15000'))
        client = genai.Client(
            api_key=api_key,
            http_options=genai_types.HttpOptions(
                timeout=timeout_ms,
                retry_options=genai_types.HttpRetryOptions(attempts=1),
            ),
        )
        attempts = []
        request_input = [
            {'type': 'text', 'text': prompt},
            {'type': 'image', 'data': image_b64, 'mime_type': mime_type},
        ]
        for model in OCR_MODELS:
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=[
                        prompt,
                        genai_types.Part.from_bytes(data=base64.b64decode(image_b64), mime_type=mime_type),
                    ],
                )
                raw_text = response.text or ''
                cleaned = re.sub(r'^\s*```(?:json)?\s*|\s*```\s*$', '', raw_text.strip(), flags=re.IGNORECASE)
                object_match = re.search(r'\{.*\}', cleaned, flags=re.DOTALL)
                if not object_match:
                    raise ValueError('No JSON object in Gemini response')
                data = json.loads(object_match.group(0))
                result = _normalise(data)
                result['fallback_result'] = False
                result['fallback_reason'] = ''
                result['upload_allowed'] = True
                result['provider'] = model
                result['provider_attempts'] = attempts + [model]
                logger.info('prescription_extraction action=extract result=success model=%s', model)
                return result
            except Exception as exc:
                attempts.append(model)
                logger.warning(
                    'prescription_extraction action=provider_failed model=%s error_type=%s',
                    model, type(exc).__name__,
                )
        result = _fallback('all_providers_failed')
        result['provider_attempts'] = attempts
        result['error'] = 'Prescription OCR is temporarily unavailable. Please try again later.'
        return result
    except Exception as exc:
        logger.warning(
            'prescription_extraction action=extract result=fallback error_type=%s',
            type(exc).__name__,
        )
        result = _fallback(type(exc).__name__)
        result['error'] = 'Prescription OCR could not read this file.'
        return result


def generate_prescription_summary(extraction, testimony, language='English'):
    """Ask the same provider chain for a concise, uncertainty-aware summary."""
    payload = json.dumps({'extraction': extraction, 'patient_answers': testimony}, ensure_ascii=False)
    prompt = f'''Create a clinical prescription summary in {language} from this JSON.
Return valid JSON only with keys summary, anomalies, confidence_notes.
Do not invent values. Mention conflicts or unreadable fields as anomalies.
{payload}'''
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        return {'summary': '', 'anomalies': ['AI summary unavailable: missing API key'], 'confidence_notes': {}}
    timeout_ms = int(os.getenv('GOOGLE_SUMMARY_TIMEOUT_MS', '3000'))
    client = genai.Client(
        api_key=api_key,
        http_options=genai_types.HttpOptions(
            timeout=timeout_ms,
            retry_options=genai_types.HttpRetryOptions(attempts=1),
        ),
    )
    for model in OCR_MODELS:
        try:
            response = client.interactions.create(
                model=model,
                input=[{'type': 'text', 'text': prompt}],
            )
            raw_text = str(getattr(response, 'output_text', '') or '').strip()
            match = re.search(r'\{.*\}', raw_text, flags=re.DOTALL)
            result = json.loads(match.group(0)) if match else {
                'summary': raw_text,
                'anomalies': [],
                'confidence_notes': {},
            }
            return {
                'summary': str(result.get('summary', '') or ''),
                'anomalies': list(result.get('anomalies', []) or []),
                'confidence_notes': dict(result.get('confidence_notes', {}) or {}),
                'provider': model,
            }
        except Exception as exc:
            logger.warning('prescription_summary action=provider_failed model=%s error_type=%s', model, type(exc).__name__)
    return {
        'summary': '',
        'anomalies': ['AI summary unavailable after all providers failed'],
        'confidence_notes': {},
    }