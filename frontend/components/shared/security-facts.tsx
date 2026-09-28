import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryBadge, OriginBadge } from "./badges";
import type { NormalizedFact } from "@/types";

/** Tabular view of extracted security facts (the parsing -> compliance bridge). */
export function SecurityFactsTable({ facts }: { facts: NormalizedFact[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fact</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Normalized Field</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Origin</TableHead>
          <TableHead>Lines</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {facts.map((f) => (
          <TableRow key={f.id}>
            <TableCell className="font-medium">{f.label}</TableCell>
            <TableCell>
              <CategoryBadge category={f.category} />
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {f.field}
            </TableCell>
            <TableCell className="font-mono text-xs">{String(f.value)}</TableCell>
            <TableCell>
              <OriginBadge origin={f.origin} />
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {f.sourceLines.join(", ")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
