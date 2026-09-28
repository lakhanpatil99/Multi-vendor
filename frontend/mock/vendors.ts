import type { Vendor } from "@/types";

/**
 * Seed vendors. The three prototype targets are `supported`, but the list is
 * data-driven so additional vendors can be appended without code changes.
 */
export const MOCK_VENDORS: Vendor[] = [
  {
    id: "cisco",
    name: "Cisco",
    operatingSystems: ["IOS", "IOS-XE", "NX-OS"],
    syntaxStyle: "FLAT",
    description:
      "Flat, command-oriented configuration. Lines applied top-to-bottom.",
    supported: true,
    accent: "#049fd9",
  },
  {
    id: "juniper",
    name: "Juniper",
    operatingSystems: ["Junos"],
    syntaxStyle: "HIERARCHICAL",
    description:
      "Hierarchical configuration expressed with nested set/curly-brace stanzas.",
    supported: true,
    accent: "#84b135",
  },
  {
    id: "fortinet",
    name: "Fortinet",
    operatingSystems: ["FortiOS"],
    syntaxStyle: "BLOCK",
    description:
      "Block-based configuration using config / edit / set / next / end.",
    supported: true,
    accent: "#ee3124",
  },
  {
    id: "arista",
    name: "Arista",
    operatingSystems: ["EOS"],
    syntaxStyle: "FLAT",
    description: "Flat, IOS-like syntax. Extensible target (not yet enabled).",
    supported: false,
    accent: "#f7901e",
  },
  {
    id: "paloalto",
    name: "Palo Alto",
    operatingSystems: ["PAN-OS"],
    syntaxStyle: "HIERARCHICAL",
    description: "Hierarchical set-based syntax. Extensible target (not yet enabled).",
    supported: false,
    accent: "#fa582d",
  },
];

export function getVendor(id: string): Vendor | undefined {
  return MOCK_VENDORS.find((v) => v.id === id);
}
