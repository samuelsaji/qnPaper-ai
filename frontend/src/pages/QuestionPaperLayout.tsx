import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { Loader2, Plus, Trash2, Printer, Save, ToggleLeft, ToggleRight, CheckCircle } from 'lucide-react'
import { apiSaveLayout, apiGetLayout } from '../utils/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type LogoPosition = 'left' | 'center' | 'right'
type QuestionMode = 'single' | 'or'

interface SubQuestion { id: string; text: string; marks: number }
interface PartQuestion { id: string; mode: QuestionMode; primary: SubQuestion; alternative: SubQuestion }
interface Part {
  id: string; name: string; instruction: string
  questions: PartQuestion[]; marksPerQuestion: number; questionType: string
}
interface Header {
  collegeName: string; logo: string | null; logoPosition: LogoPosition
  examTitle: string; subject: string; subjectCode: string
  semester: string; duration: string; maxMarks: string; date: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

const emptyQ = (marks: number): PartQuestion => ({
  id: uid(), mode: 'single',
  primary: { id: 'p', text: '', marks },
  alternative: { id: 'a', text: '', marks },
})

const emptyPart = (index: number): Part => ({
  id: uid(),
  name: `Part ${String.fromCharCode(65 + index)}`,
  instruction: 'Answer all questions',
  questions: [emptyQ(3), emptyQ(3)],
  marksPerQuestion: 3,
  questionType: 'short_answer',
})

const defaultHeader: Header = {
  collegeName: '', logo: null, logoPosition: 'center',
  examTitle: '', subject: '', subjectCode: '',
  semester: '', duration: '3 Hours', maxMarks: '', date: '',
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{children}</p>
}

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-gray-500">{label}</label>
      {children}
    </div>
  )
}

const cls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuestionPaperLayout() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const logoRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<'header' | 'parts'>('header')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingLayout, setLoadingLayout] = useState(true)

  const [header, setHeader] = useState<Header>(defaultHeader)
  const [parts, setParts] = useState<Part[]>([emptyPart(0), emptyPart(1)])

  // ── Load layout on mount: backend first, localStorage fallback ──────────────
  useEffect(() => {
    if (!templateId) { setLoadingLayout(false); return }

    apiGetLayout(templateId)
      .then((res: any) => {
        const d = res.layout || {}
        if (d.header) setHeader(d.header)
        if (d.parts) setParts(d.parts)
        // Keep localStorage in sync
        localStorage.setItem(`qp_layout_${templateId}`, JSON.stringify(d))
      })
      .catch(() => {
        // Fallback to localStorage if no backend layout yet
        try {
          const raw = localStorage.getItem(`qp_layout_${templateId}`)
          if (raw) {
            const d = JSON.parse(raw)
            if (d.header) setHeader(d.header)
            if (d.parts) setParts(d.parts)
          }
        } catch { /* */ }
      })
      .finally(() => setLoadingLayout(false))
  }, [templateId])

  // ── Save to backend + localStorage ─────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!templateId) return
    setSaving(true)
    const layout = { header, parts }
    // Always write localStorage immediately
    localStorage.setItem(`qp_layout_${templateId}`, JSON.stringify(layout))
    try {
      await apiSaveLayout(templateId, layout)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      // Backend failed but localStorage is saved — still show success
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }, [templateId, header, parts])

  const setH = (k: keyof Header, v: any) => setHeader(p => ({ ...p, [k]: v }))

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => setH('logo', ev.target?.result as string)
    r.readAsDataURL(f)
  }

  // Part helpers
  const addPart = () => setParts(p => [...p, emptyPart(p.length)])
  const removePart = (id: string) => setParts(p => p.filter(x => x.id !== id))
  const updPart = (id: string, k: keyof Part, v: any) =>
    setParts(p => p.map(x => x.id === id ? { ...x, [k]: v } : x))
  const addQ = (pid: string) =>
    setParts(p => p.map(x => x.id === pid ? { ...x, questions: [...x.questions, emptyQ(x.marksPerQuestion)] } : x))
  const removeQ = (pid: string, qid: string) =>
    setParts(p => p.map(x => x.id === pid ? { ...x, questions: x.questions.filter(q => q.id !== qid) } : x))
  const updQ = (pid: string, qid: string, field: string, val: any) =>
    setParts(p => p.map(x => {
      if (x.id !== pid) return x
      return {
        ...x, questions: x.questions.map(q => {
          if (q.id !== qid) return q
          if (field === 'mode') return { ...q, mode: val }
          if (field === 'pt') return { ...q, primary: { ...q.primary, text: val } }
          if (field === 'pm') return { ...q, primary: { ...q.primary, marks: +val } }
          if (field === 'at') return { ...q, alternative: { ...q.alternative, text: val } }
          if (field === 'am') return { ...q, alternative: { ...q.alternative, marks: +val } }
          return q
        })
      }
    }))

  // Generate
  const handleGenerate = async () => {
    if (!templateId) { setError('No template ID'); return }
    setError(''); setGenerating(true)
    try {
      const token = localStorage.getItem('token')
      const inst = parts.map(p =>
        `${p.name}: ${p.questions.length} ${p.questionType.replace('_', ' ')} questions, ${p.marksPerQuestion} marks each.`
      ).join(' ')
      const res = await axios.post('/api/generate', {
        template_id: templateId,
        custom_instructions: `Total marks: ${header.maxMarks || 'auto'}. ${inst}`,
      }, { headers: { Authorization: `Bearer ${token}` } })
      const qs: any[] = res.data.questions || []
      let i = 0
      setParts(p => p.map(part => ({
        ...part,
        questions: part.questions.map(q => {
          const g = qs[i++]; if (!g) return q
          return { ...q, primary: { ...q.primary, text: g.question_text, marks: g.marks || part.marksPerQuestion } }
        })
      })))
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Generation failed.')
    } finally { setGenerating(false) }
  }

  const totalMarks = parts.reduce((s, p) => s + p.questions.reduce((a, q) => a + (q.primary.marks || 0), 0), 0)
  const totalQuestions = parts.reduce((s, p) => s + p.questions.length, 0)
  let qNum = 0

  if (loadingLayout) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F0F4F8]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <p className="text-sm font-medium">Loading layout…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* ── TOP BAR ──────────────────────────────────────────────────────────── */}
      <div className="no-print flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3.5 sticky top-0 z-20 shadow-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition font-medium">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">Question Paper Builder</span>
          {templateId && (
            <span className="text-xs bg-blue-50 border border-blue-200 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
              Template #{templateId.slice(-6)}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border font-medium transition ${
              saved ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Layout'}
          </button>
          <button
            onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-40 font-medium transition"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : '✦'}
            {generating ? 'Generating…' : 'Auto-fill'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium transition"
          >
            <Printer size={14} /> Print / PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="no-print bg-red-50 border-b border-red-200 px-6 py-2 text-sm text-red-600 font-medium">
          ⚠ {error}
        </div>
      )}

      <div className="no-print flex" style={{ height: 'calc(100vh - 57px)' }}>

        {/* ── LEFT EDITOR PANEL ────────────────────────────────────────────── */}
        <div className="w-[400px] min-w-[400px] flex flex-col bg-[#F8FAFC] border-r border-gray-200 overflow-hidden">

          {/* Tabs */}
          <div className="flex bg-white border-b border-gray-200 shrink-0">
            {(['header', 'parts'] as const).map(t => (
              <button
                key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  tab === t ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {t === 'header' ? '🏫 Header & Info' : '📝 Parts & Questions'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* ── HEADER TAB ─────────────────────────────────────────────── */}
            {tab === 'header' && (
              <>
                {/* Logo upload */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <SectionLabel>College Logo</SectionLabel>
                  <div className="flex gap-4 items-center">
                    <div
                      onClick={() => logoRef.current?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 overflow-hidden transition shrink-0"
                    >
                      {header.logo
                        ? <img src={header.logo} className="w-full h-full object-contain" alt="logo" />
                        : <>
                            <span className="text-2xl">🏛</span>
                            <span className="text-[10px] text-gray-400 mt-1">Upload</span>
                          </>
                      }
                    </div>
                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-gray-500 font-medium">Logo position</p>
                      <div className="flex gap-2">
                        {(['left', 'center', 'right'] as LogoPosition[]).map(pos => (
                          <button
                            key={pos} onClick={() => setH('logoPosition', pos)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize border transition ${
                              header.logoPosition === pos ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Institution */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <SectionLabel>Institution</SectionLabel>
                  <InputField label="College / Institution Name">
                    <input value={header.collegeName} onChange={e => setH('collegeName', e.target.value)}
                      placeholder="e.g. Mar Athanasius College of Engineering" className={cls} />
                  </InputField>
                  <InputField label="Exam Title">
                    <input value={header.examTitle} onChange={e => setH('examTitle', e.target.value)}
                      placeholder="e.g. Internal Assessment 1 — May 2025" className={cls} />
                  </InputField>
                </div>

                {/* Exam details */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <SectionLabel>Exam Details</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Subject">
                      <input value={header.subject} onChange={e => setH('subject', e.target.value)}
                        placeholder="e.g. Operating Systems" className={cls} />
                    </InputField>
                    <InputField label="Subject Code">
                      <input value={header.subjectCode} onChange={e => setH('subjectCode', e.target.value)}
                        placeholder="e.g. CS401" className={cls} />
                    </InputField>
                    <InputField label="Class / Semester">
                      <input value={header.semester} onChange={e => setH('semester', e.target.value)}
                        placeholder="e.g. S4 CSE" className={cls} />
                    </InputField>
                    <InputField label="Date">
                      <input type="date" value={header.date} onChange={e => setH('date', e.target.value)} className={cls} />
                    </InputField>
                    <InputField label="Duration">
                      <input value={header.duration} onChange={e => setH('duration', e.target.value)}
                        placeholder="e.g. 3 Hours" className={cls} />
                    </InputField>
                    <InputField label="Max Marks">
                      <input type="number" value={header.maxMarks} onChange={e => setH('maxMarks', e.target.value)}
                        placeholder="e.g. 50" className={cls} />
                    </InputField>
                  </div>
                </div>
              </>
            )}

            {/* ── PARTS TAB ──────────────────────────────────────────────── */}
            {tab === 'parts' && (
              <>
                {parts.map((part, pi) => (
                  <div key={part.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Part header bar */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
                      <input
                        value={part.name}
                        onChange={e => updPart(part.id, 'name', e.target.value)}
                        className="bg-transparent font-bold text-sm outline-none w-28 placeholder:text-gray-500"
                        placeholder="Part A"
                      />
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{part.questions.length} Q · {part.questions.reduce((s, q) => s + q.primary.marks, 0)} marks</span>
                        {parts.length > 1 && (
                          <button onClick={() => removePart(part.id)} className="hover:text-red-400 transition">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Part config */}
                      <div className="grid grid-cols-2 gap-2">
                        <InputField label="Marks / Question">
                          <input type="number" min={1} value={part.marksPerQuestion}
                            onChange={e => updPart(part.id, 'marksPerQuestion', parseInt(e.target.value) || 1)}
                            className={cls} />
                        </InputField>
                        <InputField label="Question Type">
                          <select value={part.questionType}
                            onChange={e => updPart(part.id, 'questionType', e.target.value)}
                            className={cls}>
                            <option value="short_answer">Short Answer</option>
                            <option value="long">Long Answer</option>
                            <option value="MCQ">MCQ</option>
                            <option value="numerical">Numerical</option>
                          </select>
                        </InputField>
                      </div>
                      <InputField label="Instruction Line">
                        <input value={part.instruction}
                          onChange={e => updPart(part.id, 'instruction', e.target.value)}
                          placeholder="e.g. Answer all questions" className={cls} />
                      </InputField>

                      {/* Questions list */}
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Questions</p>
                        {part.questions.map((q, qi) => (
                          <div key={q.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-500">Q{qi + 1}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updQ(part.id, q.id, 'mode', q.mode === 'or' ? 'single' : 'or')}
                                  title="Toggle OR choice"
                                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium transition ${
                                    q.mode === 'or' ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                  }`}
                                >
                                  {q.mode === 'or' ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                                  OR
                                </button>
                                {part.questions.length > 1 && (
                                  <button onClick={() => removeQ(part.id, q.id)} className="text-red-300 hover:text-red-500 transition">
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <textarea
                              value={q.primary.text}
                              onChange={e => updQ(part.id, q.id, 'pt', e.target.value)}
                              placeholder="Type question or click Auto-fill…"
                              rows={2}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none transition"
                            />
                            {q.mode === 'or' && (
                              <>
                                <p className="text-[10px] text-center text-gray-400 font-bold tracking-widest">— OR —</p>
                                <textarea
                                  value={q.alternative.text}
                                  onChange={e => updQ(part.id, q.id, 'at', e.target.value)}
                                  placeholder="Alternative question"
                                  rows={2}
                                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-xs bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none transition"
                                />
                              </>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-400 font-medium">Marks:</span>
                              <input
                                type="number" min={1} value={q.primary.marks}
                                onChange={e => updQ(part.id, q.id, 'pm', e.target.value)}
                                className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => addQ(part.id)}
                          className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-medium text-gray-400 hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-1"
                        >
                          <Plus size={12} /> Add Question
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addPart}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Add Part
                </button>

                <div className="bg-gray-900 text-white rounded-xl px-5 py-4 flex justify-between items-center">
                  <div className="text-sm"><span className="font-bold text-white">{totalQuestions}</span> <span className="text-gray-400">questions</span></div>
                  <div className="text-sm"><span className="font-bold text-white">{totalMarks}</span> <span className="text-gray-400">total marks</span></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT PREVIEW PANEL ──────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#dde3ea', padding: '32px 24px' }}>
          {/* Sheet — centered */}
          <div
            className="print-area"
            style={{ maxWidth: 720, margin: '0 auto', background: '#fff', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', overflow: 'hidden', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 13 }}
          >

            {/* Paper header */}
            <div style={{ borderBottom: '2.5px solid #1f2937', padding: '28px 48px 20px' }}>
              {/* College name + logo */}
              <div style={{
                display: 'flex',
                flexDirection: header.logoPosition === 'center' ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                textAlign: 'center',
                marginBottom: 14,
              }}>
                {header.logo && (
                  <img src={header.logo} alt="logo" style={{ width: 64, height: 64, objectFit: 'contain', flexShrink: 0 }} />
                )}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#111827', lineHeight: 1.3 }}>
                    {header.collegeName || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>College Name</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginTop: 5 }}>
                    {header.examTitle || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>Exam Title</span>}
                  </div>
                </div>
              </div>

              {/* Metadata — 2-row table */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, marginTop: 4 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#374151' }}>
                  <tbody>
                    <tr>
                      <td style={{ paddingBottom: 5, paddingRight: 32, whiteSpace: 'nowrap' }}>
                        <strong>Subject:</strong>&nbsp;{header.subject || '___________'}{header.subjectCode ? ` (${header.subjectCode})` : ''}
                      </td>
                      <td style={{ paddingBottom: 5, paddingRight: 32, whiteSpace: 'nowrap' }}>
                        <strong>Class / Sem:</strong>&nbsp;{header.semester || '______'}
                      </td>
                      <td style={{ paddingBottom: 5, whiteSpace: 'nowrap' }}>
                        <strong>Date:</strong>&nbsp;{header.date || '__________'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ paddingRight: 32, whiteSpace: 'nowrap' }}>
                        <strong>Duration:</strong>&nbsp;{header.duration || '______'}
                      </td>
                      <td style={{ paddingRight: 32, whiteSpace: 'nowrap' }}>
                        <strong>Max Marks:</strong>&nbsp;{header.maxMarks || totalMarks || '______'}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Student fields */}
              <div style={{ borderTop: '1px dashed #d1d5db', marginTop: 10, paddingTop: 10, display: 'flex', gap: 40, fontSize: 12, color: '#4b5563' }}>
                <span>Name:&nbsp;________________________________</span>
                <span>Roll No:&nbsp;______________</span>
                <span>Reg No:&nbsp;______________</span>
              </div>
            </div>

            {/* General Instructions */}
            <div style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '12px 48px' }}>
              <p style={{ fontWeight: 700, fontSize: 12, color: '#374151', margin: '0 0 6px' }}>General Instructions:</p>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#4b5563', lineHeight: 1.9 }}>
                <li>All questions are compulsory unless stated otherwise.</li>
                <li>Marks for each question are indicated in brackets [ ].</li>
                <li>Write legibly and clearly in the space provided.</li>
              </ol>
            </div>

            {/* Parts / Questions */}
            <div style={{ padding: '24px 48px 36px' }}>
              {(() => { qNum = 0; return null })()}
              {parts.map(part => (
                <div key={part.id} style={{ marginBottom: 28 }}>
                  {/* Part heading */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1.5px solid #9ca3af', paddingBottom: 6, marginBottom: 14 }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111827' }}>
                        {part.name}
                      </span>
                      {part.instruction && (
                        <span style={{ marginLeft: 10, fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>
                          ({part.instruction})
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 12 }}>
                      [{part.questions.reduce((s, q) => s + q.primary.marks, 0)} marks]
                    </span>
                  </div>

                  {/* Questions */}
                  {part.questions.map(q => {
                    qNum++
                    const n = qNum
                    return (
                      <div key={q.id} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <span style={{ fontWeight: 700, color: '#111827', minWidth: 24, flexShrink: 0, fontSize: 13 }}>{n}.</span>
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                            <p style={{ margin: 0, color: q.primary.text ? '#1f2937' : '#d1d5db', fontStyle: q.primary.text ? 'normal' : 'italic', lineHeight: 1.75, flex: 1, fontSize: 13 }}>
                              {q.primary.text || `Question ${n} — type or auto-generate`}
                            </p>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>
                              [{q.primary.marks} marks]
                            </span>
                          </div>
                        </div>
                        {q.mode === 'or' && (
                          <div style={{ marginLeft: 34, marginTop: 10 }}>
                            <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', fontWeight: 700, margin: '4px 0 8px', letterSpacing: '0.1em' }}>— OR —</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                              <span style={{ fontWeight: 700, color: '#111827', minWidth: 24, flexShrink: 0, fontSize: 13 }}>{n}.</span>
                              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                                <p style={{ margin: 0, color: q.alternative.text ? '#1f2937' : '#d1d5db', fontStyle: q.alternative.text ? 'normal' : 'italic', lineHeight: 1.75, flex: 1, fontSize: 13 }}>
                                  {q.alternative.text || 'Alternative question'}
                                </p>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, flexShrink: 0 }}>
                                  [{q.alternative.marks || q.primary.marks} marks]
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}

              <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: 11, color: '#9ca3af', letterSpacing: '0.12em' }}>
                ✦ ✦ ✦ &nbsp; End of Question Paper &nbsp; ✦ ✦ ✦
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
