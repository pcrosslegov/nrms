import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../api/search';

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSearch(query, page);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Search Releases</h2>

      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search headlines, content, keywords..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
          autoFocus
        />
      </div>

      {query.length < 2 ? (
        <p className="text-center py-8 text-gray-400">
          Type at least 2 characters to search
        </p>
      ) : isLoading ? (
        <p className="text-center py-8 text-gray-400">Searching...</p>
      ) : !data?.items.length ? (
        <p className="text-center py-8 text-gray-400">No results found</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">
            {data.total} result{data.total !== 1 ? 's' : ''}
          </p>

          <div className="space-y-2">
            {data.items.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate(`/releases/${r.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#003366] cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {r.headline ?? r.reference ?? 'Untitled'}
                    </h3>
                    <div className="flex gap-3 mt-1 text-sm text-gray-500">
                      <span className="font-mono">{r.reference || '—'}</span>
                      {r.ministryAbbreviation && (
                        <span>{r.ministryAbbreviation}</span>
                      )}
                      <span>{formatDate(r.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                      {r.releaseType}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        r.isPublished
                          ? 'bg-green-100 text-green-700'
                          : r.isCommitted
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {r.isPublished ? 'Published' : r.isCommitted ? 'Scheduled' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Page {data.page} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
