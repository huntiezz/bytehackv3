"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginatedListProps {
  items: any[];
  itemsPerPage?: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}

export function PaginatedList({ items, itemsPerPage = 5, renderItem }: PaginatedListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Items with spacing */}
      <div className="space-y-6">
        {currentItems.map((item, index) => (
          <div key={startIndex + index}>
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6 border-t border-zinc-900/50">
          <Button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            variant="ghost"
            size="sm"
            className="gap-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">
              Page <span className="text-white font-semibold">{currentPage}</span> of{" "}
              <span className="text-zinc-400">{totalPages}</span>
            </span>
          </div>

          <Button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            variant="ghost"
            size="sm"
            className="gap-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

