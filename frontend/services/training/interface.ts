import type { KnowledgeQueueSummary, PatternStatus, TrainingPattern } from "@/types";

export interface TrainingReview {
  patternId: string;
  decision: "APPROVE" | "MODIFY" | "REJECT";
  category?: string;
  field?: string;
  note?: string;
}

export interface TrainingService {
  queueSummary(): Promise<KnowledgeQueueSummary>;
  list(status?: PatternStatus): Promise<TrainingPattern[]>;
  get(id: string): Promise<TrainingPattern | null>;
  /** Simulate a human-in-the-loop review decision. */
  review(review: TrainingReview): Promise<TrainingPattern>;
}
