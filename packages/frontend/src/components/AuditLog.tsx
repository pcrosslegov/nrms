interface LogEntry {
  id: number;
  dateTime: string;
  description: string;
  userId: string | null;
}

interface Props {
  logs: LogEntry[];
}

export default function AuditLog({ logs }: Props) {
  if (logs.length === 0) {
    return <p className="text-sm text-gray-400 italic">No activity yet</p>;
  }

  return (
    <div className="space-y-1 max-h-64 overflow-y-auto">
      {logs.map((log) => (
        <div key={log.id} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
          <span className="text-gray-700">{log.description}</span>
          <span className="text-gray-400 text-xs whitespace-nowrap ml-4">
            {new Date(log.dateTime).toLocaleString('en-CA', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
