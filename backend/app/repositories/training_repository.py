from __future__ import annotations

from app.models.training_pattern import AIAnalysis, TrainingFeedback, TrainingPattern
from app.repositories.base import TenantRepository


class TrainingRepository(TenantRepository[TrainingPattern]):
    model = TrainingPattern

    def add_feedback(self, feedback: TrainingFeedback) -> TrainingFeedback:
        self.db.add(feedback)
        self.db.flush()
        return feedback

    def add_ai_analysis(self, analysis: AIAnalysis) -> AIAnalysis:
        self.db.add(analysis)
        self.db.flush()
        return analysis
