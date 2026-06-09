const levels = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

export function BloomsTaxonomy({ blooms, onChange }) {
  const total = Object.values(blooms).reduce((sum, value) => sum + Number(value), 0);

  const updateLevel = (level, value) => {
    onChange({ ...blooms, [level]: Number(value) });
  };

  return (
    <div className="space-y-4">
      {levels.map((level) => (
        <label key={level} className="flex items-center gap-4 cursor-pointer">
          <span className="w-[118px] shrink-0 text-sm font-semibold text-[#111827]">{level}</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={blooms[level]}
            onChange={(event) => updateLevel(level, event.target.value)}
            className="min-w-0 flex-1 accent-[#2563EB]"
          />
          <span className="w-12 text-right text-sm font-bold text-[#2563EB]">{blooms[level]}%</span>
        </label>
      ))}

      <div className="rounded-xl bg-[#EFF6FF] px-4 py-3 text-sm font-bold border border-[#E2E8F0]">
        <span className="text-[#111827]">Total: {total}% </span>
        {total === 100 ? (
          <span className="text-[#16A34A]">✓ Perfect balance</span>
        ) : total > 100 ? (
          <span className="text-[#DC2626]">⚠️ Warning: Total exceeds 100%!</span>
        ) : (
          <span className="text-[#6B7280] font-normal">Adjust sliders until total is 100% (Current: {total}%).</span>
        )}
      </div>
    </div>
  );
}
