from django.conf import settings
from django.contrib import admin
from django.http import FileResponse, HttpResponse
from django.urls import include, path, re_path


def spa(request, *args, **kwargs):
    """React sahifalari: /login, /overview ... hammasi index.html ni oladi."""
    index = settings.FRONTEND_DIST / "index.html"
    if not index.exists():
        return HttpResponse("Frontend hali build qilinmagan (npm run build).", status=404, content_type="text/plain; charset=utf-8")
    resp = FileResponse(open(index, "rb"), content_type="text/html; charset=utf-8")
    resp["Cache-Control"] = "no-cache"
    return resp


urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("core.urls")),
    re_path(r"^(?!api/|uploads/|admin/|static/).*$", spa),
]
