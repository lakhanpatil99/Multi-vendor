import type {
  ControlCategory,
  DetectionOrigin,
  PatternStatus,
} from "./enums";

/**
 * A configuration pattern in the human-in-the-loop knowledge pipeline.
 * UNKNOWN -> AI_SUGGESTED -> PENDING_REVIEW -> LEARNED | REJECTED
 */
export interface TrainingPattern {
  id: string; // PAT-xxxx
  vendorId: string;
  vendorName: string;
  os: string;
  /** The unfamiliar raw configuration snippet. */
  snippet: string;
  status: PatternStatus;
  /** AI's suggested interpretation. */
  aiSuggestion: AIAnalysis;
  /** Suggested / approved control category. */
  suggestedCategory: ControlCategory;
  /** Suggested / approved normalized field. */
  suggestedField: string;
  /** Once learned, how many configs it has since matched. */
  usageCount: number;
  createdAt: string; // ISO
  reviewedAt?: string; // ISO
  reviewedBy?: string;
  /** Reviewer note captured on approve/modify/reject. */
  reviewNote?: string;
}

/** AI similarity / interpretation output for an unknown pattern. */
export interface AIAnalysis {
  id: string;
  /** Plain-language interpretation, e.g. "Likely SSH configuration". */
  interpretation: string;
  suggestedCategory: ControlCategory;
  suggestedField: string;
  /** Confidence 0-100. */
  confidence: number;
  /** Similar known patterns that informed the suggestion. */
  similarPatterns: {
    patternId: string;
    vendorName: string;
    similarity: number;
    snippet: string;
  }[];
  origin: DetectionOrigin;
}

/** Rollup for the AI knowledge queue widget. */
export interface KnowledgeQueueSummary {
  unknownPatterns: number;
  pendingReview: number;
  learnedToday: number;
  rejectedToday: number;
}
