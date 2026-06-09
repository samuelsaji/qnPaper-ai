import { Plus, Trash2 } from "lucide-react";

const questionTypesPool = ["MCQ", "Short Answer", "Long Answer", "Case Study", "HOTS"];

export function SectionBuilder({ sections, onChange }) {
  const updateSection = (id, field, value) => {
    onChange(
      sections.map((section) =>
        section.id === id
          ? {
              ...section,
              [field]: field === "timeLimit" ? Math.max(0, Number(value) || 0) : value,
            }
          : section
      )
    );
  };

  const toggleType = (sectionId, type) => {
    onChange(
      sections.map((section) => {
        if (section.id === sectionId) {
          const currentTypes = section.questionTypes || [];
          const nextTypes = currentTypes.includes(type)
            ? currentTypes.filter((t) => t !== type)
            : [...currentTypes, type];
          return { ...section, questionTypes: nextTypes };
        }
        return section;
      })
    );
  };

  const removeSection = (id) => {
    if (sections.length <= 1) return;
    onChange(sections.filter((section) => section.id !== id));
  };

  const addSection = () => {
    const letter = String.fromCharCode(65 + sections.length);
    onChange([
      ...sections,
      {
        id: Date.now(),
        name: `Section ${letter}`,
        questionTypes: ["Short Answer"],
        timeLimit: 30,
        instructions: "Answer all questions in this section.",
      },
    ]);
  };

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={section.id} className="rounded-xl border border-[#E2E8F0] bg-white p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#111827]">Section {index + 1}</span>
            <button
              type="button"
              onClick={() => removeSection(section.id)}
              disabled={sections.length <= 1}
              className="rounded-lg p-2 text-[#6B7280] hover:bg-red-50 hover:text-[#DC2626] disabled:opacity-35 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
            {/* Section Name */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#6B7280]">Section Name</span>
              <input
                value={section.name}
                onChange={(event) => updateSection(section.id, "name", event.target.value)}
                className="h-10 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
                placeholder="e.g. Section A"
              />
            </label>

            {/* Time Limit */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#6B7280]">Time Limit (min)</span>
              <input
                type="number"
                min="0"
                value={section.timeLimit || 0}
                onChange={(event) => updateSection(section.id, "timeLimit", event.target.value)}
                className="h-10 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
                placeholder="Duration"
              />
            </label>
          </div>

          {/* Question Types Multi-select (Pill selection style) */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-[#6B7280]">Question Types</span>
            <div className="flex flex-wrap gap-2">
              {questionTypesPool.map((type) => {
                const isSelected = (section.questionTypes || []).includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(section.id, type)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                      isSelected
                        ? "bg-[#2563EB] border-[#2563EB] text-white"
                        : "bg-white border-[#D1D5DB] text-[#374151] hover:bg-gray-50"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#6B7280]">Section Instructions</span>
            <textarea
              value={section.instructions || ""}
              onChange={(event) => updateSection(section.id, "instructions", event.target.value)}
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] min-h-[64px] resize-y"
              placeholder="e.g. Answer all questions."
            />
          </label>
        </div>
      ))}

      <button
        type="button"
        onClick={addSection}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#2563EB] bg-white px-4 text-sm font-semibold text-[#2563EB] hover:bg-[#EFF6FF] transition"
      >
        <Plus className="h-4 w-4" />
        Add Section
      </button>
    </div>
  );
}
