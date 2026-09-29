"""Storage backend abstraction.

Two implementations behind one interface so business logic never calls the
Supabase Storage API directly:
  * LocalStorage    — filesystem under STORAGE_LOCAL_DIR (offline default)
  * SupabaseStorage — Supabase Storage buckets via REST (used when configured)

Configuration bytes are stored already-sanitized where required; signed URLs
are used for downloads in the Supabase backend.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import settings
from app.core.exceptions import StorageError


class StorageBackend(ABC):
    @abstractmethod
    def put(self, bucket: str, key: str, data: bytes, content_type: str) -> str:
        """Store bytes; return the storage path/key."""

    @abstractmethod
    def get(self, bucket: str, key: str) -> bytes:
        ...

    @abstractmethod
    def delete(self, bucket: str, key: str) -> None:
        ...

    @abstractmethod
    def signed_url(self, bucket: str, key: str, expires_in: int = 3600) -> str:
        ...


class LocalStorage(StorageBackend):
    def __init__(self, base_dir: str) -> None:
        self.base = Path(base_dir)
        self.base.mkdir(parents=True, exist_ok=True)

    def _path(self, bucket: str, key: str) -> Path:
        p = self.base / bucket / key
        p.parent.mkdir(parents=True, exist_ok=True)
        return p

    def put(self, bucket: str, key: str, data: bytes, content_type: str) -> str:
        self._path(bucket, key).write_bytes(data)
        return f"{bucket}/{key}"

    def get(self, bucket: str, key: str) -> bytes:
        p = self._path(bucket, key)
        if not p.exists():
            raise StorageError(f"Object not found: {bucket}/{key}", status_code=404)
        return p.read_bytes()

    def delete(self, bucket: str, key: str) -> None:
        p = self._path(bucket, key)
        if p.exists():
            p.unlink()

    def signed_url(self, bucket: str, key: str, expires_in: int = 3600) -> str:
        # Local backend returns a file:// style pseudo-URL (no network).
        return f"local://{bucket}/{key}"


class SupabaseStorage(StorageBackend):
    """Supabase Storage via REST. Used only when STORAGE_BACKEND=supabase."""

    def __init__(self) -> None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise StorageError("Supabase storage not configured")
        self.base_url = settings.supabase_url.rstrip("/")
        self.key = settings.supabase_service_role_key

    def _headers(self, content_type: str | None = None) -> dict[str, str]:
        h = {"Authorization": f"Bearer {self.key}", "apikey": self.key}
        if content_type:
            h["Content-Type"] = content_type
        return h

    def put(self, bucket: str, key: str, data: bytes, content_type: str) -> str:
        import httpx

        url = f"{self.base_url}/storage/v1/object/{bucket}/{key}"
        resp = httpx.post(url, content=data,
                          headers={**self._headers(content_type), "x-upsert": "true"})
        if resp.status_code >= 300:
            raise StorageError("Supabase upload failed", status_code=502)
        return f"{bucket}/{key}"

    def get(self, bucket: str, key: str) -> bytes:
        import httpx

        url = f"{self.base_url}/storage/v1/object/{bucket}/{key}"
        resp = httpx.get(url, headers=self._headers())
        if resp.status_code >= 300:
            raise StorageError("Supabase download failed", status_code=502)
        return resp.content

    def delete(self, bucket: str, key: str) -> None:
        import httpx

        url = f"{self.base_url}/storage/v1/object/{bucket}/{key}"
        httpx.delete(url, headers=self._headers())

    def signed_url(self, bucket: str, key: str, expires_in: int = 3600) -> str:
        import httpx

        url = f"{self.base_url}/storage/v1/object/sign/{bucket}/{key}"
        resp = httpx.post(url, json={"expiresIn": expires_in}, headers=self._headers("application/json"))
        if resp.status_code >= 300:
            raise StorageError("Supabase sign failed", status_code=502)
        signed = resp.json().get("signedURL", "")
        return f"{self.base_url}/storage/v1{signed}"


def get_storage() -> StorageBackend:
    if settings.storage_backend == "supabase":
        return SupabaseStorage()
    return LocalStorage(settings.storage_local_dir)
