"""Centralized configuration.

The backend is designed to run fully offline with safe defaults (SQLite +
local filesystem storage + dev auth) so it is independently testable, while
being able to target Supabase PostgreSQL / Storage / Auth purely via env vars.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # ── App ──────────────────────────────────────────────────────
    app_env: Literal["development", "test", "production"] = "development"
    app_name: str = "ANCP Backend"
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:3000"

    # ── Database ─────────────────────────────────────────────────
    database_url: str = ""

    # ── Supabase ─────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_jwt_audience: str = "authenticated"

    # ── Storage ──────────────────────────────────────────────────
    storage_backend: Literal["local", "supabase"] = "local"
    storage_local_dir: str = "./var/storage"
    storage_bucket_configs: str = "ancp-configurations"
    storage_bucket_reports: str = "ancp-reports"

    # ── Auth ─────────────────────────────────────────────────────
    auth_mode: Literal["dev", "supabase"] = "dev"
    dev_api_token: str = "dev-local-token"
    dev_org_slug: str = "acme-netops"
    dev_user_email: str = "analyst@acme.example"
    dev_user_role: str = "ADMIN"

    # ── AI ───────────────────────────────────────────────────────
    ai_provider: str = "local"
    ai_api_key: str = ""
    ai_model: str = ""
    ai_embedding_model: str = ""

    # ── Jobs ─────────────────────────────────────────────────────
    job_backend: Literal["inline", "celery"] = "inline"
    redis_url: str = ""

    # ── Uploads ──────────────────────────────────────────────────
    max_upload_bytes: int = 1_048_576
    allowed_config_extensions: str = ".txt,.cfg,.conf"

    # ── Rate limiting ────────────────────────────────────────────
    rate_limit_default: str = "120/60"
    rate_limit_upload: str = "10/60"
    rate_limit_analyze: str = "20/60"
    rate_limit_report: str = "10/60"

    # ── Derived helpers ──────────────────────────────────────────
    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_extensions(self) -> set[str]:
        return {
            e.strip().lower()
            for e in self.allowed_config_extensions.split(",")
            if e.strip()
        }

    @property
    def effective_database_url(self) -> str:
        """Return the configured DB URL, or a local SQLite fallback."""
        if self.database_url:
            return self.database_url
        # Offline default keeps the app runnable without Supabase.
        db_path = Path("./var/ancp.db").resolve()
        db_path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{db_path.as_posix()}"

    @property
    def is_sqlite(self) -> bool:
        return self.effective_database_url.startswith("sqlite")

    @field_validator("cors_origins")
    @classmethod
    def _no_wildcard_in_prod(cls, v: str, info) -> str:
        # Guard against the insecure allow-all origin in production.
        env = info.data.get("app_env", "development")
        if env == "production" and v.strip() == "*":
            raise ValueError("CORS wildcard '*' is not permitted in production")
        return v

    def rate_limit(self, key: str) -> tuple[int, int]:
        """Parse a 'count/seconds' rate-limit string into (count, window)."""
        raw = getattr(self, f"rate_limit_{key}", self.rate_limit_default)
        count, window = raw.split("/")
        return int(count), int(window)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
