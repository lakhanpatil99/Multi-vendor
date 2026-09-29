"""ORM models. Importing this package registers all tables on `Base.metadata`."""
from app.models.organization import Organization, User  # noqa: F401
from app.models.device import Device, DeviceCredentialRef  # noqa: F401
from app.models.configuration import Configuration, NormalizedConfiguration  # noqa: F401
from app.models.normalized_fact import NormalizedFact  # noqa: F401
from app.models.framework import Framework  # noqa: F401
from app.models.compliance_rule import (  # noqa: F401
    ComplianceRule,
    FrameworkMapping,
    ComplianceRun,
)
from app.models.finding import Finding  # noqa: F401
from app.models.training_pattern import (  # noqa: F401
    TrainingPattern,
    TrainingFeedback,
    AIAnalysis,
)
from app.models.remediation import Remediation  # noqa: F401
from app.models.report import Report  # noqa: F401
from app.models.audit_event import AuditEvent  # noqa: F401
from app.models.job import AnalysisJob  # noqa: F401
