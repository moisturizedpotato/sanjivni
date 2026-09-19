import logging

from rest_framework.permissions import BasePermission

from .models import ClinicalPatientAssignment, UserProfile


logger = logging.getLogger('otp_login.security')


def _profile_for_user(user):
    if not user or not user.is_authenticated:
        return None
    try:
        return user.userprofile
    except UserProfile.DoesNotExist:
        return None


def can_access_patient_record(user, profile):
    """Return whether user has an ownership, admin, or active assignment grant."""
    user_profile = _profile_for_user(user)
    if not user_profile or not profile:
        return False
    if user_profile.user_id == profile.user_id:
        return True
    if user_profile.role == UserProfile.ADMIN and user.has_perm('otp_login.view_userprofile'):
        return True
    if user_profile.role == UserProfile.CLINICIAN:
        return ClinicalPatientAssignment.objects.filter(
            patient=profile, clinician=user_profile, active=True,
        ).exists()
    if user_profile.role == UserProfile.ASSISTANT:
        return ClinicalPatientAssignment.objects.filter(
            patient=profile, assistant=user_profile, active=True,
        ).exists()
    return False


def log_access_decision(request, action, target_profile, allowed):
    user = getattr(request, 'user', None)
    user_profile = _profile_for_user(user)
    logger.info(
        'security_access_decision user_id=%s role=%s action=%s '
        'target_profile_id=%s allowed=%s',
        getattr(user, 'id', None),
        getattr(user_profile, 'role', None),
        action,
        getattr(target_profile, 'pk', None),
        allowed,
    )


class IsPatient(BasePermission):
    def has_permission(self, request, view):
        profile = _profile_for_user(request.user)
        allowed = bool(profile and profile.role == UserProfile.PATIENT)
        log_access_decision(request, view.__class__.__name__, profile, allowed)
        return allowed


class IsAssistant(BasePermission):
    def has_permission(self, request, view):
        profile = _profile_for_user(request.user)
        allowed = bool(profile and profile.role == UserProfile.ASSISTANT)
        log_access_decision(request, view.__class__.__name__, profile, allowed)
        return allowed


class IsClinician(BasePermission):
    def has_permission(self, request, view):
        profile = _profile_for_user(request.user)
        allowed = bool(profile and profile.role == UserProfile.CLINICIAN)
        log_access_decision(request, view.__class__.__name__, profile, allowed)
        return allowed


class IsClinicalStaff(BasePermission):
    def has_permission(self, request, view):
        profile = _profile_for_user(request.user)
        allowed = bool(profile and profile.role in {
            UserProfile.ASSISTANT,
            UserProfile.CLINICIAN,
            UserProfile.ADMIN,
        })
        log_access_decision(request, view.__class__.__name__, profile, allowed)
        return allowed


class IsOwnerOrClinicalStaff(BasePermission):
    def has_permission(self, request, view):
        profile = _profile_for_user(request.user)
        allowed = bool(profile)
        log_access_decision(request, view.__class__.__name__, profile, allowed)
        return allowed

    def has_object_permission(self, request, view, obj):
        target_profile = obj if isinstance(obj, UserProfile) else None
        allowed = can_access_patient_record(request.user, target_profile)
        log_access_decision(request, view.__class__.__name__, target_profile, allowed)
        return allowed