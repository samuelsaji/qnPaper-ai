import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Loader2, ChevronRight, FileText, Zap, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import {
  apiGetTemplates,
  apiCreateTemplate,
  apiProcessTemplate,
  apiUploadQuestionPapers,
  apiGetGeneratedPapers,
  apiGetGeneratedPaper,
  apiGetLayout,
} from "../utils/api";

// ── helpers ───────────────────────────────────────────────────────────────────

const getTimeAgo = (timestamp) => {
  if (!timestamp) return "Just now";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "Just now";
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
};

// ── Step indicator ────────────────────────────────────────────────────────────

function StepBadge({ step, current }) {
  const done = current > step;
  const active = current === step;
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0,
      backgroundColor: done ? "#2563EB" : active ? "#EFF6FF" : "#F1F5F9",
      color: done ? "white" : active ? "#2563EB" : "#9CA3AF",
      border: active ? "2px solid #2563EB" : "2px solid transparent",
    }}>
      {done ? "✓" : step}
    </div>
  );
}

// ── File picker ───────────────────────────────────────────────────────────────

function FilePicker({ label, files, onChange, accept = ".pdf", multiple = true }) {
  const ref = useRef();
  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>{label}</p>
      <div onClick={() => ref.current?.click()} style={{ border: "2px dashed #D1D5DB", borderRadius: 10, padding: "14px 16px", cursor: "pointer", textAlign: "center", color: "#9CA3AF", fontSize: 13, backgroundColor: "#FAFAFA" }}>
        <Upload style={{ width: 18, height: 18, margin: "0 auto 4px" }} />
        Click to select PDF{multiple ? "s" : ""}
      </div>
      <input ref={ref} type="file" accept={accept} multiple={multiple} style={{ display: "none" }}
        onChange={(e) => onChange(multiple ? [...files, ...Array.from(e.target.files)] : [e.target.files[0]])}
      />
      {files.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, backgroundColor: "#EFF6FF", borderRadius: 6, padding: "4px 10px" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{f.name}</span>
              <button type="button" onClick={() => onChange(files.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, marginLeft: 8 }}><X size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Template Choice Modal ─────────────────────────────────────────────────────

function TemplateChoiceModal({ templates, onClose, onSelectExisting, onCreateNew }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)", padding: 20 }}>
      <div style={{ backgroundColor: "white", borderRadius: 16, width: "100%", maxWidth: 560, padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Choose or Create Template</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}><X size={20} /></button>
        </div>

        {/* Create new */}
        <button
          type="button"
          onClick={onCreateNew}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 12, border: "2px solid #2563EB", backgroundColor: "#EFF6FF", cursor: "pointer", marginBottom: 20, textAlign: "left" }}
        >
          <div style={{ width: 44, height: 44, backgroundColor: "#2563EB", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1D4ED8" }}>Create New Template</div>
            <div style={{ fontSize: 12, color: "#3B82F6", marginTop: 2 }}>Upload syllabus, question papers and design your own layout</div>
          </div>
        </button>

        {/* Existing templates */}
        {templates.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Or use an existing template</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
              {templates.map((t) => (
                <button
                  key={t._id || t.id}
                  type="button"
                  onClick={() => onSelectExisting(t)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 10, border: "1px solid #E2E8F0", backgroundColor: "white", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, backgroundColor: "#F1F5F9", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📄</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{t.name || "Untitled"}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{t.total_marks} marks · {getTimeAgo(t.created_at)}</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#9CA3AF" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Create Template Modal ─────────────────────────────────────────────────────

function CreateTemplateModal({ userId, onClose, onCreated, onOpenLayout }) {
  const [step, setStep] = useState(1);
  const [templateId, setTemplateId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [totalMarks, setTotalMarks] = useState(100);
  const [syllabusFiles, setSyllabusFiles] = useState([]);
  const [qpFiles, setQpFiles] = useState([]);
  const stepLabels = ["Template Details", "Process Syllabus", "Upload Question Papers", "Design Layout"];

  const handleStep1 = async () => {
    setError("");
    if (!name.trim()) { setError("Template name is required."); return; }
    if (syllabusFiles.length === 0) { setError("Upload at least one syllabus PDF."); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("total_marks", totalMarks);
      fd.append("user_id", userId);
      syllabusFiles.forEach((f) => fd.append("pdf_files", f));
      const created = await apiCreateTemplate(fd);
      setTemplateId(created.template_id);
      setStep(2);
      await apiProcessTemplate(created.template_id);
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    setError("");
    if (qpFiles.length === 0) { setError("Upload at least one question paper PDF."); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("template_id", templateId);
      qpFiles.forEach((f) => fd.append("question_papers", f));
      await apiUploadQuestionPapers(fd);
      onCreated();
      setStep(4);
    } catch (err) {
      setError(err.message || "Failed to upload question papers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)", padding: 20 }}>
      <div style={{ backgroundColor: "white", borderRadius: 16, width: "100%", maxWidth: 520, padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Create New Template</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}><X size={20} /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          {stepLabels.map((label, i) => (
            <React.Fragment key={i}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StepBadge step={i + 1} current={step} />
                <span style={{ fontSize: 12, fontWeight: 600, color: step === i + 1 ? "#2563EB" : step > i + 1 ? "#111827" : "#9CA3AF" }}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && <ChevronRight size={14} style={{ color: "#D1D5DB", flexShrink: 0 }} />}
            </React.Fragment>
          ))}
        </div>
        {error && <div style={{ backgroundColor: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#B91C1C" }}>{error}</div>}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>Template Name</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Physics Mid-Term" style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid #D1D5DB", padding: "0 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>Total Marks</p>
              <input type="number" value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} style={{ width: "100%", height: 40, borderRadius: 8, border: "1px solid #D1D5DB", padding: "0 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <FilePicker label="Syllabus / Notes PDFs" files={syllabusFiles} onChange={setSyllabusFiles} />
            <button type="button" onClick={handleStep1} disabled={loading} style={{ height: 44, borderRadius: 10, backgroundColor: "#111827", color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              {loading ? "Creating & Processing..." : "Create Template →"}
            </button>
          </div>
        )}
        {step === 2 && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "#2563EB", margin: "0 auto 16px" }} />
            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>Processing Syllabus PDFs</p>
            <p style={{ fontSize: 13, color: "#6B7280" }}>AI is extracting topics and syllabus structure...</p>
          </div>
        )}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#15803D", fontWeight: 600 }}>✓ Syllabus processed successfully!</div>
            <FilePicker label="Previous Year Question Papers (PDFs)" files={qpFiles} onChange={setQpFiles} />
            <button type="button" onClick={handleStep3} disabled={loading} style={{ height: 44, borderRadius: 10, backgroundColor: "#2563EB", color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              {loading ? "Uploading & Processing..." : "Upload Question Papers →"}
            </button>
          </div>
        )}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#15803D", fontWeight: 600 }}>✓ Question papers uploaded successfully!</div>
            <p style={{ fontSize: 13, color: "#6B7280" }}>Now design your question paper layout — set the header, parts, and question structure for this template.</p>
            <button
              type="button"
              onClick={() => onOpenLayout && onOpenLayout(templateId)}
              style={{ height: 44, borderRadius: 10, backgroundColor: "#111827", color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              ✏️ Open Layout Builder →
            </button>
            <button type="button" onClick={onClose} style={{ height: 40, borderRadius: 10, backgroundColor: "transparent", color: "#6B7280", border: "1px solid #E2E8F0", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Skip for now
            </button>
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Generated Papers List (inside template card) ──────────────────────────────

function GeneratedPapersList({ templateId, onView }) {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingId, setViewingId] = useState(null);

  useEffect(() => {
    apiGetGeneratedPapers(templateId)
      .then((res) => setPapers(res.generated_papers || []))
      .catch(() => setPapers([]))
      .finally(() => setLoading(false));
  }, [templateId]);

  const handleView = async (p) => {
    setViewingId(p._id || p.id);
    try {
      const paperWithLayout = { ...p };

      // Only apply layout if this paper was generated with a custom layout
      const layoutId = p.usedLayoutId || p.layout_id;
      if (layoutId && layoutId !== "default" && Array.isArray(p.questions) && p.questions.length > 0) {
        const layoutRes = await apiGetLayout(layoutId).catch(() => null);
        if (layoutRes?.layout?.parts?.length) {
          const allQ = [...p.questions];
          let qi = 0;
          const filledParts = layoutRes.layout.parts.map((part) => ({
            ...part,
            questions: part.questions.map((pq) => {
              const gq = allQ[qi++];
              if (!gq) return pq;
              return {
                ...pq,
                primary: {
                  ...pq.primary,
                  text: gq.question_text || gq.question || gq.text || "",
                  marks: gq.marks || pq.primary.marks,
                },
              };
            }),
          }));
          paperWithLayout.layout = {
            ...layoutRes.layout,
            parts: filledParts,
            header: {
              ...layoutRes.layout.header,
              examTitle: p.examName || p.title || layoutRes.layout.header?.examTitle || "",
              subject: p.subject || layoutRes.layout.header?.subject || "",
              maxMarks: String(p.total_marks || layoutRes.layout.header?.maxMarks || ""),
            },
          };
        }
      }

      localStorage.setItem("qp_current_paper", JSON.stringify(paperWithLayout));
      navigate("/paper-preview");
    } catch {
      localStorage.setItem("qp_current_paper", JSON.stringify(p));
      navigate("/paper-preview");
    } finally {
      setViewingId(null);
    }
  };

  if (loading) return (
    <div style={{ padding: "16px 0", textAlign: "center" }}>
      <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "#2563EB", margin: "0 auto" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (papers.length === 0) return (
    <div style={{ padding: "12px 0", fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>No papers generated yet.</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
      {papers.map((p, i) => {
        const qCount = p.question_count || (p.questions || []).length || 0;
        const marks = p.total_marks || "—";
        const date = getTimeAgo(p.generated_at || p.created_at);
        const isLoading = viewingId === (p._id || p.id);
        return (
          <div key={p._id || i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F8FAFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Paper #{i + 1}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{qCount} questions · {marks} marks · {date}</div>
            </div>
            <button
              onClick={() => handleView(p)}
              disabled={isLoading}
              style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: isLoading ? "wait" : "pointer", opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Eye size={13} />}
              {isLoading ? "Loading…" : "View"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Full Paper Preview Modal ──────────────────────────────────────────────────

function PaperPreviewModal({ paper, onClose }) {
  const questions = paper.questions || [];
  const isAI = Array.isArray(questions);

  const typeOrder = [];
  const byType = {};
  if (isAI) {
    questions.forEach((q) => {
      const raw = q.type || q.question_type || "general";
      const type = raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      if (!byType[type]) { byType[type] = []; typeOrder.push(type); }
      byType[type].push(q);
    });
  }

  const examName = paper.examName || paper.title || "Question Paper";
  const subject = paper.subject || "—";
  const totalMarks = paper.total_marks || paper.totalMarks || "—";

  const handlePrint = () => {
    // Build self-contained HTML for a new print window
    let questionsHtml = "";
    if (isAI && typeOrder.length > 0) {
      typeOrder.forEach((type, si) => {
        const qs = byType[type];
        const sectionMarks = qs.reduce((s, q) => s + (Number(q.marks) || 0), 0);
        questionsHtml += `
          <div style="margin-bottom:32px">
            <h3 style="border-bottom:1px solid #ccc;padding-bottom:8px;font-size:16px;font-weight:bold">
              Section ${String.fromCharCode(65 + si)} — ${type}
              <span style="float:right;font-size:14px">[${sectionMarks} marks]</span>
            </h3>
            ${qs.map((q, i) => `
              <div style="margin-bottom:20px">
                <p style="font-weight:500;margin:0 0 4px 0">
                  ${q.question_number || i + 1}. ${q.question_text || q.question || q.text}
                  <span style="float:right;font-size:12px">[${q.marks} mark${q.marks !== 1 ? "s" : ""}]</span>
                </p>
                ${q.options ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-left:16px;font-size:14px">
                  ${q.options.map((opt, j) => `<span>${String.fromCharCode(97 + j)}) ${typeof opt === "object" ? opt.text : opt}</span>`).join("")}
                </div>` : ""}
              </div>
            `).join("")}
          </div>`;
      });
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${examName}</title>
  <style>
    body { font-family: serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h2, h3, p { margin: 0; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div style="text-align:center;border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:24px">
    <h2 style="font-size:18px;font-weight:bold">${examName}</h2>
    <p style="margin:4px 0">Subject: ${subject} | Max Marks: ${totalMarks}</p>
    <p style="margin:4px 0;font-size:13px;color:#666">Date: _____________ | Name: _________________________ | Roll No: _______</p>
  </div>
  <div style="margin-bottom:24px">
    <strong>General Instructions:</strong>
    <ol style="font-size:13px;line-height:1.8;margin-top:8px">
      <li>All questions are compulsory.</li>
      <li>Read each question carefully before answering.</li>
      <li>Marks for each question are indicated in brackets.</li>
    </ol>
  </div>
  ${questionsHtml}
  <div style="text-align:center;border-top:1px solid #ccc;padding-top:12px;font-size:12px;color:#888;margin-top:40px">
    *** End of Question Paper ***
  </div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto" }}>
      <div style={{ backgroundColor: "white", borderRadius: 12, width: "100%", maxWidth: 800, position: "relative" }}>
        {/* Modal action bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, backgroundColor: "white", zIndex: 1, borderRadius: "12px 12px 0 0" }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{examName}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handlePrint}
              style={{ backgroundColor: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              🖨️ Download / Print
            </button>
            <button onClick={onClose} style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 12px", cursor: "pointer", color: "#6B7280" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Paper content */}
        <div id="paper-content" style={{ padding: "40px", fontFamily: "serif" }}>
          {/* Header */}
          <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 16, marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: "bold", margin: 0 }}>{examName}</h2>
            <p style={{ margin: "4px 0" }}>Subject: {subject} | Max Marks: {totalMarks}</p>
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
            </ol>
          </div>

          {/* Questions */}
          {isAI && typeOrder.length > 0
            ? typeOrder.map((type, si) => (
                <div key={type} style={{ marginBottom: 32 }}>
                  <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: 8, fontSize: 16, fontWeight: "bold" }}>
                    Section {String.fromCharCode(65 + si)} — {type}
                    <span style={{ float: "right", fontSize: 14 }}>
                      [{byType[type].reduce((s, q) => s + (Number(q.marks) || 0), 0)} marks]
                    </span>
                  </h3>
                  {byType[type].map((q, i) => (
                    <div key={i} style={{ marginBottom: 20 }}>
                      <p style={{ fontWeight: 500, margin: "0 0 4px 0" }}>
                        {q.question_number || i + 1}. {q.question_text || q.question || q.text}
                        <span style={{ float: "right", fontSize: 12 }}>[{q.marks} mark{q.marks !== 1 ? "s" : ""}]</span>
                      </p>
                      {q.options && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginLeft: 16, fontSize: 14 }}>
                          {q.options.map((opt, j) => <span key={j}>{String.fromCharCode(97 + j)}) {typeof opt === "object" ? opt.text : opt}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            : <p style={{ color: "#9CA3AF", fontSize: 13 }}>No questions found in this paper.</p>
          }

          <div style={{ textAlign: "center", borderTop: "1px solid #ccc", paddingTop: 12, fontSize: 12, color: "#888", marginTop: 40 }}>
            *** End of Question Paper ***
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body > * { display: none !important; }
          #paper-content { display: block !important; padding: 40px; font-family: serif; }
        }
      `}</style>
    </div>
  );
}

// ── Template Card ─────────────────────────────────────────────────────────────

function TemplateCard({ t, onGenerateClick }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [viewPaper, setViewPaper] = useState(null);
  const id = t._id || t.id;

  return (
    <>
      <div style={{ backgroundColor: "white", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: 20 }}>
          <div style={{ width: 40, height: 40, backgroundColor: "#EFF6FF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 18 }}>📄</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{t.name || "Untitled"}</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
            {t.total_marks} marks · {(t.pdf_files || []).length} file{(t.pdf_files || []).length !== 1 ? "s" : ""}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {t.questions && <span style={{ fontSize: 11, padding: "3px 10px", border: "1px solid #BBF7D0", borderRadius: 999, color: "#15803D", backgroundColor: "#F0FDF4" }}>✓ Questions ready</span>}
            {t.question_papers && <span style={{ fontSize: 11, padding: "3px 10px", border: "1px solid #BFDBFE", borderRadius: 999, color: "#2563EB" }}>{(t.question_papers || []).length} PYQs</span>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>{getTimeAgo(t.created_at)}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setExpanded((v) => !v)}
                style={{ display: "flex", alignItems: "center", gap: 4, backgroundColor: "white", color: "#374151", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                Papers
              </button>
              <button
                onClick={() => onGenerateClick(t)}
                style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#2563EB", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                <Zap size={12} /> Generate
              </button>
            </div>
          </div>
        </div>

        {/* Expanded generated papers list */}
        {expanded && (
          <div style={{ borderTop: "1px solid #F1F5F9", padding: "12px 20px 16px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Generated Papers</p>
            <GeneratedPapersList templateId={id} onView={(p) => setViewPaper(p)} />
          </div>
        )}
      </div>

      {viewPaper && <PaperPreviewModal paper={viewPaper} onClose={() => setViewPaper(null)} />}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchTemplates = async () => {
    if (!currentUser?.user_id) return;
    setLoadingTemplates(true);
    try {
      const data = await apiGetTemplates(currentUser.user_id);
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, [currentUser]);

  const handleGenerateClick = (template) => {
    const tid = template._id || template.id;
    localStorage.setItem("qp_selected_template_id", tid);
    localStorage.setItem("qp_selected_template_name", template.name || "");
    const cached = localStorage.getItem(`qp_cfg_${tid}`);
    if (cached) {
      localStorage.setItem("qp_template_prefill", cached);
      localStorage.setItem("qp_prefill_source", "template_use");
    }
    navigate("/generate");
  };

  const handleTemplateCreated = () => {
    fetchTemplates();
    showToast("Template created successfully!");
  };

  return (
    <div style={{ padding: 32, backgroundColor: "#F0F4F8", minHeight: "100vh" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>Templates</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{templates.length} template{templates.length !== 1 ? "s" : ""} found</p>
        </div>
        <button onClick={() => setShowChoiceModal(true)} style={{ backgroundColor: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          + New Template
        </button>
      </div>

      {/* Grid */}
      {loadingTemplates ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#6B7280" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          <p>Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div style={{ backgroundColor: "white", border: "2px dashed #E2E8F0", borderRadius: 16, padding: "48px 32px", textAlign: "center" }}>
          <FileText size={40} style={{ color: "#D1D5DB", margin: "0 auto 16px" }} />
          <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>No templates yet</p>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>Create your first template by uploading a syllabus and question papers.</p>
          <button onClick={() => setShowChoiceModal(true)} style={{ backgroundColor: "#2563EB", color: "white", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>+ Create Template</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {templates.map((t) => (
            <TemplateCard key={t._id || t.id} t={t} onGenerateClick={handleGenerateClick} />
          ))}
        </div>
      )}

      {/* Choice modal: Choose existing or create new */}
      {showChoiceModal && (
        <TemplateChoiceModal
          templates={templates}
          onClose={() => setShowChoiceModal(false)}
          onSelectExisting={(t) => {
            setShowChoiceModal(false);
            navigate(`/template/${t._id || t.id}`);
          }}
          onCreateNew={() => {
            setShowChoiceModal(false);
            setShowCreateModal(true);
          }}
        />
      )}

      {showCreateModal && (
        <CreateTemplateModal
          userId={currentUser?.user_id}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTemplateCreated}
          onOpenLayout={(templateId) => {
            setShowCreateModal(false);
            navigate(`/layout/${templateId}`);
          }}
        />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1001, borderRadius: 12, backgroundColor: "#111827", padding: "14px 20px", fontSize: 14, fontWeight: 700, color: "white", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
