"use client";

import { Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  data: T[];
  columns: {
    key: string;
    header: React.ReactNode;
    render: (item: T) => React.ReactNode;
    className?: string;
    searchable?: boolean;
  }[];
  searchPlaceholder?: string;
  filters?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
    filterFn: (item: T, value: string) => boolean;
  }[];
  pageSize?: number;
  hideSearch?: boolean;
  hidePagination?: boolean;
  getRowId?: (item: T) => string;
  selectedRowIds?: Set<string>;
  onSelectionChange?: (nextSelection: Set<string>) => void;
  selectionLabel?: string;
  rowClassName?: (item: T) => string | undefined;
  forcePagination?: boolean;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search...",
  filters = [],
  pageSize = 10,
  hideSearch = false,
  hidePagination = false,
  getRowId,
  selectedRowIds,
  onSelectionChange,
  selectionLabel = "Select row",
  rowClassName,
  forcePagination = false,
  className,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [activeFilters, setActiveFilters] = React.useState<
    Record<string, string>
  >({});

  // Apply search and filters
  const filteredData = React.useMemo(() => {
    let result = data;

    // Apply search
    if (searchTerm) {
      result = result.filter((item) => {
        return columns.some((col) => {
          if (!col.searchable) return false;
          const value = (item as Record<string, unknown>)[col.key];
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== "all") {
        const filter = filters.find((f) => f.key === key);
        if (filter) {
          result = result.filter((item) => filter.filterFn(item, value));
        }
      }
    });

    return result;
  }, [data, searchTerm, activeFilters, columns, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  const selectionEnabled = Boolean(
    getRowId && selectedRowIds && onSelectionChange,
  );
  const pageRowIds = React.useMemo(
    () =>
      selectionEnabled
        ? paginatedData.map((item) => getRowId?.(item)).filter(Boolean)
        : [],
    [paginatedData, getRowId, selectionEnabled],
  );
  const allSelected =
    selectionEnabled &&
    pageRowIds.length > 0 &&
    pageRowIds.every((id) => (selectedRowIds as Set<string>).has(id as string));
  const someSelected =
    selectionEnabled &&
    pageRowIds.some((id) =>
      (selectedRowIds as Set<string>).has(id as string),
    ) &&
    !allSelected;

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilters]);

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filters */}
      {!hideSearch && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {filters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Select
                  key={filter.key}
                  value={activeFilters[filter.key] || "all"}
                  onValueChange={(value) =>
                    handleFilterChange(filter.key, value)
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            {selectionEnabled && (
              <TableHead className="w-[40px]">
                <Checkbox
                  aria-label={selectionLabel}
                  checked={
                    allSelected ? true : someSelected ? "indeterminate" : false
                  }
                  onCheckedChange={(checked) => {
                    const nextSelection = new Set(
                      selectedRowIds as Set<string>,
                    );
                    if (checked) {
                      pageRowIds.forEach((id) =>
                        nextSelection.add(id as string),
                      );
                    } else {
                      pageRowIds.forEach((id) =>
                        nextSelection.delete(id as string),
                      );
                    }
                    onSelectionChange?.(nextSelection);
                  }}
                />
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectionEnabled ? 1 : 0)}
                className="text-center py-8"
              >
                No results found
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((item, index) => (
              <TableRow key={index} className={rowClassName?.(item)}>
                {selectionEnabled && (
                  <TableCell>
                    <Checkbox
                      aria-label={selectionLabel}
                      checked={(selectedRowIds as Set<string>).has(
                        getRowId?.(item) as string,
                      )}
                      onCheckedChange={(checked) => {
                        const nextSelection = new Set(
                          selectedRowIds as Set<string>,
                        );
                        const rowId = getRowId?.(item);
                        if (!rowId) {
                          return;
                        }
                        if (checked) {
                          nextSelection.add(rowId);
                        } else {
                          nextSelection.delete(rowId);
                        }
                        onSelectionChange?.(nextSelection);
                      }}
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {!hidePagination && (forcePagination || totalPages > 1) && (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredData.length)} of {filteredData.length}{" "}
            results
          </div>
          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <PaginationItem key={`ellipsis-${page}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                },
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
