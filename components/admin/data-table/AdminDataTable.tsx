import { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface AdminDataTableHeader {
  label: string;
  align?: "left" | "center" | "right";
  className?: string;
}

interface AdminDataTableProps {
  headers: AdminDataTableHeader[];
  children: ReactNode;
  emptyMessage: string;
  isEmpty: boolean;
}

export function AdminDataTable({
  headers,
  children,
  emptyMessage,
  isEmpty,
}: AdminDataTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead
                key={header.label}
                className={cn(
                  header.align === "right"
                    ? "text-right"
                    : header.align === "center"
                    ? "text-center"
                    : undefined,
                  header.className
                )}
              >
                {header.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isEmpty ? (
            <TableRow>
              <TableCell
                colSpan={headers.length}
                className="py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            children
          )}
        </TableBody>
      </Table>
    </div>
  );
}

