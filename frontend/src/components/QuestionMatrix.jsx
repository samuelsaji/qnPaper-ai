import { Minus, Plus } from "lucide-react";

export function QuestionMatrix({ matrix, onChange, totalMarks }) {
  const toggleRow = (index) => {
    const nextMatrix = matrix.map((row, i) =>
      i === index ? { ...row, enabled: !row.enabled } : row
    );
    onChange(nextMatrix);
  };

  const updateCount = (index, delta) => {
    const nextMatrix = matrix.map((row, i) => {
      if (i === index) {
        const nextCount = Math.max(0, row.count + delta);
        return { ...row, count: nextCount };
      }
      return row;
    });
    onChange(nextMatrix);
  };

  const updateMarks = (index, value) => {
    const nextMatrix = matrix.map((row, i) =>
      i === index ? { ...row, marksEach: Math.max(0, Number(value) || 0) } : row
    );
    onChange(nextMatrix);
  };

  const totalQuestions = matrix.reduce(
    (sum, row) => sum + (row.enabled ? row.count : 0),
    0
  );

  const grandTotal = matrix.reduce(
    (sum, row) => sum + (row.enabled ? row.count * row.marksEach : 0),
    0
  );

  const isOverMarks = grandTotal > totalMarks;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm text-[#111827]">
        <thead>
          <tr className="bg-[#EFF6FF] text-left border-b border-[#E2E8F0]">
            <th className="px-3 py-2.5 font-bold">Toggle</th>
            <th className="px-3 py-2.5 font-bold">Type</th>
            <th className="px-3 py-2.5 font-bold">Count</th>
            <th className="px-3 py-2.5 font-bold">Marks Each</th>
            <th className="px-3 py-2.5 font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, index) => (
            <tr
              key={row.type}
              className={`border-b border-[#E2E8F0] transition-opacity ${
                row.enabled ? "opacity-100" : "opacity-40"
              }`}
            >
              {/* Toggle Column */}
              <td className="px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={() => toggleRow(index)}
                  className="h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
              </td>

              {/* Type Label */}
              <td className="px-3 py-2.5 font-semibold">{row.type}</td>

              {/* Count Stepper */}
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!row.enabled}
                    onClick={() => updateCount(index, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D1D5DB] bg-white hover:bg-gray-50 text-[#374151] disabled:opacity-40"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold">
                    {row.count}
                  </span>
                  <button
                    type="button"
                    disabled={!row.enabled}
                    onClick={() => updateCount(index, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D1D5DB] bg-white hover:bg-gray-50 text-[#374151] disabled:opacity-40"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </td>

              {/* Marks/Q */}
              <td className="px-3 py-2.5">
                <input
                  type="number"
                  min="0"
                  disabled={!row.enabled}
                  value={row.marksEach}
                  onChange={(e) => updateMarks(index, e.target.value)}
                  className="h-9 w-20 rounded-lg border border-[#D1D5DB] px-2 text-sm outline-none focus:border-[#2563EB] disabled:bg-gray-50 disabled:opacity-40"
                />
              </td>

              {/* Total */}
              <td className="px-3 py-2.5 font-bold">
                {row.enabled ? row.count * row.marksEach : 0}
              </td>
            </tr>
          ))}
          <tr className="bg-[#EFF6FF] font-bold">
            <td className="px-3 py-2.5" colSpan={2}>
              Grand Total
            </td>
            <td className="px-3 py-2.5 text-center">{totalQuestions}</td>
            <td className="px-3 py-2.5">-</td>
            <td className="px-3 py-2.5">{grandTotal}</td>
          </tr>
        </tbody>
      </table>

      {isOverMarks && (
        <p className="mt-2 text-xs font-bold text-[#DC2626] animate-pulse">
          ⚠️ Warning: The sum of questions total marks ({grandTotal}) exceeds the
          defined exam Total Marks ({totalMarks})!
        </p>
      )}
    </div>
  );
}
