import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Security
# Uses AUTH_SECRET from the environment if available.
# Otherwise, uses a fallback for local development.
SECRET_KEY = os.environ.get(
    "AUTH_SECRET",
    "mystra-local-dev-secret-change-before-production-2026"
)

if len(SECRET_KEY) < 16:
    raise RuntimeError("AUTH_SECRET must be at least 16 characters")

# General configuration
DEBUG = os.environ.get("DEBUG", "0") == "1"

ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get(
        "ALLOWED_HOSTS", "localhost,127.0.0.1"
    ).split(",")
    if h.strip()
]

# Render.com avtomatik beradigan domen (masalan mystra.onrender.com)
RENDER_HOST = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
if RENDER_HOST:
    ALLOWED_HOSTS.append(RENDER_HOST)

CSRF_TRUSTED_ORIGINS = [f"https://{h}" for h in ALLOWED_HOSTS if h not in ("localhost", "127.0.0.1")]

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

# Applications
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    'corsheaders',
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "core",
]

# Middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
# URL configuration
ROOT_URLCONF = "config.urls"

# Templates
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database configuration
# 1) DATABASE_URL (Neon / Render / boshqa PostgreSQL) — hostingda
# 2) DB_NAME ... — o'z serveringizdagi PostgreSQL
# 3) aks holda SQLite (kompyuterda sinov uchun)
if os.environ.get("DATABASE_URL"):
    from urllib.parse import parse_qs, unquote, urlparse

    _u = urlparse(os.environ["DATABASE_URL"])
    _q = {k: v[0] for k, v in parse_qs(_u.query).items()}
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": unquote(_u.path.lstrip("/")),
            "USER": unquote(_u.username or ""),
            "PASSWORD": unquote(_u.password or ""),
            "HOST": _u.hostname or "",
            "PORT": str(_u.port or 5432),
            "CONN_MAX_AGE": 60,
            "CONN_HEALTH_CHECKS": True,
            # Neon "-pooler" (PgBouncer) bilan server kursorlari ishlamaydi
            "DISABLE_SERVER_SIDE_CURSORS": True,
            "OPTIONS": {"sslmode": _q.get("sslmode", "require")},
        }
    }
elif os.environ.get("DB_NAME"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ["DB_NAME"],
            "USER": os.environ.get("DB_USER", ""),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ.get("DB_HOST", "localhost"),
            "PORT": os.environ.get("DB_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": os.environ.get(
                "DB_PATH",
                BASE_DIR / "data" / "mystra.sqlite3",
            ),
        }
    }

# Default primary key
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Internationalization
LANGUAGE_CODE = "uz"
TIME_ZONE = "Asia/Tashkent"
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
}

# React build (npm run build) shu papkaga tushadi; WhiteNoise uni sayt ildizidan beradi
FRONTEND_DIST = BASE_DIR / "frontend_dist"
WHITENOISE_ROOT = FRONTEND_DIST if FRONTEND_DIST.exists() else None

# Uploads
UPLOAD_DIR = Path(
    os.environ.get("UPLOAD_DIR", BASE_DIR / "data" / "uploads")
)

(BASE_DIR / "data").mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "core.auth.TokenAuth",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
    ],
    "EXCEPTION_HANDLER": "core.errors.handler",
}

# Request limits
DATA_UPLOAD_MAX_MEMORY_SIZE = 14 * 1024 * 1024

# Security
SECURE_CONTENT_TYPE_NOSNIFF = True
if RENDER_HOST or os.environ.get("HTTPS") == "1":
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# Cache
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

CORS_ALLOWED_ORIGINS = ALLOWED_ORIGINS  # .env dagi ALLOWED_ORIGINS dan olinadi

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}