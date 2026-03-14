import { useReleases } from '../api/releases';

export default function DashboardPage() {
  const drafts = useReleases('drafts');
  const scheduled = useReleases('scheduled');
  const published = useReleases('published');

  const cards = [
    { label: 'Drafts', count: drafts.data?.total ?? '—', color: 'bg-amber-50 border-amber-200 text-amber-800' },
    { label: 'Scheduled', count: scheduled.data?.total ?? '—', color: 'bg-blue-50 border-blue-200 text-blue-800' },
    { label: 'Published', count: published.data?.total ?? '—', color: 'bg-green-50 border-green-200 text-green-800' },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-lg border p-5 ${c.color}`}
          >
            <p className="text-sm font-medium opacity-80">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
