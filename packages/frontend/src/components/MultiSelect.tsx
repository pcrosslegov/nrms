interface Option {
  id: string;
  label: string;
}

interface Props {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
}

export default function MultiSelect({ label, options, selected, onChange, loading }: Props) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {loading ? (
        <div className="text-sm text-gray-400">Loading...</div>
      ) : options.length === 0 ? (
        <div className="text-sm text-gray-400">None available</div>
      ) : (
        <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.id)}
                onChange={() => toggle(opt.id)}
                className="rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
