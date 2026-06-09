import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Render questions from the AI backend (flat array with type field)
function AIQuestions({ questions }) {
  const typeOrder = [];
  const byType = {};
  (questions || []).forEach((q) => {
    const raw = q.type || q.question_type || "general";
    const type = raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (!byType[type]) { byType[type] = []; typeOrder.push(type); }
    byType[type].push(q);
  });

  return typeOrder.map((type, si) => {
    const qs = byType[type];
    return (
      <div key={type} style={{ marginBottom: 32 }}>
        <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8, fontSize: 16, fontWeight: "bold" }}>
          Section {String.fromCharCode(65 + si)} — {type}
          <span style={{ float: "right", fontSize: 14 }}>
            [{qs.reduce((s, q) => s + (Number(q.marks) || 0), 0)} marks]
          </span>
        </h3>
        {qs.map((q, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 500, margin: "0 0 4px 0" }}>
              {q.question_number || i + 1}. {q.question_text || q.question || q.text}
              <span style={{ float: "right", fontSize: 12 }}>[{q.marks} mark{q.marks !== 1 ? "s" : ""}]</span>
            </p>
            {q.topic && (
              <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 4px 16px" }}>
                Topic: {q.topic}{q.difficulty ? ` · ${q.difficulty}` : ""}
              </p>
            )}
            {q.options && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginLeft: 16, fontSize: 14 }}>
                {q.options.map((opt, j) => (
                  <span key={j}>{String.fromCharCode(97 + j)}) {typeof opt === "object" ? opt.text || JSON.stringify(opt) : opt}</span>
                ))}
              </div>
            )}
            {!q.options && (
              <div style={{ borderBottom: "1px solid #eee", marginTop: 8, marginBottom: 8 }} />
            )}
          </div>
        ))}
      </div>
    );
  });
}

// Render questions from the mock local generator (object with mcq / shortAnswer / longAnswer keys)
function MockQuestions({ questions }) {
  return (
    <>
      {questions.mcq?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8, fontSize: 16, fontWeight: "bold" }}>
            Section A — Multiple Choice Questions
            <span style={{ float: "right", fontSize: 14 }}>
              [{questions.mcq.length} × {questions.mcq[0]?.marks} = {questions.mcq.reduce((s, q) => s + q.marks, 0)} marks]
            </span>
          </h3>
          {questions.mcq.map((q, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 500, margin: "0 0 8px 0" }}>
                {i + 1}. {q.question}
                <span style={{ float: "right", fontSize: 12 }}>[{q.marks} mark]</span>
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginLeft: 16, fontSize: 14 }}>
                {q.options?.map((opt, j) => <span key={j}>{String.fromCharCode(97 + j)}) {opt}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {questions.shortAnswer?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8, fontSize: 16, fontWeight: "bold" }}>
            Section B — Short Answer Questions
            <span style={{ float: "right", fontSize: 14 }}>
              [{questions.shortAnswer.length} × {questions.shortAnswer[0]?.marks} = {questions.shortAnswer.reduce((s, q) => s + q.marks, 0)} marks]
            </span>
          </h3>
          {questions.shortAnswer.map((q, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <p style={{ fontWeight: 500, margin: "0 0 8px 0" }}>
                {i + 1}. {q.question}
                <span style={{ float: "right", fontSize: 12 }}>[{q.marks} marks]</span>
              </p>
              <div style={{ borderBottom: "1px solid #eee", marginTop: 8, marginBottom: 8 }} />
            </div>
          ))}
        </div>
      )}

      {questions.longAnswer?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8, fontSize: 16, fontWeight: "bold" }}>
            Section C — Long Answer Questions
            <span style={{ float: "right", fontSize: 14 }}>
              [{questions.longAnswer.length} × {questions.longAnswer[0]?.marks} = {questions.longAnswer.reduce((s, q) => s + q.marks, 0)} marks]
            </span>
          </h3>
          {questions.longAnswer.map((q, i) => (
            <div key={i} style={{ marginBottom: 28 }}>
              <p style={{ fontWeight: 500, margin: "0 0 8px 0" }}>
                {i + 1}. {q.question}
                <span style={{ float: "right", fontSize: 12 }}>[{q.marks} marks]</span>
              </p>
              <div style={{ borderBottom: "1px solid #eee", marginTop: 8, marginBottom: 8 }} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

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

  if (!paper) {
    return <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Loading paper...</div>;
  }

  // Detect format
  const isAI = paper.source === "ai" || (paper.questions && Array.isArray(paper.questions));
  const totalMarks = paper.total_marks || paper.totalMarks || "—";
  const duration = paper.duration || "—";
  const subject = paper.subject || "—";
  const grade = paper.grade || "—";
  const examName = paper.examName || paper.title || "Question Paper";
  const questionCount = paper.question_count || (isAI ? (paper.questions || []).length : null);

  return (
    <div style={{ padding: "32px 40px", backgroundColor: "#F0F4F8", minHeight: "100vh" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          #paper-content { padding: 0 !important; box-shadow: none !important; margin: 0 auto !important; width: 100% !important; max-width: 100% !important; border: none !important; }
          body { background: white !important; }
          main { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      {/* Action buttons */}
      <div className="no-print" style={{ display: "flex", gap: 12, marginBottom: 24, maxWidth: 800, margin: "0 auto 24px" }}>
        <button onClick={() => navigate("/generate")} style={btnStyle("outline")}>← Back</button>
        <button onClick={() => window.print()} style={btnStyle("primary")}>🖨️ Download / Print PDF</button>
        <button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast("Link copied!"); }} style={btnStyle("outline")}>🔗 Share</button>
        {paper.generation_id && (
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9CA3AF", alignSelf: "center" }}>
            ID: {paper.generation_id}
          </span>
        )}
      </div>

      {/* AI badge */}
      {isAI && (
        <div className="no-print" style={{ maxWidth: 800, margin: "0 auto 16px", backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#15803D", fontWeight: 600 }}>
          ⚡ Generated by Gemini AI · {questionCount} questions
        </div>
      )}

      {/* Paper */}
      <div id="paper-content" style={{ maxWidth: 800, margin: "0 auto", background: "white", padding: 40, fontFamily: "serif", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #E2E8F0" }}>
        {/* Header */}
        <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 16, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: "bold", margin: 0 }}>{examName}</h2>
          <p style={{ margin: "4px 0" }}>Subject: {subject} | Grade: {grade} | Duration: {duration} min | Max Marks: {totalMarks}</p>
          <p style={{ margin: "4px 0", fontSize: 13, color: "#666" }}>
            Date: _____________ | Name: _________________________ | Roll No: _______
          </p>
        </div>

        {/* Instructions */}
        <div style={{ marginBottom: 24 }}>
          <strong>General Instructions:</strong>
          <ol style={{ fontSize: 13, lineHeight: 1.8, marginTop: 8 }}>
            <li>All questions are compulsory.</li>
            <li>Read each question carefully before answering.</li>
            <li>Marks for each question are indicated in brackets.</li>
            {paper.instructions && <li>{paper.instructions}</li>}
          </ol>
        </div>

        {/* Questions */}
        {isAI
          ? <AIQuestions questions={paper.questions} />
          : <MockQuestions questions={paper.questions || {}} />
        }

        {/* Footer */}
        <div style={{ textAlign: "center", borderTop: "1px solid #ccc", paddingTop: 12, fontSize: 12, color: "#888", marginTop: 40 }}>
          *** End of Question Paper ***
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1001, borderRadius: 12, backgroundColor: "#111827", padding: "14px 20px", fontSize: 14, fontWeight: 700, color: "white" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function btnStyle(variant) {
  const base = { borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 };
  if (variant === "primary") return { ...base, backgroundColor: "#2563EB", color: "white", border: "none" };
  return { ...base, backgroundColor: "white", color: "#374151", border: "1px solid #D1D5DB" };
}
