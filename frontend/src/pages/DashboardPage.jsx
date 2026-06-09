import { useRef, useState, useContext } from "react";
import { ArrowRight, BookOpen, FileText, History, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FileDropZone } from "../components/FileDropZone";
import { AuthContext } from "../context/AuthContext";

export default function DashboardPage() {
  const navigate = useNavigate();
  const sourceRef = useRef(null);
  const [flash, setFlash] = useState(false);
  const { sharedFiles, setSharedFiles } = useContext(AuthContext);

  const handleFilesChange = (label, files) => {
    setSharedFiles((prev) => ({
      ...prev,
      [label]: files,
    }));
  };

  const hasUploadedFile = Object.values(sharedFiles).some((files) => files.length > 0);

  const generate = () => {
    setFlash(true);
    sourceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => navigate("/generate"), 650);
    window.setTimeout(() => setFlash(false), 1000);
  };

  return (
    <div className="animate-page-fade">
      <section className="rounded-2xl bg-[var(--bg-cream)] py-4">
        <h1 className="max-w-5xl font-serif text-5xl font-bold leading-[1.05] text-[var(--text-dark)] md:text-7xl xl:text-8xl">
          Question Papers.
          <br />
          India's AI <span className="text-[var(--primary)]">Exam</span>
          <br />
          Builder.
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
          Upload your notes, syllabus, or past papers. We generate structured, ready-to-print question papers in seconds.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button onClick={generate} className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--primary)] px-5 font-bold text-white hover:bg-[var(--primary-light)]">
            <Zap className="h-4 w-4 fill-white" />
            Generate Paper
          </button>
          <button onClick={() => navigate("/templates")} className="h-11 rounded-full border border-[var(--text-dark)] bg-white px-5 font-bold text-[var(--text-dark)]">
            Open Templates
          </button>
        </div>
        <p className="mt-5 text-xs font-semibold text-[var(--text-muted)]">no signup · files stay private · generates in under 10s</p>
      </section>

      <section ref={sourceRef} className="mt-12">
        <p className="mb-4 font-mono text-xs font-bold uppercase text-[var(--primary)]">Source Materials</p>
        <div className="grid gap-5 xl:grid-cols-3">
          {[
            { title: "Upload Notes", text: "PDF, DOCX, TXT", icon: FileText, label: "Notes" },
            { title: "Upload Syllabus", text: "Curriculum files", icon: BookOpen, label: "Syllabus" },
            { title: "Previous Papers", text: "Reference papers", icon: History, label: "Previous Papers" },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className={`rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-all duration-200 ${flash ? "flash-upload-card" : ""}`}
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--primary-muted)] text-[var(--primary)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-bold text-[var(--text-dark)]">{card.title}</h2>
                    <p className="text-sm text-[var(--text-muted)]">{card.text}</p>
                  </div>
                </div>
                <FileDropZone 
                  label={card.label} 
                  initialFiles={sharedFiles[card.label]}
                  onFilesChange={(files) => handleFilesChange(card.label, files)}
                />
              </article>
            );
          })}
        </div>

        {hasUploadedFile && (
          <div className="mt-6 flex justify-end animate-fade-in">
            <button
              onClick={() => navigate("/generate")}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--primary)] px-6 font-bold text-white hover:bg-[var(--primary-light)] transition-all duration-200 shadow-md"
            >
              Continue to Generate
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
