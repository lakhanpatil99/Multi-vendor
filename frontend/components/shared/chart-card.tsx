import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ChartCard({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="flex items-start gap-2">
          {Icon && (
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-overlay text-primary">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-0.5 text-xs">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
