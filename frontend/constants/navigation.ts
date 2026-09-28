import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ClipboardCheck,
  Cpu,
  FileBarChart,
  FileStack,
  GaugeCircle,
  GitCompareArrows,
  GraduationCap,
  LayoutDashboard,
  Network,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Wrench,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match nested routes for active state. */
  matchPrefix?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      { label: "Devices", href: "/devices", icon: Network, matchPrefix: true },
      {
        label: "Configurations",
        href: "/configurations",
        icon: FileStack,
        matchPrefix: true,
      },
      {
        label: "Upload Configuration",
        href: "/configurations/upload",
        icon: UploadCloud,
      },
    ],
  },
  {
    title: "Compliance",
    items: [
      { label: "Compliance Overview", href: "/compliance", icon: ClipboardCheck },
      {
        label: "Findings",
        href: "/findings",
        icon: ShieldCheck,
        matchPrefix: true,
      },
      { label: "Framework Mapping", href: "/frameworks", icon: GitCompareArrows },
    ],
  },
  {
    title: "AI Intelligence",
    items: [
      { label: "AI Analysis", href: "/ai-analysis", icon: Sparkles },
      { label: "Training Center", href: "/training", icon: GraduationCap },
      { label: "Learned Patterns", href: "/training/patterns", icon: Cpu },
    ],
  },
  {
    title: "Remediation",
    items: [
      {
        label: "Remediation Center",
        href: "/remediation",
        icon: Wrench,
        matchPrefix: true,
      },
    ],
  },
  {
    title: "Reporting",
    items: [
      { label: "Reports", href: "/reports", icon: FileBarChart, matchPrefix: true },
      { label: "Audit Logs", href: "/audit", icon: ScrollText },
    ],
  },
  {
    title: "System",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

/** Icons re-exported for convenience in headers. */
export const MODULE_ICONS = {
  dashboard: GaugeCircle,
  activity: Activity,
};
