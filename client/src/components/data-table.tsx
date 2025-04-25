import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Search, SortAsc, SortDesc } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

type ColumnDef = {
  header: string;
  accessorKey?: string;
  cell: any;
  enableSorting?: boolean;
};

interface DataTableProps {
  data: any[];
  columns: ColumnDef[];
  isLoading?: boolean;
  onRowClick?: (row: any) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function DataTable({
  data = [],
  columns,
  isLoading = false,
  onRowClick,
  searchPlaceholder = "Pretraži...",
  emptyMessage = "Nema podataka za prikaz",
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [sorting, setSorting] = useState<{ column: string | null; direction: "asc" | "desc" }>(
    { column: null, direction: "asc" }
  );

  // Filtriranje podataka
  const filteredData = data.filter((item) => {
    if (!debouncedSearchQuery.trim()) return true;
    
    // Pretraga kroz sve kolone koje imaju accessorKey
    return columns.some((column) => {
      if (!column.accessorKey) return false;
      
      const value = item[column.accessorKey];
      if (value === null || value === undefined) return false;
      
      return String(value).toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    });
  });

  // Sortiranje podataka
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sorting.column) return 0;
    
    const aValue = a[sorting.column];
    const bValue = b[sorting.column];
    
    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    const comparison = String(aValue).localeCompare(String(bValue));
    return sorting.direction === "asc" ? comparison : -comparison;
  });

  // Rukovanje sortiranjem
  const handleSort = (column: string) => {
    if (sorting.column === column) {
      setSorting({
        column,
        direction: sorting.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSorting({ column, direction: "asc" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className={cn(
                    column.enableSorting !== false && "cursor-pointer select-none",
                    "whitespace-nowrap"
                  )}
                  onClick={() => {
                    if (column.enableSorting !== false && column.accessorKey) {
                      handleSort(column.accessorKey);
                    }
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.enableSorting !== false && column.accessorKey && sorting.column === column.accessorKey && (
                      <div className="ml-1">
                        {sorting.direction === "asc" ? (
                          <SortAsc className="h-4 w-4" />
                        ) : (
                          <SortDesc className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                    <span className="ml-2">Učitavanje...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-gray-50",
                    "transition-colors"
                  )}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.cell instanceof Function
                        ? column.cell({ row: { original: row } })
                        : column.accessorKey
                        ? row[column.accessorKey]
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}