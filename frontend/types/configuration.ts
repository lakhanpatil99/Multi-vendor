import type {
  AnalysisStatus,
  ConfigurationFormat,
  ConfigurationSource,
  ControlCategory,
  DetectionOrigin,
  ParserStatus,
  SyntaxStyle,
} from "./enums";

export interface Configuration {
  id: string;
  name: string;
  deviceId: string;
  deviceHostname: string;
  vendorId: string;
  vendorName: string;
  os: string;
  source: ConfigurationSource;
  format: ConfigurationFormat;
  syntaxStyle: SyntaxStyle;
  version: string;
  /** Size in bytes. */
  sizeBytes: number;
  lineCount: number;
  parserStatus: ParserStatus;
  analysisStatus: AnalysisStatus;
  collectedAt: string; // ISO
  /** Raw configuration text (credentials pre-masked in mock data). */
  raw: string;
  /** Normalized vendor-neutral model. */
  normalized: NormalizedConfiguration;
  /** Extracted security facts. */
  securityFacts: NormalizedFact[];
}

/**
 * Vendor-neutral normalized model. The tree is intentionally open-ended
 * (Record) because different vendors surface different structures, but the
 * top-level security domains are standardized.
 */
export interface NormalizedConfiguration {
  identity: {
    hostname: string;
    vendor: string;
    os: string;
    version: string;
  };
  remote_access?: Record<string, unknown>;
  authentication?: Record<string, unknown>;
  logging?: Record<string, unknown>;
  snmp?: Record<string, unknown>;
  ntp?: Record<string, unknown>;
  access_control?: Record<string, unknown>;
  management?: Record<string, unknown>;
  encryption?: Record<string, unknown>;
  [domain: string]: unknown;
}

/**
 * A single normalized security fact derived from the raw configuration.
 * Facts are the bridge between parsing and compliance evaluation.
 */
export interface NormalizedFact {
  id: string;
  category: ControlCategory;
  /** Normalized field path, e.g. "remote_access.ssh.version". */
  field: string;
  /** Human label, e.g. "SSH Version". */
  label: string;
  /** Normalized value. */
  value: string | number | boolean;
  /** Where the fact was derived (deterministic parser vs AI-assisted). */
  origin: DetectionOrigin;
  /** Line number(s) in the raw config that produced this fact. */
  sourceLines: number[];
  /** The exact raw snippet backing this fact. */
  evidence: string;
  /** AI confidence 0-100 when origin is AI_ASSISTED. */
  confidence?: number;
}
