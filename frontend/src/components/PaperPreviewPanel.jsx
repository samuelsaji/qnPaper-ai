import { Copy, Download, FileText, Maximize2 } from "lucide-react";
import { getUser } from "../utils/storage";

function sectionTitle(section, index) {
  const suffix = section.type === "objective" ? "MCQ" : section.type === "short" ? "Short Answer" : "Long Answer";
  return `${section.name || `Section ${String.fromCharCode(65 + index)}`} - ${suffix}`.toUpperCase();
}

function plainTextPaper(paper, schoolName) {
  const lines = [
    schoolName,
    paper.title,
    `Subject: ${paper.subject} | Grade: ${paper.grade} | Duration: ${paper.duration} min | Total Marks: ${paper.totalMarks}`,
    "Instructions: Attempt all sections. Write clearly. Calculators not allowed.",
    "",
  ];

  paper.sections.forEach((section, sectionIndex) => {
    lines.push(sectionTitle(section, sectionIndex));
    section.questions.forEach((question) => {
      lines.push(`Q${question.no}. ${question.text} [${question.marks} mark${question.marks === 1 ? "" : "s"}]`);
      if (question.options) {
        question.options.forEach((option, optionIndex) => {
          lines.push(`   (${String.fromCharCode(97 + optionIndex)}) ${option}`);
        });
      }
    });
    lines.push("");
  });

  return lines.join("\n");
}

function BlankLines({ count }) {
  return (
    <div className="mt-2 space-y-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-7 border-b border-[#DDD]" />
      ))}
    </div>
  );
}

function PaperCard({ paper, schoolName }) {
  return (
    <article className="paper-preview-card mx-auto my-6 w-full max-w-[720px] rounded-lg bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.08)] sm:p-10">
      <header className="text-center">
        <h2 className="text-lg font-bold text-[var(--text-dark)]">{schoolName}</h2>
        <div className="my-4 border-t-[1.5px] border-[#333]" />
        <h1 className="text-[22px] font-bold text-[var(--text-dark)]">{paper.title}</h1>
        <p className="mt-3 text-center text-[13px] text-[var(--text-muted)]">
          Subject: {paper.subject} | Grade: {paper.grade} | Duration: {paper.duration} min | Total Marks: {paper.totalMarks}
        </p>
        <div className="my-4 border-t-[1.5px] border-[#333]" />
        <p className="text-left text-sm italic text-[var(--text-muted)]">
          Instructions: Attempt all sections. Write clearly. Calculators not allowed.
        </p>
      </header>

      <div className="mt-8 space-y-8">
        {paper.sections.map((section, sectionIndex) => (
          <section key={`${section.name}-${sectionIndex}`}>
            <h3 className="mb-3 border-b-2 border-[var(--primary)] pb-2 text-sm font-bold uppercase text-[var(--primary)]">
              {sectionTitle(section, sectionIndex)}
            </h3>
            <div className="space-y-4">
              {section.questions.map((question) => (
                <div key={`${section.name}-${question.no}`} className="text-sm leading-6 text-[var(--text-dark)]">
                  <p>
                    Q{question.no}. {question.text} [{question.marks} mark{question.marks === 1 ? "" : "s"}]
                  </p>
                  {question.options ? (
                    <div className="mt-2 grid gap-1 pl-5 text-[13px] text-[var(--text-muted)] sm:grid-cols-2">
                      {question.options.map((option, optionIndex) => (
                        <p key={option}>
                          ({String.fromCharCode(97 + optionIndex)}) {option}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {question.type === "LongAnswer" ? <BlankLines count={6} /> : null}
                  {question.type === "ShortAnswer" ? <BlankLines count={3} /> : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

export function PaperPreviewPanel({ paper, onToast }) {
  const user = getUser();
  const schoolName = user?.school || "Riverside High School";

  const copyPaper = async () => {
    if (!paper) return;
    await navigator.clipboard?.writeText(plainTextPaper(paper, schoolName));
    onToast?.("Copied to clipboard!", "success");
  };

  const printPaper = () => {
    if (!paper) return;
    window.print();
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }
            .paper-preview-card, .paper-preview-card * {
              visibility: visible !important;
            }
            .paper-preview-card {
              position: absolute !important;
              inset: 0 auto auto 0 !important;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
          }
        `}
      </style>

      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <h2 className="text-base font-bold text-[var(--text-dark)]">Live Preview</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={printPaper}
            className="rounded-lg bg-[var(--bg-cream)] p-2 text-[var(--text-muted)] hover:text-[var(--primary)]"
            aria-label="Download paper"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={copyPaper}
            className="rounded-lg bg-[var(--bg-cream)] p-2 text-[var(--text-muted)] hover:text-[var(--primary)]"
            aria-label="Copy paper"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-lg bg-[var(--bg-cream)] p-2 text-[var(--text-muted)] hover:text-[var(--primary)]"
            aria-label="Maximize preview"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {paper ? (
        <PaperCard paper={paper} schoolName={schoolName} />
      ) : (
        <div className="grid min-h-[calc(100vh-73px)] place-items-center px-6 text-center">
          <div>
            <FileText className="mx-auto h-16 w-16 text-[#C5BDB4]" />
            <p className="mt-5 max-w-sm text-base font-bold text-[var(--text-dark)]">
              Configure your exam on the left to see a live preview here.
            </p>
            <p className="mt-3 font-mono text-xs text-[var(--text-muted)]">
              QUESTION DISTRIBUTION · DIFFICULTY BREAKDOWN
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
