"""Configuration query service + simulated live-connection test.

Phase 2 does NOT open real SSH connections and never stores credentials.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.configuration import Configuration
from app.repositories.configuration_repository import ConfigurationRepository
from app.schemas.configurations import ConnectionTestRequest, ConnectionTestResult


class ConfigurationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ConfigurationRepository(db)

    def list(self, org_id: str, *, filters: dict, offset: int, limit: int):
        return self.repo.list(org_id, filters=filters, offset=offset, limit=limit)

    def get(self, org_id: str, config_id: str) -> Configuration:
        cfg = self.repo.get(org_id, config_id)
        if not cfg:
            raise NotFoundError("Configuration not found")
        return cfg

    def normalized(self, org_id: str, config_id: str):
        self.get(org_id, config_id)  # tenant check
        nc = self.repo.get_normalized(org_id, config_id)
        facts = self.repo.facts(org_id, config_id)
        return nc, facts

    def test_connection(self, req: ConnectionTestRequest) -> ConnectionTestResult:
        if not req.hostname or not req.username:
            return ConnectionTestResult(ok=False, message="Hostname and username are required.")
        # Never opens a socket; never stores the credential reference.
        return ConnectionTestResult(
            ok=True,
            message=("Prototype simulation only — no live connection was established. "
                     "Secure SSH/Netmiko collection is implemented in a later phase."),
        )
