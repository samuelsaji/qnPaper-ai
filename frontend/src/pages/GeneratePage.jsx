import { useEffect, useRef, useState, useContext } from "react";
import { ChevronRight, Loader2, Play, Save, X, FileText, BookOpen, AlertTriangle, HelpCircle, LayoutTemplate, Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { SourceCard } from "../components/SourceCard";
import { SectionBuilder } from "../components/SectionBuilder";
import { generatePaper } from "../utils/mockGenerate";
import { getTemplates, savePaper, saveTemplate } from "../utils/storage";
import { AuthContext } from "../context/AuthContext";
import { apiGetTemplates, apiGenerate, apiGetLayout, apiGetConfig, apiSaveConfig } from "../utils/api";

const examPresets = ["Midterm", "Final Exam", "Weekly Quiz", "Practice Test", "Unit Test"];
const subjects = [
  "Physics",
  "Mathematics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Geography",
  "Economics",
  "Computer Science",
  "Hindi",
  "Sanskrit",
  "EVS",
];

const defaultConfig = {
  examType: "Midterm",
  examName: "",
  subject: "",
  grade: "",
  difficulty: "Medium",
  totalMarks: 100,
  totalQuestions: 50,
  language: "English",
};

const defaultMatrix = [
  { type: "MCQ", count: 10, marksEach: 1, enabled: true },
  { type: "Short Answer", count: 5, marksEach: 2, enabled: true },
  { type: "Long Answer", count: 3, marksEach: 5, enabled: true },
  { type: "Case Study", count: 2, marksEach: 4, enabled: true },
  { type: "HOTS", count: 2, marksEach: 5, enabled: true },
];

const defaultBlooms = {
  Remember: 20,
  Understand: 20,
  Apply: 20,
  Analyze: 15,
  Evaluate: 15,
  Create: 10,
};

const defaultSections = [
  { id: 1, name: "Section A", questionTypes: ["MCQ"], timeLimit: 30, instructions: "Answer all objective questions." },
  { id: 2, name: "Section B", questionTypes: ["Short Answer", "Long Answer"], timeLimit: 60, instructions: "Show working details where appropriate." },
];

function selectClass(hasError = false) {
  return `h-[40px] w-full appearance-none rounded-lg border bg-white px-3 py-2 text-sm text-[#111827] outline-none ${
    hasError ? "border-[#DC2626]" : "border-[#D1D5DB] focus:border-[#2563EB]"
  }`;
}

function inputClass(hasError = false) {
  return `h-[40px] w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#111827] outline-none ${
    hasError ? "border-[#DC2626]" : "border-[#D1D5DB] focus:border-[#2563EB]"
  }`;
}

function AccordionItem({ title, isOpen, onToggle, children, isExpanded }) {
  return (
    <section
      className={`overflow-hidden rounded-xl bg-white border border-[#E2E8F0] shadow-sm transition-all ${
        isOpen ? "border-l-[3px] border-[#D97706]" : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer select-none items-center justify-between px-5 py-4 text-left border-b border-[#E2E8F0]"
      >
        <h2 className="text-sm font-bold text-[#111827]">{title}</h2>
        <ChevronRight
          className={`h-4 w-4 text-[#6B7280] transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        />
      </button>
      {isOpen && <div className="p-5 bg-white">{children}</div>}
    </section>
  );
}

function SaveTemplateModal({ name, onNameChange, onCancel, onSave }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-5">
      <div className="w-[440px] max-w-[90vw] rounded-[20px] bg-white p-8 shadow-xl border border-[#E2E8F0]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#111827]">Save as Template</h2>
          <button type="button" onClick={onCancel} className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F0F4F8]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#111827]">Template Name</span>
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="h-[40px] w-full appearance-none rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
            placeholder="Template Name"
          />
        </label>

        <div className="mt-7 flex justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-lg border border-[#111827] bg-white px-5 text-sm font-semibold text-[#111827] hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="h-11 rounded-lg bg-[#2563EB] px-5 text-sm font-semibold text-white hover:bg-[#1D4ED8] transition"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Default Layout Preview Modal ──────────────────────────────────────────────

function DefaultLayoutPreviewModal({ onClose, config, sections }) {
  const sampleSections = sections && sections.length > 0 ? sections : [
    { id: 1, name: "Section A", questionTypes: ["MCQ"] },
    { id: 2, name: "Section B", questionTypes: ["Short Answer", "Long Answer"] },
  ];

  const examName = config?.examName || "Question Paper";
  const subject = config?.subject || "—";
  const totalMarks = config?.totalMarks || 100;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto" }}>
      <div style={{ backgroundColor: "white", borderRadius: 12, width: "100%", maxWidth: 720 }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, backgroundColor: "white", zIndex: 1, borderRadius: "12px 12px 0 0" }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Default Layout — Structure Preview</span>
          <button onClick={onClose} style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 12px", cursor: "pointer", color: "#6B7280" }}>
            <X size={16} />
          </button>
        </div>

        {/* Paper structure */}
        <div style={{ padding: "40px 48px", fontFamily: "Georgia, serif", fontSize: 14 }}>
          {/* Header */}
          <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 16, marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: "bold", margin: 0 }}>{examName}</h2>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>Subject: {subject} | Max Marks: {totalMarks}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
              Date: _____________ | Name: _________________________ | Roll No: _______
            </p>
          </div>

          {/* Instructions */}
          <div style={{ marginBottom: 24 }}>
            <strong style={{ fontSize: 13 }}>General Instructions:</strong>
            <ol style={{ fontSize: 13, lineHeight: 1.9, marginTop: 8, paddingLeft: 20 }}>
              <li>All questions are compulsory.</li>
              <li>Read each question carefully before answering.</li>
              <li>Marks for each question are indicated in brackets.</li>
            </ol>
          </div>

          {/* Section placeholders */}
          {sampleSections.map((sec, si) => (
            <div key={sec.id || si} style={{ marginBottom: 24 }}>
              <div style={{ borderBottom: "1px solid #ccc", paddingBottom: 7, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: "bold", fontSize: 14 }}>{sec.name} — {(sec.questionTypes || []).join(", ")}</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>[AI generated]</span>
              </div>
              {/* Placeholder rows instead of actual questions */}
              {[1, 2, 3].map(n => (
                <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px dashed #f0f0f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    <span style={{ fontWeight: 600, color: "#9ca3af", minWidth: 20 }}>{si * 3 + n}.</span>
                    <div style={{ height: 10, backgroundColor: "#f3f4f6", borderRadius: 4, flex: 1 }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#d1d5db", marginLeft: 16, flexShrink: 0 }}>[— marks]</span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic", marginTop: 8 }}>
                Questions will be generated by AI based on your syllabus and previous papers.
              </p>
            </div>
          ))}

          <div style={{ textAlign: "center", borderTop: "1px solid #e5e7eb", paddingTop: 12, fontSize: 12, color: "#9ca3af", marginTop: 16 }}>
            *** Questions generated automatically by AI ***
          </div>
        </div>
      </div>
    </div>
  );
}


const questionBank = {
  Physics: {
    mcq: [
      { q: "What is the SI unit of force?", options: ["Newton", "Joule", "Watt", "Pascal"], answer: "Newton", marks: 1 },
      { q: "Which law states F = ma?", options: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Gravitation"], answer: "Newton's Second Law", marks: 1 },
      { q: "What is the speed of light in vacuum?", options: ["3×10⁸ m/s", "3×10⁶ m/s", "3×10¹⁰ m/s", "3×10⁴ m/s"], answer: "3×10⁸ m/s", marks: 1 },
      { q: "Which type of mirror is used in car headlights?", options: ["Concave", "Convex", "Plane", "Parabolic"], answer: "Concave", marks: 1 },
      { q: "What is the unit of electric resistance?", options: ["Ohm", "Volt", "Ampere", "Watt"], answer: "Ohm", marks: 1 },
      { q: "The phenomenon of bending of light around obstacles is called?", options: ["Reflection", "Refraction", "Diffraction", "Dispersion"], answer: "Diffraction", marks: 1 },
      { q: "Which particle has no charge?", options: ["Proton", "Electron", "Neutron", "Positron"], answer: "Neutron", marks: 1 },
      { q: "What is the formula for kinetic energy?", options: ["½mv²", "mv", "mgh", "Fd"], answer: "½mv²", marks: 1 },
    ],
    short: [
      { q: "Define Newton's Third Law of Motion with an example.", marks: 3 },
      { q: "What is the difference between speed and velocity?", marks: 3 },
      { q: "Explain Ohm's Law and state its limitations.", marks: 3 },
      { q: "What is total internal reflection? Give one application.", marks: 3 },
      { q: "Define magnetic field and state its SI unit.", marks: 3 },
    ],
    long: [
      { q: "Explain the laws of reflection and refraction with ray diagrams. Derive Snell's law.", marks: 5 },
      { q: "Describe the working principle of an electric motor. Draw a labeled diagram.", marks: 5 },
      { q: "State and prove the law of conservation of energy with an example of a falling body.", marks: 5 },
    ]
  },
  Mathematics: {
    mcq: [
      { q: "What is the value of sin 90°?", options: ["0", "1", "-1", "½"], answer: "1", marks: 1 },
      { q: "The HCF of 12 and 18 is?", options: ["6", "3", "9", "12"], answer: "6", marks: 1 },
      { q: "What is the area of a circle with radius r?", options: ["πr²", "2πr", "πd", "2πr²"], answer: "πr²", marks: 1 },
      { q: "What is the slope of y = 3x + 5?", options: ["3", "5", "8", "15"], answer: "3", marks: 1 },
      { q: "The sum of angles in a triangle is?", options: ["90°", "180°", "270°", "360°"], answer: "180°", marks: 1 },
    ],
    short: [
      { q: "Find the roots of the quadratic equation x² - 5x + 6 = 0.", marks: 3 },
      { q: "Prove that √2 is irrational.", marks: 3 },
      { q: "Find the area of a triangle with sides 3cm, 4cm, and 5cm using Heron's formula.", marks: 3 },
    ],
    long: [
      { q: "Prove the Pythagorean theorem. Use it to find the hypotenuse of a right triangle with legs 8cm and 15cm.", marks: 5 },
      { q: "Solve the system of linear equations: 2x + 3y = 12 and x - y = 1. Show all working.", marks: 5 },
    ]
  },
  Chemistry: {
    mcq: [
      { q: "What is the atomic number of Carbon?", options: ["6", "12", "8", "14"], answer: "6", marks: 1 },
      { q: "Which gas is produced when zinc reacts with dilute HCl?", options: ["O₂", "CO₂", "H₂", "Cl₂"], answer: "H₂", marks: 1 },
      { q: "The pH of pure water is?", options: ["0", "7", "14", "5"], answer: "7", marks: 1 },
    ],
    short: [
      { q: "What is the difference between ionic and covalent bonds? Give one example of each.", marks: 3 },
      { q: "Explain the process of electrolysis with a suitable example.", marks: 3 },
    ],
    long: [
      { q: "Describe the structure of an atom according to Bohr's model. Explain how electrons are arranged in shells.", marks: 5 },
    ]
  },
  Biology: {
    mcq: [
      { q: "Which organelle is called the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi body"], answer: "Mitochondria", marks: 1 },
      { q: "What is the basic unit of life?", options: ["Tissue", "Organ", "Cell", "Organism"], answer: "Cell", marks: 1 },
    ],
    short: [
      { q: "What is photosynthesis? Write the chemical equation for photosynthesis.", marks: 3 },
      { q: "Explain the structure and function of the cell membrane.", marks: 3 },
    ],
    long: [
      { q: "Describe the process of mitosis with labeled diagrams of each stage.", marks: 5 },
    ]
  },
  English: {
    mcq: [
      { q: "Which of the following is a noun?", options: ["Run", "Beautiful", "Happiness", "Quickly"], answer: "Happiness", marks: 1 },
      { q: "Choose the correct passive voice: 'She writes a letter'", options: ["A letter is written by her", "A letter was written by her", "A letter will be written by her", "A letter has been written by her"], answer: "A letter is written by her", marks: 1 },
    ],
    short: [
      { q: "Write a short paragraph (80-100 words) on 'The Importance of Reading'.", marks: 3 },
      { q: "Explain the difference between a simile and a metaphor with two examples each.", marks: 3 },
    ],
    long: [
      { q: "Write a letter to your school principal requesting permission to organize a science exhibition. Include all necessary details.", marks: 5 },
    ]
  }
};

const defaultBank = {
  mcq: [
    { q: "Which of the following is correct?", options: ["Option A", "Option B", "Option C", "Option D"], answer: "Option A", marks: 1 },
    { q: "What does the following term mean?", options: ["Definition A", "Definition B", "Definition C", "Definition D"], answer: "Definition A", marks: 1 },
  ],
  short: [
    { q: "Explain the key concept studied in this topic.", marks: 3 },
    { q: "Describe the main characteristics with suitable examples.", marks: 3 },
  ],
  long: [
    { q: "Give a detailed explanation of the primary concept covered in this subject area. Include examples, diagrams if applicable, and real-world applications.", marks: 5 },
  ]
};

const generateMCQ = (subject, grade, difficulty, count, mcqMarks) => {
  const bank = questionBank[subject]?.mcq || defaultBank.mcq;
  const marksEach = Number(mcqMarks) || 1;
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return Array.from({ length: Number(count) || 0 }, (_, i) => ({
    number: i + 1,
    question: shuffled[i % shuffled.length]?.q ?? `MCQ Question ${i + 1} — ${subject} Grade ${grade}`,
    options: shuffled[i % shuffled.length]?.options ?? ["Option A", "Option B", "Option C", "Option D"],
    answer: shuffled[i % shuffled.length]?.answer ?? "Option A",
    marks: marksEach
  }));
};

const generateShortAnswer = (subject, grade, difficulty, count, shortMarks) => {
  const bank = questionBank[subject]?.short || defaultBank.short;
  const marksEach = Number(shortMarks) || 3;
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return Array.from({ length: Number(count) || 0 }, (_, i) => ({
    number: i + 1,
    question: shuffled[i % shuffled.length]?.q ?? `Short Answer Question ${i + 1} — ${subject} Grade ${grade}`,
    marks: marksEach
  }));
};

const generateLongAnswer = (subject, grade, difficulty, count, longMarks) => {
  const bank = questionBank[subject]?.long || defaultBank.long;
  const marksEach = Number(longMarks) || 5;
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return Array.from({ length: Number(count) || 0 }, (_, i) => ({
    number: i + 1,
    question: shuffled[i % shuffled.length]?.q ?? `Long Answer Question ${i + 1} — ${subject} Grade ${grade}`,
    marks: marksEach
  }));
};

export default function GeneratePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Read prefill keys synchronously on first render — before any effect runs
  const [_initDone] = useState(() => {
    // This runs once at mount time, synchronously
    return true;
  });

  // Capture prefill synchronously so it's available even if currentUser loads late
  const initPrefill = (() => {
    try {
      const raw = localStorage.getItem("qp_template_prefill");
      const src = localStorage.getItem("qp_prefill_source");
      const tid = localStorage.getItem("qp_selected_template_id");
      const tname = localStorage.getItem("qp_selected_template_name");
      if (raw && (src === "template_use" || src === "template_create")) {
        localStorage.removeItem("qp_template_prefill");
        localStorage.removeItem("qp_prefill_source");
        localStorage.removeItem("qp_selected_template_id");
        localStorage.removeItem("qp_selected_template_name");
        return { prefill: JSON.parse(raw), tid, tname };
      }
      if (tid) {
        localStorage.removeItem("qp_selected_template_id");
        localStorage.removeItem("qp_selected_template_name");
        return { prefill: null, tid, tname };
      }
    } catch { /* */ }
    return { prefill: null, tid: null, tname: null };
  })();

  const [activePreset, setActivePreset] = useState(initPrefill.prefill?.activePreset || "Midterm");
  const [config, setConfig] = useState(() => {
    const p = initPrefill.prefill;
    if (p) {
      return {
        ...defaultConfig,
        examName:       String(p.examName       || initPrefill.tname || ""),
        subject:        String(p.subject        || ""),
        grade:          String(p.grade          || ""),
        difficulty:     String(p.difficulty     || "Medium"),
        totalMarks:     Number(p.totalMarks     || 100),
        totalQuestions: Number(p.totalQuestions || 50),
        language:       String(p.language       || "English"),
      };
    }
    return defaultConfig;
  });
  const [matrix, setMatrix] = useState(defaultMatrix);
  const [blooms, setBlooms] = useState(defaultBlooms);
  const [sections, setSections] = useState(() => {
    const p = initPrefill.prefill;
    if (p && Array.isArray(p.sections) && p.sections.length > 0) return p.sections;
    return defaultSections;
  });
  const [aiInstructions, setAiInstructions] = useState(() => {
    const p = initPrefill.prefill;
    return p?.notes || p?.aiInstructions || "Generate Questions Based on the Syllabus and PYQ's that Given For this template";
  });
  const { sharedFiles, setSharedFiles, currentUser } = useContext(AuthContext);

  // Backend templates for the selector
  const [backendTemplates, setBackendTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedLayoutId, setSelectedLayoutId] = useState("default");
  const [savedLayouts, setSavedLayouts] = useState({});
  const [loadingLayouts, setLoadingLayouts] = useState(false);
  const [showDefaultPreview, setShowDefaultPreview] = useState(false);

  useEffect(() => {
    if (!currentUser?.user_id) return;

    // prefill was already applied synchronously via initPrefill
    // Just set the selected template and handle backend config fetch
    const { prefill, tid, tname } = initPrefill;

    if (tid) {
      setSelectedTemplateId(tid);
      setSelectedLayoutId(tid);
      if (prefill?.selectedLayoutId) setSelectedLayoutId(prefill.selectedLayoutId);
      if (prefill?.notes) setAiInstructions(prefill.notes);
    }

    // If no prefill, fetch saved config from backend for auto-restore
    if (tid && !prefill) {
      apiGetConfig(tid)
        .then((res) => {
          if (res?.config) {
            const p = res.config;
            setConfig(prev => ({
              ...prev,
              examName:   String(p.examName   || prev.examName   || tname || ""),
              subject:    String(p.subject    || prev.subject    || ""),
              difficulty: String(p.difficulty || prev.difficulty || "Medium"),
              totalMarks: Number(p.totalMarks || prev.totalMarks || 100),
              language:   String(p.language   || prev.language   || "English"),
            }));
            if (p.notes) setAiInstructions(p.notes);
            if (p.selectedLayoutId) setSelectedLayoutId(p.selectedLayoutId);
            if (p.activePreset) setActivePreset(p.activePreset);
            setOpenPanels(prev => ({ ...prev, basic: true }));
            showToast("Progress restored — continue where you left off.", "success");
          }
        })
        .catch(() => {
          const cached = localStorage.getItem(`qp_cfg_${tid}`);
          if (cached) {
            try {
              const p = JSON.parse(cached);
              setConfig(prev => ({
                ...prev,
                examName:   String(p.examName   || prev.examName   || tname || ""),
                subject:    String(p.subject    || prev.subject    || ""),
                difficulty: String(p.difficulty || prev.difficulty || "Medium"),
                totalMarks: Number(p.totalMarks || prev.totalMarks || 100),
                language:   String(p.language   || prev.language   || "English"),
              }));
              if (p.notes) setAiInstructions(p.notes);
            } catch { /* */ }
          }
        });
    }

    if (tid && prefill) {
      setOpenPanels(prev => ({ ...prev, basic: true }));
      showToast("Details loaded — continue where you left off.", "success");
    }

    // Fetch templates and layouts
    apiGetTemplates(currentUser.user_id).then(async (data) => {
      const templates = Array.isArray(data) ? data : [];
      setBackendTemplates(templates);

      if (templates.length === 0) return;
      setLoadingLayouts(true);
       const layoutMap = {};
      await Promise.all(
        templates.map(async (t) => {
          const tid = t._id || t.id;
          try {
            const res = await apiGetLayout(tid);
            if (res?.layout) {
              layoutMap[tid] = res.layout;
              localStorage.setItem(`qp_layout_${tid}`, JSON.stringify(res.layout));
            }
          } catch {
            try {
              const raw = localStorage.getItem(`qp_layout_${tid}`);
              if (raw) layoutMap[tid] = JSON.parse(raw);
            } catch { /* */ }
          }
        })
      );
      setSavedLayouts(layoutMap);
      setLoadingLayouts(false);
    }).catch(() => {});
  }, [currentUser]);

  const notesFiles = sharedFiles.Notes;
  const setNotesFiles = (val) => {
    setSharedFiles((prev) => ({
      ...prev,
      Notes: typeof val === "function" ? val(prev.Notes) : val,
    }));
  };

  const syllabusFiles = sharedFiles.Syllabus;
  const setSyllabusFiles = (val) => {
    setSharedFiles((prev) => ({
      ...prev,
      Syllabus: typeof val === "function" ? val(prev.Syllabus) : val,
    }));
  };

  const previousPapersFiles = sharedFiles["Previous Papers"];
  const setPreviousPapersFiles = (val) => {
    setSharedFiles((prev) => ({
      ...prev,
      "Previous Papers": typeof val === "function" ? val(prev["Previous Papers"]) : val,
    }));
  };

  const [openPanels, setOpenPanels] = useState({
    layout: true,
    basic: true,
    sections: false,
    instructions: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generationStep, setGenerationStep] = useState(-1); // -1 means closed
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  };

  // Sync templates on load — DB fetch or localStorage fallback
  useEffect(() => {
    const dbId = params.get("templateId");
    const localId = params.get("template");

    if (dbId) {
      // Fetch saved config from backend
      Promise.all([
        apiGetConfig(dbId).catch(() => null),
        apiGetLayout(dbId).catch(() => null),
      ]).then(([configRes, layoutRes]) => {
        const cfg = configRes?.config;
        if (cfg) {
          const matchedPreset = examPresets.find(
            (item) => item.toLowerCase() === String(cfg.examType || "Midterm").toLowerCase()
          ) || cfg.examType || "Midterm";

          setActivePreset(matchedPreset);
          setConfig(prev => ({
            ...prev,
            examType: matchedPreset,
            examName: cfg.examName || "",
            subject: cfg.subject || "",
            grade: cfg.grade || "",
            difficulty: cfg.difficulty || "Medium",
            totalMarks: cfg.totalMarks || 100,
            language: cfg.language || "English",
          }));
          if (cfg.notes) setAiInstructions(cfg.notes);
          if (cfg.sections) setSections(cfg.sections);
          if (cfg.blooms) setBlooms(cfg.blooms);
          setOpenPanels(prev => ({ ...prev, basic: true }));
        }
        setSelectedTemplateId(dbId);
        setSelectedLayoutId(dbId);
        if (layoutRes?.layout) {
          setSavedLayouts(prev => ({ ...prev, [dbId]: layoutRes.layout }));
        }
      });
      return;
    }

    if (!localId) return;

    const template = getTemplates().find((item) => String(item.id) === String(localId));
    if (!template) return;

    const templateConfig = template.config || {};
    const nextExamType = templateConfig.examType || template.type || "Midterm";
    const matchedPreset = examPresets.find((item) => item.toLowerCase() === String(nextExamType).toLowerCase()) || nextExamType;

    setActivePreset(matchedPreset);
    setConfig({
      ...defaultConfig,
      ...templateConfig,
      examType: matchedPreset,
      examName: templateConfig.examName || template.title || "",
      subject: templateConfig.subject || template.subject || "",
      grade: templateConfig.grade || template.grade || "",
      difficulty: templateConfig.difficulty || template.difficulty || "Medium",
      totalMarks: templateConfig.totalMarks || 100,
    });

    if (templateConfig.sections) setSections(templateConfig.sections);
    if (templateConfig.blooms) setBlooms(templateConfig.blooms);
    if (templateConfig.aiInstructions) setAiInstructions(templateConfig.aiInstructions);
  }, [params]);

  // Persist current config to localStorage
  useEffect(() => {
    localStorage.setItem("qp_current_config", JSON.stringify({ ...config, sections, blooms, aiInstructions }));
  }, [config, sections, blooms, aiInstructions]);

  // Whenever a template is selected (from dropdown or on mount), fetch its saved config
  useEffect(() => {
    if (!selectedTemplateId) return;
    // Skip if we already applied a prefill on this mount
    if (initPrefill.prefill && initPrefill.tid === selectedTemplateId) return;

    const applyConfig = (p) => {
      setConfig(prev => ({
        ...prev,
        examName:       String(p.examName       || prev.examName       || ""),
        subject:        String(p.subject        || prev.subject        || ""),
        grade:          String(p.grade          || prev.grade          || ""),
        difficulty:     String(p.difficulty     || prev.difficulty     || "Medium"),
        totalMarks:     Number(p.totalMarks     || prev.totalMarks     || 100),
        totalQuestions: Number(p.totalQuestions || prev.totalQuestions || 0),
        language:       String(p.language       || prev.language       || "English"),
      }));
      if (p.notes)           setAiInstructions(p.notes);
      if (p.selectedLayoutId) setSelectedLayoutId(p.selectedLayoutId);
      if (p.activePreset)    setActivePreset(p.activePreset);
      if (Array.isArray(p.sections) && p.sections.length > 0) setSections(p.sections);
      setOpenPanels(prev => ({ ...prev, basic: true, sections: p.sections?.length > 0 }));
    };

    apiGetConfig(selectedTemplateId)
      .then((res) => {
        if (!res?.config) return;
        applyConfig(res.config);
        showToast("Progress restored — continue where you left off.", "success");
        localStorage.setItem(`qp_cfg_${selectedTemplateId}`, JSON.stringify(res.config));
      })
      .catch(() => {
        const cached = localStorage.getItem(`qp_cfg_${selectedTemplateId}`);
        if (cached) {
          try { applyConfig(JSON.parse(cached)); } catch { /* */ }
        }
      });
  }, [selectedTemplateId]);

  const togglePanel = (panel) => {
    setOpenPanels((current) => ({ ...current, [panel]: !current[panel] }));
  };

  const applyPreset = (preset) => {
    setActivePreset(preset);
    let totalMarks = 100;
    if (preset === "Midterm" || preset === "Final Exam") {
      totalMarks = 100;
    } else if (preset === "Weekly Quiz") {
      totalMarks = 50;
    } else if (preset === "Practice Test") {
      totalMarks = 50;
    } else if (preset === "Unit Test") {
      totalMarks = 75;
    }
    setConfig((prev) => ({
      ...prev,
      examType: preset,
      totalMarks,
    }));
  };

  const validateForm = () => {
    // When a real template is selected, backend fills subject/name — skip those checks
    if (selectedTemplateId) return true;

    const errors = {};
    if (!config.examName.trim()) {
      errors.examName = "Exam Name is required.";
    }
    if (!config.subject) {
      errors.subject = "Subject selection is required.";
    }
    if (config.totalMarks <= 0) {
      errors.totalMarks = "Total Marks must be greater than 0.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setOpenPanels((current) => ({ ...current, basic: true }));
      showToast("Please fill all required exam details.", "error");
      return false;
    }
    return true;
  };

  const fullConfig = {
    ...config,
    examType: activePreset,
    sections,
    blooms,
    aiInstructions,
    notesFiles: notesFiles.map((f) => f.name),
    syllabusFiles: syllabusFiles.map((f) => f.name),
    previousPapersFiles: previousPapersFiles.map((f) => f.name),
  };

  const openSaveModal = () => {
    // If a template is selected, save directly to backend without modal
    if (selectedTemplateId) {
      const cfgToSave = {
        examName: config.examName,
        subject: config.subject,
        grade: config.grade,
        difficulty: config.difficulty,
        totalMarks: config.totalMarks,
        totalQuestions: config.totalQuestions,
        duration: config.duration || "",
        language: config.language,
        notes: aiInstructions,
        activePreset,
        selectedLayoutId,
        sections,
      };
      apiSaveConfig(selectedTemplateId, cfgToSave)
        .then(() => showToast("Saved! Your progress is stored for this template.", "success"))
        .catch(() => showToast("Save failed. Check connection.", "error"));
      localStorage.setItem(`qp_cfg_${selectedTemplateId}`, JSON.stringify(cfgToSave));
      return;
    }
    // No template selected — fall back to local save modal
    if (!validateForm()) return;
    setTemplateName(config.examName);
    setShowSaveModal(true);
  };

  const saveCurrentTemplate = () => {
    if (!templateName.trim()) {
      showToast("Template name cannot be empty.", "error");
      return;
    }

    saveTemplate({
      type: activePreset.toUpperCase(),
      subject: config.subject,
      grade: config.grade,
      title: templateName.trim(),
      sections: sections.length,
      difficulty: config.difficulty,
      date: new Date().toLocaleDateString(),
      config: fullConfig,
    });

    setShowSaveModal(false);
    showToast("Template saved successfully!", "success");
  };

  const buildCustomInstructions = () => {
    const lines = [];

    // ── Basic Configuration ──────────────────────────────────────────
    lines.push("### EXAM CONFIGURATION");
    if (config.examName) lines.push(`- Exam Name: ${config.examName}`);
    if (config.subject)  lines.push(`- Subject: ${config.subject}`);
    lines.push(`- Exam Type: ${activePreset}`);
    lines.push(`- Difficulty: ${config.difficulty}`);
    lines.push(`- Total Marks: ${config.totalMarks}`);
    lines.push(`- Language: ${config.language}`);

    // ── Sections ─────────────────────────────────────────────────────
    if (sections.length > 0) {
      lines.push("");
      lines.push("### SECTIONS");
      sections.forEach((s) => {
        lines.push(`- ${s.name}`);
        if (s.questionTypes?.length) lines.push(`  Types: ${s.questionTypes.join(", ")}`);
        if (s.instructions)          lines.push(`  Instructions: ${s.instructions}`);
      });
    }

    // ── User's custom AI instructions ────────────────────────────────
    if (aiInstructions.trim()) {
      lines.push("");
      lines.push("### ADDITIONAL INSTRUCTIONS");
      lines.push(aiInstructions.trim());
    }

    return lines.join("\n");
  };

  const handleGenerate = async (extraInstructions = "") => {
    if (!validateForm()) return;
    setGenerationStep(0);

    try {
      let generatedPaper;

      if (selectedTemplateId) {
        setGenerationStep(1);

        // Fetch layout from backend directly (don't rely on savedLayouts state)
        const layoutId = selectedLayoutId !== "default" ? selectedLayoutId : selectedTemplateId;
        let fetchedLayout = null;
        try {
          const res = await apiGetLayout(layoutId);
          if (res?.layout?.parts?.length) fetchedLayout = res.layout;
        } catch { /* no layout saved */ }

        // Build instructions from layout structure
        let finalInstructions = extraInstructions || "";
        if (fetchedLayout) {
          const layoutInst = (fetchedLayout.parts || []).map(p =>
            `${p.name}: ${p.questions?.length || 0} ${(p.questionType || "").replace("_", " ")} questions, ${p.marksPerQuestion} marks each.`
          ).join(" ");
          if (layoutInst) finalInstructions = `${layoutInst} ${finalInstructions}`.trim();
        }

        const animPromise = (async () => {
          for (let i = 2; i <= 4; i++) {
            await new Promise(r => setTimeout(r, 600));
            setGenerationStep(i);
          }
        })();

        const usedLayoutId = fetchedLayout ? (selectedLayoutId !== "default" ? selectedLayoutId : selectedTemplateId) : "default";
        const result = await apiGenerate(selectedTemplateId, finalInstructions || undefined, usedLayoutId);
        await animPromise;

        generatedPaper = {
          id: result.generation_id || Date.now().toString(),
          generation_id: result.generation_id,
          examName: config.examName.trim() || result.subject || "Generated Paper",
          subject: result.subject || config.subject,
          grade: config.grade,
          examType: activePreset,
          difficulty: config.difficulty,
          totalMarks: result.total_marks || config.totalMarks,
          language: config.language,
          questions: result.questions || [],
          question_count: result.question_count,
          instructions: aiInstructions,
          generatedAt: new Date().toISOString(),
          status: "Ready",
          source: "ai",
          // track which layout was used so View can restore it correctly
          usedLayoutId: fetchedLayout ? (selectedLayoutId !== "default" ? selectedLayoutId : selectedTemplateId) : "default",
        };

        // Distribute questions into layout parts
        if (fetchedLayout?.parts?.length && result.questions?.length > 0) {
          const allQ = [...result.questions];
          let qi = 0;
          const filledParts = fetchedLayout.parts.map((part) => ({
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
          generatedPaper.layout = {
            ...fetchedLayout,
            parts: filledParts,
            header: {
              ...fetchedLayout.header,
              examTitle: generatedPaper.examName,
              subject: generatedPaper.subject,
              maxMarks: String(generatedPaper.totalMarks),
            },
          };
        }
      } else {
        // ── Local mock fallback (no template selected) ──────────────────
        for (let i = 1; i <= 4; i++) {
          await new Promise(r => setTimeout(r, 500));
          setGenerationStep(i);
        }
        await new Promise(r => setTimeout(r, 400));

        const mcqRow = matrix.find(r => r.type === "MCQ");
        const shortRow = matrix.find(r => r.type === "Short Answer");
        const longRow = matrix.find(r => r.type === "Long Answer");
        generatedPaper = {
          id: Date.now().toString(),
          examName: config.examName.trim(),
          subject: config.subject,
          grade: config.grade,
          examType: activePreset,
          difficulty: config.difficulty,
          totalMarks: config.totalMarks,
          language: config.language,
          sections: sections.map(s => ({ id: s.id, name: String(s.name), marks: Number(s.marks) || 0 })),
          questions: {
            mcq: generateMCQ(config.subject, config.grade, config.difficulty, mcqRow?.enabled ? mcqRow.count : 0, mcqRow?.marksEach ?? 1),
            shortAnswer: generateShortAnswer(config.subject, config.grade, config.difficulty, shortRow?.enabled ? shortRow.count : 0, shortRow?.marksEach ?? 3),
            longAnswer: generateLongAnswer(config.subject, config.grade, config.difficulty, longRow?.enabled ? longRow.count : 0, longRow?.marksEach ?? 5),
          },
          instructions: aiInstructions,
          generatedAt: new Date().toISOString(),
          status: "Ready",
          source: "mock",
        };
      }

      // Save to localStorage for preview page
      const history = JSON.parse(localStorage.getItem("qp_history") || "[]");
      history.unshift(generatedPaper);
      localStorage.setItem("qp_history", JSON.stringify(history));
      localStorage.setItem("qp_current_paper", JSON.stringify(generatedPaper));
      localStorage.setItem("qp_generated_count", String(Number(localStorage.getItem("qp_generated_count") || 0) + 1));

      setGenerationStep(-1);
      showToast("Paper generated successfully!", "success");
      navigate("/paper-preview");
    } catch (err) {
      setGenerationStep(-1);
      showToast(err.message || "Generation failed. Check backend connection.", "error");
    }
  };

  // Calculations for Live Exam Blueprint from Section Builder
  const questionTypesList = ["MCQ", "Short Answer", "Long Answer", "Case Study", "HOTS"];

  const questionTypeBreakdown = questionTypesList.map((type) => {
    const isSelected = sections.some((s) => (s.questionTypes || []).includes(type));
    const matrixRow = matrix.find((r) => r.type === type);
    const count = (matrixRow && matrixRow.enabled && isSelected) ? matrixRow.count : 0;
    const marks = (matrixRow && matrixRow.enabled && isSelected) ? matrixRow.count * matrixRow.marksEach : 0;
    return { type, count, marks };
  });

  const calculatedMarks = questionTypeBreakdown.reduce((sum, item) => sum + item.marks, 0);

  // Pie chart config details
  const chartData = questionTypeBreakdown
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: item.type,
      value: item.count,
      color:
        item.type === "MCQ"
          ? "#2563EB"
          : item.type === "Short Answer"
          ? "#7C3AED"
          : item.type === "Long Answer"
          ? "#0891B2"
          : item.type === "Case Study"
          ? "#16A34A"
          : item.type === "HOTS"
          ? "#D97706"
          : "#9CA3AF",
    }));

  const getDifficultyBadgeClass = (diff) => {
    const d = String(diff || "").toLowerCase();
    if (d === "easy") return "bg-[#DCFCE7] text-[#15803D]";
    if (d === "hard") return "bg-[#FEE2E2] text-[#B91C1C]";
    return "bg-[#EFF6FF] text-[#2563EB]";
  };

  const stepsText = selectedTemplateId ? [
    "🔗 Connecting to template...",
    "📚 Loading syllabus & PYQs...",
    "🤖 Gemini AI generating questions...",
    "📝 Formatting paper...",
    "✅ Paper ready!",
  ] : [
    "📂 Reading source materials...",
    "🧠 Analyzing topics...",
    "⚙️ Applying Bloom's taxonomy...",
    "📝 Generating questions...",
    "✅ Paper ready!",
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F0F4F8] transition-all">
      {/* Top Bar Header */}
      <header className="flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-6 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition"
        >
          ← Back
        </button>
        <div className="text-center">
          <span className="text-base font-bold text-[#111827]">AI Exam Builder</span>{" "}
          <span className="text-xs text-[#6B7280] font-mono">Version 2.0</span>
        </div>
        <button
          onClick={openSaveModal}
          className="h-9 rounded-lg border border-[#2563EB] bg-white px-4 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF] transition"
        >
          Save as Template
        </button>
      </header>

      {/* Horizontal Preset Bar */}
      <div className="border-b border-[#E2E8F0] bg-white px-6 py-3 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {examPresets.map((preset) => (
          <button
            key={preset}
            onClick={() => applyPreset(preset)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition shrink-0 ${
              activePreset === preset
                ? "bg-[#111827] text-white"
                : "bg-white border border-[#D1D5DB] text-[#374151] hover:bg-gray-50"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Main Splits Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Form Panel */}
        <section className="w-[60%] h-full overflow-y-auto pt-6 border-r border-[#E2E8F0] flex flex-col scrollbar-thin relative">
          {/* AI Template Selector */}
          {backendTemplates.length > 0 && (
            <div className="px-6 mb-4">
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4">
                <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#15803D] mb-2">AI Generation Mode</p>
                <p className="text-xs text-[#374151] mb-3">Select a processed template to generate with real AI. Leave blank to use local mock generation.</p>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => { setSelectedTemplateId(e.target.value); setSelectedLayoutId("default"); setConfig(defaultConfig); setAiInstructions(""); }}
                  className="h-[38px] w-full appearance-none rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-[#2563EB]"
                >
                  <option value="">— Use local mock (no template) —</option>
                  {backendTemplates.map((t) => (
                    <option key={t._id || t.id} value={t._id || t.id}>{t.name} · {t.total_marks} marks</option>
                  ))}
                </select>
                {selectedTemplateId && (
                  <p className="mt-2 text-xs text-[#15803D] font-semibold">✓ Will generate using Gemini AI with your syllabus & PYQ data</p>
                )}
              </div>
            </div>
          )}

          {/* Source Materials (Always Visible) */}
          <div className="px-6 mb-6">
            <div className="flex items-center gap-2 mb-3 pl-2 border-l-[3px] border-[#2563EB]">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
                Source Materials
              </span>
            </div>
            <div className="flex gap-3 bg-[#EFF6FF] p-4 rounded-xl">
              <SourceCard
                icon={FileText}
                title="Upload Notes"
                subtitle="PDF, DOCX, TXT"
                files={notesFiles}
                onFilesChange={setNotesFiles}
              />
              <SourceCard
                icon={BookOpen}
                title="Upload Syllabus"
                subtitle="Curriculum files"
                files={syllabusFiles}
                onFilesChange={setSyllabusFiles}
              />
              <SourceCard
                icon={FileText}
                title="Previous Papers"
                subtitle="Reference papers"
                files={previousPapersFiles}
                onFilesChange={setPreviousPapersFiles}
              />
            </div>
          </div>

          {/* Form Accordions */}
          <div className="flex flex-col gap-4 px-6 pb-20">
            {/* Layout Picker */}
            <AccordionItem
              title="Choose Layout"
              isOpen={openPanels.layout}
              onToggle={() => togglePanel("layout")}
            >
              <div className="space-y-3">
                {/* Default layout option */}
                <button
                  type="button"
                  onClick={() => setSelectedLayoutId("default")}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${
                    selectedLayoutId === "default"
                      ? "border-[#2563EB] bg-[#EFF6FF]"
                      : "border-[#E2E8F0] bg-white hover:border-[#93C5FD]"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0 text-base">🗂️</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#111827]">Default Layout</div>
                    <div className="text-xs text-[#9CA3AF] mt-0.5">Basic Configuration + Section Builder + AI Instructions</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedLayoutId === "default" && (
                      <span className="text-xs font-bold text-[#2563EB]">✓ Active</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowDefaultPreview(true); }}
                      className="text-xs text-[#6B7280] hover:text-[#2563EB] underline"
                    >
                      View
                    </button>
                  </div>
                </button>

                {/* Saved layouts per template */}
                {loadingLayouts ? (
                  <div className="flex items-center gap-2 py-3 px-3 text-xs text-[#9CA3AF]">
                    <Loader2 size={13} className="animate-spin" /> Loading saved layouts…
                  </div>
                ) : !selectedTemplateId ? (
                  <p className="text-xs text-[#9CA3AF] text-center py-2">Select a template first to see its saved layouts.</p>
                ) : !savedLayouts[selectedTemplateId] ? (
                  <p className="text-xs text-[#9CA3AF] text-center py-2">No layout saved for this template yet. Create one below.</p>
                ) : (() => {
                    const tid = selectedTemplateId;
                    const t = backendTemplates.find(x => (x._id || x.id) === tid);
                    const layout = savedLayouts[tid] || {};
                    const partCount = layout.parts?.length || 0;
                    const subject = layout.header?.subject || t?.name || "";
                    const examTitle = layout.header?.examTitle || "";
                    const layoutSummary = [subject, partCount ? `${partCount} part${partCount !== 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ");

                    return (
                      <button
                        key={tid}
                        type="button"
                        onClick={() => setSelectedLayoutId(tid)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${
                          selectedLayoutId === tid
                            ? "border-[#2563EB] bg-[#EFF6FF]"
                            : "border-[#E2E8F0] bg-white hover:border-[#93C5FD]"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#F0FDF4] flex items-center justify-center shrink-0 text-base">📄</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#111827] truncate">{t?.name || "Template Layout"}</div>
                          <div className="text-xs text-[#9CA3AF] mt-0.5 truncate">
                            {examTitle && <span className="text-[#6B7280]">{examTitle} · </span>}
                            {layoutSummary}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {selectedLayoutId === tid && (
                            <span className="text-xs font-bold text-[#2563EB]">✓ Active</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); navigate(`/layout/${tid}`); }}
                            className="text-xs text-[#6B7280] hover:text-[#2563EB] underline"
                          >
                            Edit
                          </button>
                        </div>
                      </button>
                    );
                  })()
                }

                {/* Create new layout */}
                {selectedTemplateId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/layout/${selectedTemplateId}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-[#D1D5DB] bg-white hover:border-[#2563EB] hover:bg-[#EFF6FF] transition text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0">
                      <Plus size={16} className="text-[#6B7280]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#374151]">Create New Layout</div>
                      <div className="text-xs text-[#9CA3AF]">Design header, parts, and question structure</div>
                    </div>
                  </button>
                ) : (
                  <p className="text-xs text-[#9CA3AF] text-center py-1">Select a template above to create a custom layout for it.</p>
                )}
              </div>
            </AccordionItem>

            {/* Basic Config */}
            <AccordionItem
              title="Basic Configuration"
              isOpen={openPanels.basic}
              onToggle={() => togglePanel("basic")}
            >
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[#6B7280]">Exam Name</span>
                  <input
                    value={config.examName}
                    onChange={(event) => {
                      setConfig((current) => ({ ...current, examName: event.target.value }));
                      setFieldErrors((current) => ({ ...current, examName: "" }));
                    }}
                    placeholder="e.g., Midterm Exam"
                    className={inputClass(Boolean(fieldErrors.examName))}
                  />
                  {fieldErrors.examName && (
                    <p className="mt-1 text-xs text-[#DC2626] font-semibold">{fieldErrors.examName}</p>
                  )}
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[#6B7280]">Subject</span>
                    <input
                      value={config.subject}
                      onChange={(event) => {
                        setConfig((current) => ({ ...current, subject: event.target.value }));
                        setFieldErrors((current) => ({ ...current, subject: "" }));
                      }}
                      placeholder="e.g., Physics, Economics..."
                      className={inputClass(Boolean(fieldErrors.subject))}
                    />
                    {fieldErrors.subject && (
                      <p className="mt-1 text-xs text-[#DC2626] font-semibold">{fieldErrors.subject}</p>
                    )}
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[#6B7280]">Difficulty</span>
                    <select
                      value={config.difficulty}
                      onChange={(event) => setConfig((current) => ({ ...current, difficulty: event.target.value }))}
                      className={selectClass()}
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                      <option>Mixed</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[#6B7280]">Total Marks</span>
                    <input
                      type="number"
                      min="1"
                      value={config.totalMarks}
                      onChange={(event) => {
                        setConfig((current) => ({ ...current, totalMarks: Number(event.target.value) || 0 }));
                        setFieldErrors((current) => ({ ...current, totalMarks: "" }));
                      }}
                      className={inputClass(Boolean(fieldErrors.totalMarks))}
                    />
                    {fieldErrors.totalMarks && (
                      <p className="mt-1 text-xs text-[#DC2626] font-semibold">{fieldErrors.totalMarks}</p>
                    )}
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[#6B7280]">Total Number of Questions</span>
                    <input
                      type="number"
                      min="1"
                      value={config.totalQuestions}
                      onChange={(event) => setConfig((current) => ({ ...current, totalQuestions: Number(event.target.value) || 0 }))}
                      className={inputClass()}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[#6B7280]">Language</span>
                    <select
                      value={config.language}
                      onChange={(event) => setConfig((current) => ({ ...current, language: event.target.value }))}
                      className={selectClass()}
                    >
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Both</option>
                    </select>
                  </label>
                </div>
              </div>
            </AccordionItem>

            {/* Sections */}
            <AccordionItem
              title="Section Builder"
              isOpen={openPanels.sections}
              onToggle={() => togglePanel("sections")}
            >
              <SectionBuilder sections={sections} onChange={setSections} />
            </AccordionItem>

            {/* AI instructions */}
            <AccordionItem
              title="AI Instructions"
              isOpen={openPanels.instructions}
              onToggle={() => togglePanel("instructions")}
            >
              <textarea
                value={aiInstructions}
                onChange={(event) => setAiInstructions(event.target.value.slice(0, 500))}
                placeholder="e.g., Focus on numerical problems. Include CBSE-style questions. Avoid repetition."
                className="w-full rounded-lg border border-[#D1D5DB] p-3 text-sm outline-none focus:border-[#2563EB] min-h-[120px] resize-y"
              />
              <p className="mt-1 text-right text-xs text-[#6B7280] font-mono">
                {aiInstructions.length} / 500 characters
              </p>
            </AccordionItem>
          </div>

          {/* Bottom Action Bar */}
          <div className="sticky bottom-0 z-40 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between">
            <button
              type="button"
              onClick={openSaveModal}
              className="rounded-lg border border-[#2563EB] bg-white px-5 py-2.5 text-sm font-bold text-[#2563EB] hover:bg-[#EFF6FF] transition"
            >
              Save as Template
            </button>
            <button
              type="button"
              onClick={() => {
                handleGenerate(buildCustomInstructions());
              }}
              className="rounded-full bg-[#2563EB] px-8 py-3 text-sm font-bold text-white hover:bg-[#1D4ED8] transition flex items-center gap-2 shadow-md"
            >
              <Play className="h-4 w-4 fill-white" />
              Generate Paper
            </button>
          </div>
        </section>

        {/* Right Blueprint Panel (40%) */}
        <aside className="w-[40%] h-full bg-white flex flex-col border-l border-[#E2E8F0]">
          {/* Header */}
          <div className="bg-[#EFF6FF] px-6 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-sm font-extrabold text-[#2563EB] uppercase tracking-wider">
              Live Exam Blueprint
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">Real-time preview & analytics</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            <div className="space-y-6">
              {/* Stats rows */}
              <div className="divide-y divide-[#E2E8F0]">
                <div className="py-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-[#6B7280]">Total Marks</span>
                  <span className={`text-lg font-extrabold transition-colors ${
                    calculatedMarks > (config.totalMarks || 0) ? "text-[#DC2626]" : "text-[#2563EB]"
                  }`}>
                    {calculatedMarks} / {config.totalMarks || 0}
                  </span>
                </div>

<div className="py-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-[#6B7280]">Sections</span>
                  <span className="text-sm font-bold text-[#111827]">
                    {sections.length} Sections
                  </span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-[#6B7280]">Total Questions</span>
                  <span className="text-sm font-bold text-[#111827]">
                    {config.totalQuestions || 0} Questions
                  </span>
                </div>

<div className="py-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-[#6B7280]">Difficulty</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${getDifficultyBadgeClass(config.difficulty)}`}>
                    {config.difficulty || "Medium"}
                  </span>
                </div>
              </div>

              {/* Donut Chart */}
              {chartData.length > 0 ? (
                <div className="pt-6 border-t border-[#E2E8F0]">
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4 text-center">
                    Question Type Distribution
                  </h3>
                  <div className="flex justify-center h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
                    {chartData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-[#374151] font-semibold">
                          {entry.name}: {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pt-6 border-t border-[#E2E8F0]">
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4 text-center">
                    Question Type Distribution
                  </h3>
                  <div className="flex justify-center h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ value: 1 }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          dataKey="value"
                        >
                          <Cell fill="#E5E7EB" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        No questions added yet
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Default Layout Preview Modal */}
      {showDefaultPreview && <DefaultLayoutPreviewModal onClose={() => setShowDefaultPreview(false)} config={config} sections={sections} examType={activePreset} />}

      {/* Save Template Modal */}
      {showSaveModal ? (
        <SaveTemplateModal
          name={templateName}
          onNameChange={setTemplateName}
          onCancel={() => setShowSaveModal(false)}
          onSave={saveCurrentTemplate}
        />
      ) : null}

      {/* Generation Overlay Modal */}
      {generationStep >= 0 && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#111827]/95 text-white">
          <div className="w-[380px] text-center space-y-6 p-6">
            <Loader2 className="h-12 w-12 text-[#2563EB] animate-spin mx-auto" />
            <div className="space-y-3">
              {stepsText.map((text, idx) => (
                <p
                  key={text}
                  className={`text-sm font-semibold transition-all duration-300 ${
                    idx === generationStep
                      ? "text-white scale-105 opacity-100 font-bold"
                      : idx < generationStep
                      ? "text-[#16A34A] opacity-60"
                      : "text-gray-600 opacity-30"
                  }`}
                >
                  {text}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-[1001] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="min-w-[280px] rounded-xl bg-[#111827] px-5 py-3.5 text-sm font-semibold text-white shadow-lg border border-[#E2E8F0]/10"
            style={{ animation: "slideIn 0.22s ease-out both" }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
