import { api } from "@/lib/api/client";
import { toTrainingPattern } from "@/lib/api/adapters";
import type { TrainingPatternDto } from "@/lib/api/dto";
import type {
  KnowledgeQueueSummary,
  PatternStatus,
  TrainingPattern,
} from "@/types";
import type { TrainingReview, TrainingService } from "./interface";

// frontend PatternStatus → backend status filter
const TO_BACKEND_STATUS: Partial<Record<PatternStatus, string>> = {
  PENDING_REVIEW: "PENDING",
  AI_SUGGESTED: "PENDING",
  LEARNED: "APPROVED",
  REJECTED: "REJECTED",
};

export class ApiTrainingService implements TrainingService {
  async queueSummary(): Promise<KnowledgeQueueSummary> {
    const { data } = await api.getPaged<TrainingPatternDto[]>(
      "/training/patterns",
      { page_size: 100 }
    );
    const pending = data.filter((p) => p.status === "PENDING").length;
    return {
      unknownPatterns: pending,
      pendingReview: pending,
      learnedToday: data.filter((p) => p.status === "APPROVED").length,
      rejectedToday: data.filter((p) => p.status === "REJECTED").length,
    };
  }

  async list(status?: PatternStatus): Promise<TrainingPattern[]> {
    const q: Record<string, string | number> = { page_size: 100 };
    const backendStatus = status ? TO_BACKEND_STATUS[status] : undefined;
    if (backendStatus) q.status = backendStatus;
    const { data } = await api.getPaged<TrainingPatternDto[]>(
      "/training/patterns",
      q
    );
    return data.map(toTrainingPattern);
  }

  async get(id: string): Promise<TrainingPattern | null> {
    try {
      const p = await api.get<TrainingPatternDto>(`/training/patterns/${id}`);
      return toTrainingPattern(p);
    } catch (err) {
      if ((err as { status?: number })?.status === 404) return null;
      throw err;
    }
  }

  async review(review: TrainingReview): Promise<TrainingPattern> {
    const body = {
      decision: review.decision,
      category: review.category,
      field: review.field,
      note: review.note,
    };
    const path =
      review.decision === "REJECT"
        ? `/training/patterns/${review.patternId}/reject`
        : `/training/patterns/${review.patternId}/approve`;
    const p = await api.post<TrainingPatternDto>(path, body);
    return toTrainingPattern(p);
  }
}
