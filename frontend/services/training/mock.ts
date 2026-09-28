import {
  MOCK_KNOWLEDGE_QUEUE,
  MOCK_TRAINING_PATTERNS,
  getTrainingPattern,
} from "@/mock";
import { delay } from "@/lib/utils";
import type {
  ControlCategory,
  KnowledgeQueueSummary,
  PatternStatus,
  TrainingPattern,
} from "@/types";
import type { TrainingReview, TrainingService } from "./interface";

export class MockTrainingService implements TrainingService {
  async queueSummary(): Promise<KnowledgeQueueSummary> {
    await delay(120);
    return MOCK_KNOWLEDGE_QUEUE;
  }

  async list(status?: PatternStatus): Promise<TrainingPattern[]> {
    await delay(160);
    let items = [...MOCK_TRAINING_PATTERNS];
    if (status) items = items.filter((p) => p.status === status);
    return items;
  }

  async get(id: string): Promise<TrainingPattern | null> {
    await delay(100);
    return getTrainingPattern(id) ?? null;
  }

  async review(review: TrainingReview): Promise<TrainingPattern> {
    await delay(400);
    const base = getTrainingPattern(review.patternId);
    if (!base) throw new Error("Pattern not found");
    // Return a new object reflecting the decision (mock; not persisted).
    const status: PatternStatus =
      review.decision === "REJECT" ? "REJECTED" : "LEARNED";
    return {
      ...base,
      status,
      suggestedCategory: (review.category as ControlCategory) ?? base.suggestedCategory,
      suggestedField: review.field ?? base.suggestedField,
      reviewedAt: new Date().toISOString(),
      reviewedBy: "current.user",
      reviewNote: review.note,
      usageCount: status === "LEARNED" ? base.usageCount : 0,
    };
  }
}
