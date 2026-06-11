import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Layout-based rendering (uses saved QuestionPaperLayout structure) ─────────

function LayoutPaper({ paper }) {
  const layout = paper.layout;
  const header = layout.header || {};
  const parts = layout.parts || [];
  let qNum = 0;

  const totalMarks = parts.reduce((s, p) =>
    s + (p.questions || []).reduce((a, q) => a + (q.primary?.marks || 0), 0), 0);

  return (
    <div style={{ fontFamily: "Georgia, serif", fontSize: 14 }}>
      {/* Header */}
      <div style={{ borderBottom: "2.5px solid #111", paddingBottom: 20, marginBottom: 20, textAlign: "center" }}>
        {header.logo && <img src={header.logo} alt="logo" style={{ width: 64, height: 64, objectFit: "contain", marginBottom: 8 }} />}
        <div style={{ fontSize: 18, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#111" }}>
          {header.collegeName || paper.examName || "Question Paper"}
        </div>
        {header.examTitle && <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginTop: 4 }}>{header.examTitle}</div>}
        <div style={{ marginTop: 10, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 32px", fontSize: 12, color: "#374151" }}>
          {(header.subject || paper.subject) && <span><strong>Subject:</strong> {header.subject || paper.subject}{header.subjectCode ? ` (${header.subjectCode})` : ""}</span>}
          {header.semester && <span><strong>Class:</strong> {header.semester}</span>}
          {header.date && <span><strong>Date:</strong> {header.date}</span>}
          {header.duration && <span><strong>Duration:</strong> {header.duration}</span>}
          <span><strong>Max Marks:</strong> {header.maxMarks || totalMarks || paper.totalMarks}</span>
        </div>
        <div style={{ marginTop: 10, borderTop: "1px dashed #ccc", paddingTop: 8, display: "flex", gap: 40, justifyContent: "center", fontSize: 12, color: "#555" }}>
          <span>Name: ________________________________</span>
          <span>Roll No: ______________</span>
          <span>Reg No: ______________</span>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ marginBottom: 20, padding: "10px 0", borderBottom: "1px solid #eee" }}>
        <strong style={{ fontSize: 13 }}>General Instructions:</strong>
        <ol style={{ fontSize: 13, lineHeight: 1.9, marginTop: 6, paddingLeft: 20 }}>
          <li>All questions are compulsory unless stated otherwise.</li>
          <li>Read each question carefully before answering.</li>
          <li>Marks for each question are indicated in brackets [ ].</li>
          {paper.instructions && <li>{paper.instructions}</li>}
        </ol>
      </div>

      {/* Parts */}
      {parts.map((part, pi) => {
        const partMarks = (part.questions || []).reduce((s, q) => s + (q.primary?.marks || 0), 0);
        return (
          <div key={part.id || pi} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1.5px solid #999", paddingBottom: 6, marginBottom: 14 }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>{part.name}</span>
                {part.instruction && <span style={{ marginLeft: 10, fontSize: 12, color: "#666", fontStyle: "italic" }}>({part.instruction})</span>}
              </div>
              <span style={{ fontSize: 12, color: "#666", fontWeight: 600 }}>[{partMarks} marks]</span>
            </div>

            {(part.questions || []).map((q, qi) => {
              qNum++;
              const n = qNum;
              const text = q.primary?.text || "";
              const marks = q.primary?.marks || 0;
              return (
                <div key={q.id || qi} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontWeight: 700, minWidth: 24, flexShrink: 0 }}>{n}.</span>
                    <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                      <p style={{ margin: 0, lineHeight: 1.75, flex: 1, color: text ? "#111" : "#aaa", fontStyle: text ? "normal" : "italic" }}>
                        {text || "Question not generated"}
                      </p>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#555", background: "#f3f4f6", padding: "2px 8px", borderRadius: 4, flexShrink: 0 }}>
                        [{marks} mark{marks !== 1 ? "s" : ""}]
                      </span>
                    </div>
                  </div>
                  {q.mode === "or" && q.alternative?.text && (
                    <div style={{ marginLeft: 34, marginTop: 8 }}>
                      <p style={{ textAlign: "center", fontSize: 11, color: "#999", fontWeight: 700, margin: "4px 0 8px" }}>— OR —</p>
                      <div style={{ display: "flex", gap: 10 }}>
                        <span style={{ fontWeight: 700, minWidth: 24, flexShrink: 0 }}>{n}.</span>
                        <div style={{ flex: 1, display: "flex", justifyContent: "space-between", gap: 16 }}>
                          <p style={{ margin: 0, lineHeight: 1.75, flex: 1 }}>{q.alternative.text}</p>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#555", background: "#f3f4f6", padding: "2px 8px", borderRadius: 4 }}>
                            [{q.alternative.marks || marks} mark{(q.alternative.marks || marks) !== 1 ? "s" : ""}]
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      <div style={{ textAlign: "center", borderTop: "1px solid #ddd", paddingTop: 12, fontSize: 12, color: "#999", marginTop: 24 }}>
        ✦ ✦ ✦ &nbsp; End of Question Paper &nbsp; ✦ ✦ ✦
      </div>
    </div>
  );
}

// ── Default AI questions grouped by type ──────────────────────────────────────

function AIQuestions({ questions }) {
  const typeOrder = [];
  const byType = {};
  (questions || []).forEach((q) => {
    const raw = q.type || q.question_type || "general";
    const type = raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (!byType[type]) { byType[type] = []; typeOrder.push(type); }
    byType[type].push(q);
  });

  let globalN = 0;
  return typeOrder.map((type, si) => {
    const qs = byType[type];
    const secMarks = qs.reduce((s, q) => s + (Number(q.marks) || 0), 0);
    return (
      <div key={type} style={{ marginBottom: 32 }}>
        <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8, fontSize: 15, fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
          <span>Section {String.fromCharCode(65 + si)} — {type}</span>
          <span style={{ fontSize: 13 }}>[{secMarks} marks]</span>
        </h3>
        {qs.map((q, i) => {
          globalN++;
          return (
            <div key={i} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <p style={{ fontWeight: 500, margin: "0 0 4px 0", flex: 1 }}>
                  {globalN}. {q.question_text || q.question || q.text}
                </p>
                <span style={{ fontSize: 12, color: "#666", flexShrink: 0 }}>[{q.marks} mark{q.marks !== 1 ? "s" : ""}]</span>
              </div>
              {q.options && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginLeft: 16, fontSize: 13 }}>
                  {q.options.map((opt, j) => <span key={j}>{String.fromCharCode(97 + j)}) {typeof opt === "object" ? opt.text : opt}</span>)}
                </div>
              )}
              {!q.options && <div style={{ borderBottom: "1px solid #f0f0f0", marginTop: 8 }} />}
            </div>
          );
        })}
      </div>
    );
  });
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PaperPreviewPage() {
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    const raw = localStorage.getItem("qp_current_paper");
    if (!raw) { navigate("/generate"); return; }
    try { setPaper(JSON.parse(raw)); } catch { navigate("/generate"); }
  }, []);

  if (!paper) return <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Loading paper...</div>;

  const hasLayout = !!paper.layout?.parts?.length;
  const isAI = paper.source === "ai" || Array.isArray(paper.questions);
  const examName = paper.examName || paper.title || "Question Paper";
  const subject = paper.subject || "—";
  const totalMarks = paper.total_marks || paper.totalMarks || "—";
  const questionCount = paper.question_count || (isAI ? (paper.questions || []).length : null);

  const handlePrint = () => {
    const win = window.open("", "_blank");
    const content = document.getElementById("paper-content")?.innerHTML || "";
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
      <title>${examName}</title>
      <style>body{font-family:Georgia,serif;padding:40px;max-width:800px;margin:0 auto}
      h2,h3,p{margin:0}@media print{body{padding:20px}}</style>
    </head><body>${content}
    <script>window.onload=function(){window.print();}<\/script></body></html>`);
    win.document.close();
  };

  return (
    <div style={{ padding: "32px 40px", backgroundColor: "#F0F4F8", minHeight: "100vh" }}>
      <style>{`@media print{.no-print{display:none!important}#paper-content{box-shadow:none!important;border:none!important}body{background:white!important}main{margin:0!important;padding:0!important}}`}</style>

      {/* Action bar */}
      <div className="no-print" style={{ display: "flex", gap: 12, maxWidth: 800, margin: "0 auto 16px", flexWrap: "wrap" }}>
        <button onClick={() => navigate("/generate")} style={btn("outline")}>← Back</button>
        <button onClick={handlePrint} style={btn("primary")}>🖨️ Download / Print PDF</button>
        {paper.generation_id && (
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9CA3AF", alignSelf: "center" }}>ID: {paper.generation_id}</span>
        )}
      </div>

      {/* Badge */}
      {isAI && (
        <div className="no-print" style={{ maxWidth: 800, margin: "0 auto 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#15803D", fontWeight: 600 }}>
          ⚡ Generated by Gemini AI · {questionCount} questions
          {hasLayout && <span style={{ marginLeft: 12, color: "#2563EB" }}>📄 Using custom layout</span>}
        </div>
      )}

      {/* Paper */}
      <div id="paper-content" style={{ maxWidth: 800, margin: "0 auto", background: "white", padding: 40, fontFamily: "Georgia, serif", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #E2E8F0" }}>
        {hasLayout ? (
          <LayoutPaper paper={paper} />
        ) : (
          <>
            {/* Default header */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 16, marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: "bold", margin: 0 }}>{examName}</h2>
              <p style={{ margin: "4px 0", fontSize: 13 }}>Subject: {subject} | Max Marks: {totalMarks}</p>
              <p style={{ margin: "4px 0", fontSize: 12, color: "#666" }}>Date: _____________ | Name: _________________________ | Roll No: _______</p>
            </div>
            <div style={{ marginBottom: 24 }}>
              <strong>General Instructions:</strong>
              <ol style={{ fontSize: 13, lineHeight: 1.8, marginTop: 8 }}>
                <li>All questions are compulsory.</li>
                <li>Read each question carefully before answering.</li>
                <li>Marks for each question are indicated in brackets.</li>
                {paper.instructions && <li>{paper.instructions}</li>}
              </ol>
            </div>
            {isAI
              ? <AIQuestions questions={paper.questions} />
              : <MockQuestions questions={paper.questions || {}} />
            }
            <div style={{ textAlign: "center", borderTop: "1px solid #ccc", paddingTop: 12, fontSize: 12, color: "#888", marginTop: 40 }}>*** End of Question Paper ***</div>
          </>
        )}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1001, borderRadius: 12, backgroundColor: "#111827", padding: "14px 20px", fontSize: 14, fontWeight: 700, color: "white" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function MockQuestions({ questions }) {
  return (
    <>
      {questions.mcq?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8, fontSize: 15, fontWeight: "bold" }}>Section A — MCQ</h3>
          {questions.mcq.map((q, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 500, margin: "0 0 6px" }}>{i + 1}. {q.question} <span style={{ float: "right", fontSize: 12 }}>[{q.marks}]</span></p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginLeft: 16, fontSize: 13 }}>
                {q.options?.map((o, j) => <span key={j}>{String.fromCharCode(97 + j)}) {o}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
      {questions.shortAnswer?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8, fontSize: 15, fontWeight: "bold" }}>Section B — Short Answer</h3>
          {questions.shortAnswer.map((q, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <p style={{ fontWeight: 500, margin: 0 }}>{i + 1}. {q.question} <span style={{ float: "right", fontSize: 12 }}>[{q.marks}]</span></p>
              <div style={{ borderBottom: "1px solid #eee", marginTop: 8 }} />
            </div>
          ))}
        </div>
      )}
      {questions.longAnswer?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8, fontSize: 15, fontWeight: "bold" }}>Section C — Long Answer</h3>
          {questions.longAnswer.map((q, i) => (
            <div key={i} style={{ marginBottom: 24 }}>
              <p style={{ fontWeight: 500, margin: 0 }}>{i + 1}. {q.question} <span style={{ float: "right", fontSize: 12 }}>[{q.marks}]</span></p>
              <div style={{ borderBottom: "1px solid #eee", marginTop: 8 }} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function btn(variant) {
  const base = { borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 };
  return variant === "primary"
    ? { ...base, backgroundColor: "#2563EB", color: "white", border: "none" }
    : { ...base, backgroundColor: "white", color: "#374151", border: "1px solid #D1D5DB" };
}
