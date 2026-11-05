from django.contrib.auth.hashers import check_password, make_password  # noqa: F401 (views.py ishlatadi)
from django.core import signing
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import BasePermission

from .models import Account, Student

SALT = "mystra-token"
MAX_AGE = 7 * 86400


def make_token(user_id, role):
    return signing.dumps({"id": user_id, "role": role}, salt=SALT)


class AuthUser:
    """DRF request.user sifatida ishlaydi."""
    is_authenticated = True

    def __init__(self, obj, role):
        self.obj, self.role, self.id, self.name = obj, role, obj.id, obj.name


class TokenAuth(BaseAuthentication):
    def authenticate_header(self, request):
        return "Bearer"  # shu sababli autentifikatsiyasiz so'rovga 401 qaytadi (403 emas)

    def authenticate(self, request):
        tok = request.headers.get("Authorization", "").removeprefix("Bearer ").strip() or request.query_params.get("token", "")
        if not tok:
            return None
        try:
            p = signing.loads(tok, salt=SALT, max_age=MAX_AGE)
        except signing.BadSignature:
            raise AuthenticationFailed("Kirish kerak")
        obj = (Student if p["role"] == "student" else Account).objects.filter(id=p["id"]).first()
        if not obj:
            raise AuthenticationFailed("Akkaunt topilmadi")
        return AuthUser(obj, p["role"]), tok


def role_permission(roles):
    class RolePermission(BasePermission):
        def has_permission(self, request, view):
            return bool(getattr(request.user, "role", None) in roles)

    return RolePermission
