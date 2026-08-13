export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-border bg-background p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-all ${
            value === opt.value ? "bg-surface text-primary shadow-sm" : "text-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
