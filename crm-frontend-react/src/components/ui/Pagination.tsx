interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total: number;
}

export default function Pagination({ page, totalPages, onPageChange, total }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-gray-500">Всего: {total}</span>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 rounded text-sm border disabled:opacity-50 hover:bg-gray-100"
        >
          <i className="fas fa-chevron-left" />
        </button>
        {pages.map((p, i) =>
          typeof p === 'string' ? (
            <span key={i} className="px-3 py-1 text-sm text-gray-400">...</span>
          ) : (
            <button
              key={i}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1 rounded text-sm border ${
                p === page ? 'bg-pink-500 text-white border-pink-500' : 'hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1 rounded text-sm border disabled:opacity-50 hover:bg-gray-100"
        >
          <i className="fas fa-chevron-right" />
        </button>
      </div>
    </div>
  );
}
