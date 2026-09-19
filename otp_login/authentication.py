from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.middleware.csrf import CsrfViewMiddleware


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get('access_token')
        if not raw_token:
            return super().authenticate(request)

        reason = CsrfViewMiddleware(lambda _: None).process_view(
            request._request, None, (), {}
        )
        if reason:
            raise PermissionDenied('CSRF validation failed')
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token