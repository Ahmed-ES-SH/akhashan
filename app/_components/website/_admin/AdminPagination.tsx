"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useTranslation } from "@/app/hooks/useTranslation";

/////////////////////////////////////////////////////////////////////
/////////////// AdminPagination — reusable pagination controls //////
/////////////////////////////////////////////////////////////////////

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function AdminPagination({
  currentPage,
  totalPages,
  total,
  onPageChange,
}: AdminPaginationProps) {
  const adminT = useTranslation("admin");
  const servicesSection = (adminT as Record<string, unknown>)?.services as
    | Record<string, unknown>
    | undefined;
  const pagination =
    (servicesSection?.pagination as Record<string, string>) ?? {};

  const previousLabel = pagination.previous ?? "Previous";
  const nextLabel = pagination.next ?? "Next";
  const pageLabel = pagination.page ?? "Page";

  if (totalPages <= 1) return null;

  // Generate page numbers to show
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if at edges
      if (currentPage <= 3) {
        end = 4;
      }
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push("...");
      }

      // Add range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-100"
      data-testid="pagination-controls"
    >
      {/* Info text */}
      <div className="text-sm text-gray-500">
        {pageLabel} {currentPage} of {totalPages} &middot; {total} total
      </div>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={previousLabel}
          data-testid="pagination-previous"
        >
          <FiChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{previousLabel}</span>
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, index) =>
          typeof page === "string" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-1.5 text-sm text-gray-400"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition ${
                page === currentPage
                  ? "bg-green text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              aria-label={`${pageLabel} ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              data-testid={`pagination-page-${page}`}
            >
              {page}
            </button>
          ),
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={nextLabel}
          data-testid="pagination-next"
        >
          <span className="hidden sm:inline">{nextLabel}</span>
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
