import type { SyntaxStyle } from "./enums";

/**
 * Vendor definition.
 * IMPORTANT: vendors are DATA, not hard-coded branches. The three prototype
 * vendors (Cisco / Juniper / Fortinet) are seeded, but the architecture allows
 * any number of additional vendors (Arista, Palo Alto, SONiC, ...) to be added
 * without code changes.
 */
export interface Vendor {
  id: string;
  /** Display name, e.g. "Cisco". */
  name: string;
  /** Operating systems this vendor produces, e.g. ["IOS", "IOS-XE"]. */
  operatingSystems: string[];
  /** Configuration syntax style used by the config viewer. */
  syntaxStyle: SyntaxStyle;
  /** Short capability blurb. */
  description: string;
  /** Whether this vendor is an active prototype target. */
  supported: boolean;
  /** Accent color token key for badges (maps to constants). */
  accent: string;
}
