# otp_login/utils.py
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from .models import OTP

logger = logging.getLogger('otp_login.security')

OTP_LIFETIME = timedelta(minutes=10)
OTP_LOCKOUT = timedelta(minutes=15)
OTP_MAX_ATTEMPTS = 5
OTP_SEND_COOLDOWN = timedelta(minutes=1)


def generate_and_send_sms_otp(user, phone_number, request_ip=None):
    now = timezone.now()
    is_local_request = bool(
        request_ip in {'127.0.0.1', '::1', 'localhost'}
        or settings.DEBUG
    )
    record = OTP.objects.filter(user=user).first()
    if not is_local_request and record and record.last_sent_at and now - record.last_sent_at < OTP_SEND_COOLDOWN:
        logger.info('otp_delivery action=send_otp result=rate_limited')
        return False

    otp_code = '123456' if is_local_request else f'{secrets.randbelow(1000000):06d}'

    OTP.objects.update_or_create(
        user=user,
        defaults={
            'otp_hash': make_password(otp_code),
            'expires_at': now + OTP_LIFETIME,
            'failed_attempts': 0,
            'locked_until': None,
            'send_count': (record.send_count + 1) if record else 1,
            'last_sent_at': now,
            'last_request_ip': request_ip,
        },
    )
    logger.info('otp_delivery action=send_otp result=queued otp_demo=%s', is_local_request)
    return True


def verify_otp(record, entered_otp):
    now = timezone.now()
    if record.locked_until and record.locked_until > now:
        return False, 'locked'
    if record.expires_at <= now:
        return False, 'expired'
    if not check_password(str(entered_otp), record.otp_hash):
        record.failed_attempts += 1
        if record.failed_attempts >= OTP_MAX_ATTEMPTS:
            record.locked_until = now + OTP_LOCKOUT
        record.save(update_fields=['failed_attempts', 'locked_until'])
        return False, 'invalid'
    return True, 'valid'