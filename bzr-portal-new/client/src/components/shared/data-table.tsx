import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data?: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  title?: string;
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  actions?: React.ReactNode;
  keyField?: keyof T;
  itemsPerPage?: number;
  emptyMessage?: string;
}

export function DataTable<T>({
  data = [],
  columns,
  isLoading = false,
  title,
  searchPlaceholder = "Pretraži...",
  onRowClick,
  actions,
  keyField = 'id' as keyof T,
  itemsPerPage = 10,
  emptyMessage = "Nema dostupnih podataka",
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Simple filtering function - can be enhanced for more complex needs
  const filteredData = data.filter((item) => {
    return columns.some((column) => {
      if (!column.accessorKey) return false;
      const value = item[column.accessorKey];
      return value && String(value).toLowerCase().includes(searchQuery.toLowerCase());
    });
  });

  // Pagination
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(pageCount, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  if (isLoading) {
    return (
      <Card>
        {title && (
          <CardHeader className="border-b">
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-0">
          <div className="p-4">
            <Skeleton className="h-10 w-full mb-4" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, idx) => (
                    <TableHead key={idx} className={column.className}>
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, rowIdx) => (
                  <TableRow key={rowIdx}>
                    {columns.map((_, colIdx) => (
                      <TableCell key={colIdx}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="border-t p-4">
          <Skeleton className="h-8 w-full" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      {title && (
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {actions}
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="max-w-sm"
          />
          {!title && actions && <div>{actions}</div>}
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, idx) => (
                  <TableHead key={idx} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <TableRow
                    key={String(item[keyField])}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
                  >
                    {columns.map((column, idx) => (
                      <TableCell key={idx} className={column.className}>
                        {column.cell
                          ? column.cell(item)
                          : column.accessorKey
                          ? String(item[column.accessorKey] || "")
                          : null}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-8 text-gray-500"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {pageCount > 1 && (
        <CardFooter className="border-t p-4">
          <div className="w-full flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Prikazano{" "}
              <span className="font-medium">
                {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)}
              </span>{" "}
              do{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredData.length)}
              </span>{" "}
              od <span className="font-medium">{filteredData.length}</span> rezultata
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {renderPaginationItems()}
                
                {pageCount > 5 && currentPage < pageCount - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < pageCount && handlePageChange(currentPage + 1)}
                    className={currentPage === pageCount ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
