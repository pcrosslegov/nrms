import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReleases, useCreateRelease, type Release } from '../api/releases';

const tabs = [
  { key: 'drafts', label: 'Drafts' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'published', label: 'Published' },
] as const;

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function releaseHeadline(r: Release): string {
  const doc = r.documents?.[0];
  const lang = doc?.languages?.[0];
  return lang?.headline || r.reference || r.key || 'Untitled';
}

export default function ReleasesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['key']>('drafts');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useReleases(activeTab, page);
  const createRelease = useCreateRelease();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Releases</h2>
        <button
          onClick={() => createRelease.mutate({}, { onSuccess: (r) => navigate(`/releases/${r.id}`) })}
          disabled={createRelease.isPending}
          className="px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-md hover:bg-[#002244] transition-colors disabled:opacity-50"
        >
          + New Release
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-[#003366] text-[#003366]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {data && activeTab === tab.key && (
              <span className="ml-1.5 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                {data.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : !data?.items.length ? (
        <div className="text-center py-12 text-gray-400">No releases found</div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Headline</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ministry</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/releases/${r.id}`)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-medium">{releaseHeadline(r)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                        {r.releaseType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.ministry?.abbreviation ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {r.reference || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(r.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Page {data.page} of {data.totalPages} ({data.total} total)
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
