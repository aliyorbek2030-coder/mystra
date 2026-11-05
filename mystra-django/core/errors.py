import logging

from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import APIException, AuthenticationFailed, NotAuthenticated, PermissionDenied
from rest_framework.response import Response

log = logging.getLogger("mystra")


class ApiError(APIException):
    """E(status, "xabar") -> {"error": "xabar"} va shu HTTP status."""

    def __init__(self, code, message):
        self.status_code = code
        super().__init__(message)


def E(code, message):
    return ApiError(code, message)


def handler(exc, context):
    if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        return Response({"error": "Kirish kerak"}, status=status.HTTP_401_UNAUTHORIZED)
    if isinstance(exc, PermissionDenied):
        return Response({"error": "Ruxsat yo'q"}, status=status.HTTP_403_FORBIDDEN)
    if isinstance(exc, Http404):
        return Response({"error": "Topilmadi"}, status=status.HTTP_404_NOT_FOUND)
    if isinstance(exc, APIException):
        detail = exc.detail
        msg = detail if isinstance(detail, str) else str(detail)
        return Response({"error": msg}, status=exc.status_code)
    log.exception("Kutilmagan xato", exc_info=exc)
    return Response({"error": "Server xatosi"}, status=500)
