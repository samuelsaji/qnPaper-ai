import { Copy, Edit3, Play } from "lucide-react";

function difficultyClass(level) {
  if (level === "Easy") return "bg-green-50 text-[#16A34A] border-green-100";
  if (level === "Hard") return "bg-red-50 text-[#DC2626] border-red-100";
  return "bg-amber-50 text-[#D97706] border-amber-100";
}

export function TemplateCard({ template, onUse, onEdit, onCopy }) {
  return (
    <article className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold uppercase text-[#2563EB]">
        <span className="rounded-full bg-[#EFF6FF] px-3 py-1">{template.type || "Template"}</span>
        <span>·</span>
        <span className="rounded-full bg-[#EFF6FF] px-3 py-1">{template.subject}</span>
      </div>

      <h3 className="text-lg font-extrabold text-[#111827]">{template.title || template.name}</h3>
      <p className="mt-2 text-sm text-[#6B7280]">
        {template.subject} · Grade {template.grade}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[#D1D5DB] px-3 py-1 text-xs font-bold text-[#374151]">
          {template.sections} sections
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${difficultyClass(template.difficulty)}`}>
          {template.difficulty}
        </span>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <span className="text-xs text-[#6B7280]">{template.date || template.createdAt}</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCopy} className="rounded-full p-2 text-[#6B7280] hover:bg-[#F0F4F8]" title="Copy Template">
            <Copy className="h-4 w-4" />
          </button>
          <button type="button" onClick={onEdit} className="rounded-full p-2 text-[#6B7280] hover:bg-[#F0F4F8]" title="Edit Template">
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onUse}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 text-xs font-bold text-white hover:bg-[#1D4ED8] transition"
          >
            Use ▶
          </button>
        </div>
      </div>
    </article>
  );
}
