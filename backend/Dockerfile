# ANCP Backend — Phase 2
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps kept minimal; psycopg[binary] ships its own libpq.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

# Non-root runtime user.
RUN useradd --create-home --uid 10001 ancp \
    && mkdir -p /app/var/storage \
    && chown -R ancp:ancp /app
USER ancp

EXPOSE 8000

# Readiness/liveness handled by the app at /api/v1/health.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
