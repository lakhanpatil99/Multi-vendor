"""Concrete AI providers + factory.

LocalAIProvider is deterministic and offline (default). Cloud providers
(OpenAI/Gemini) would be added here implementing the same AIProvider interface
without changing any caller.
"""
from __future__ import annotations

from app.ai.base import AIProvider, PatternAnalysis, SimilarPattern
from app.ai.classifier import classify
from app.ai.embeddings import hashing_embedding
from app.ai.similarity import cosine, jaccard
from app.core.config import settings

# Small built-in reference corpus of known-good patterns (seed knowledge).
_BUILTIN_CORPUS: list[dict] = [
    {"id": "kb-ssh-1", "snippet": "set system services ssh connection-limit 5",
     "category": "SSH", "field": "remote_access.ssh.hardening", "vendor": "juniper"},
    {"id": "kb-ssh-2", "snippet": "ip ssh maxstartups 10",
     "category": "SSH", "field": "remote_access.ssh.hardening", "vendor": "cisco"},
    {"id": "kb-login-1", "snippet": "login block-for 120 attempts 3 within 60",
     "category": "AUTHENTICATION", "field": "authentication.login.lockout", "vendor": "cisco"},
    {"id": "kb-crypto-1", "snippet": "crypto pki trustpoint TP enrollment selfsigned",
     "category": "ENCRYPTION", "field": "encryption.pki.trustpoint", "vendor": "cisco"},
    {"id": "kb-gui-1", "snippet": 'set gui-certificate "Fortinet_Factory"',
     "category": "ENCRYPTION", "field": "management.gui.certificate", "vendor": "fortinet"},
]


class LocalAIProvider(AIProvider):
    name = "local"

    def generate_pattern_embedding(self, text: str) -> list[float]:
        return hashing_embedding(text)

    def classify_pattern(self, text: str) -> tuple[str, str, float]:
        return classify(text)

    def analyze_unknown_pattern(self, text: str, corpus: list[dict]) -> PatternAnalysis:
        combined = _BUILTIN_CORPUS + (corpus or [])
        emb = self.generate_pattern_embedding(text)

        scored: list[SimilarPattern] = []
        for item in combined:
            snippet = item.get("snippet", "")
            # Blend embedding cosine with token jaccard for robustness.
            sim = 0.5 * cosine(emb, self.generate_pattern_embedding(snippet)) + 0.5 * jaccard(text, snippet)
            scored.append(
                SimilarPattern(
                    pattern_id=item.get("id", ""),
                    snippet=snippet,
                    similarity=round(sim, 2),
                    vendor=item.get("vendor"),
                    category=item.get("category"),
                )
            )
        scored.sort(key=lambda s: s.similarity, reverse=True)
        top = scored[:3]

        category, field, kw_conf = self.classify_pattern(text)
        best_sim = top[0].similarity if top else 0.0
        # If the closest known pattern is a strong match, prefer its mapping.
        if top and best_sim >= 0.5 and top[0].category:
            category = top[0].category
            match = next((c for c in combined if c.get("id") == top[0].pattern_id), None)
            if match:
                field = match.get("field", field)
        confidence = round(min(0.97, max(kw_conf, best_sim)), 2)

        interpretation = _describe(category)
        return PatternAnalysis(
            interpretation=interpretation,
            suggested_category=category,
            suggested_field=field,
            confidence=confidence,
            similar_patterns=top,
            provider=self.name,
        )


def _describe(category: str) -> str:
    return {
        "SSH": "Likely SSH configuration / hardening directive",
        "TELNET": "Likely Telnet-related directive",
        "SNMP": "Likely SNMP configuration",
        "NTP": "Likely NTP configuration",
        "AUTHENTICATION": "Likely authentication / login policy",
        "LOGGING": "Likely logging / syslog configuration",
        "ENCRYPTION": "Likely cryptography / certificate configuration",
        "ACL_FIREWALL": "Likely access-control / firewall policy",
        "PASSWORD_SECURITY": "Likely password security setting",
        "MANAGEMENT_ACCESS": "Likely management-access configuration",
    }.get(category, "Unrecognized security-relevant configuration")


_PROVIDERS: dict[str, type[AIProvider]] = {"local": LocalAIProvider}


def get_ai_provider() -> AIProvider:
    cls = _PROVIDERS.get(settings.ai_provider, LocalAIProvider)
    return cls()
