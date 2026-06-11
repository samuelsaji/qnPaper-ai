import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, Save, CheckCircle, Zap } from 'lucide-react'
import { apiGetTemplates, apiGetTemplateResults, apiGetQPResults, apiGetLayout, apiGetConfig, apiSaveConfig } from '../utils/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Template {
  _id: string
  name: string
  total_marks: number
  pdf_files: string[]
  question_papers?: string[]
  has_results?: boolean
}

interface TemplateConfig {
  examName: string
  subject: string
  difficulty: string
  totalMarks: number
  duration: string
  language: string
  notes: string
}

interface Stats {
  modules_count: number
  topics_count: number
  questions_count: number
  syllabus_processed: boolean
  qp_processed: boolean
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getUserId() {
  try { return JSON.parse(localStorage.getItem('qp_current_user') || '{}').user_id || '' }
  catch { return '' }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TemplateDetail() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()

  const [template, setTemplate] = useState<Template | null>(null)
  const [stats, setStats] = useState<Stats>({
    modules_count: 0, topics_count: 0, questions_count: 0,
    syllabus_processed: false, qp_processed: false,
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'config' | 'layout' | 'papers'>('config')

  // Editable config
  const [cfg, setCfg] = useState<TemplateConfig>({
    examName: '', subject: '', difficulty: 'Medium',
    totalMarks: 100, duration: '3 Hours', language: 'English', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Layout summary
  const [layoutSummary, setLayoutSummary] = useState<string | null>(null)

  // ── Load everything on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!templateId) return

    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const userId = getUserId()

        // 1. Get template
        const templates: Template[] = await apiGetTemplates(userId)
        const t = templates.find((x: Template) => x._id === templateId)
        if (!t || cancelled) { setLoading(false); return }
        setTemplate(t)

        // 2. Load config from backend — fall back to localStorage → template defaults
        try {
          const res = await apiGetConfig(templateId)
          if (!cancelled && res?.config) {
            setCfg(prev => ({ ...prev, ...res.config }))
            localStorage.setItem(`qp_cfg_${templateId}`, JSON.stringify(res.config))
          }
        } catch {
          const cached = localStorage.getItem(`qp_cfg_${templateId}`)
          if (!cancelled) {
            if (cached) {
              try { setCfg(JSON.parse(cached)) } catch { /* */ }
            } else {
              setCfg(prev => ({ ...prev, examName: t.name, totalMarks: t.total_marks }))
            }
          }
        }

        // 3. Syllabus stats
        if (t.has_results) {
          try {
            const res = await apiGetTemplateResults(templateId)
            const results = res.results || []
            let mod = 0, top = 0
            if (results.length > 0) {
              const course = results[0]?.courses?.[0]
              if (course?.modules) {
                mod = course.modules.length
                top = course.modules.reduce((s: number, m: any) => s + (m.topics?.length || 0), 0)
              }
            }
            if (!cancelled) setStats(prev => ({ ...prev, modules_count: mod, topics_count: top, syllabus_processed: true }))
          } catch { /* */ }
        }

        // 4. PYQ stats
        if ((t.question_papers || []).length > 0) {
          try {
            const qp = await apiGetQPResults(templateId)
            let total = 0
            if (Array.isArray(qp.questions)) {
              total = qp.questions[0]?.questions
                ? qp.questions.reduce((s: number, r: any) => s + (r.questions?.length || 0), 0)
                : qp.questions.length
            }
            if (!cancelled) setStats(prev => ({ ...prev, questions_count: total, qp_processed: total > 0 }))
          } catch { /* */ }
        }

        // 5. Layout summary
        try {
          const lay = await apiGetLayout(templateId)
          if (!cancelled && lay?.layout?.parts) {
            const parts = lay.layout.parts
            setLayoutSummary(`${parts.length} part${parts.length !== 1 ? 's' : ''} · ${parts.reduce((s: number, p: any) => s + (p.questions?.length || 0), 0)} questions`)
          }
        } catch { /* */ }

      } catch (e) {
        console.error('Failed to load template', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [templateId])

  // ── Save config ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!templateId) return
    setSaving(true)
    // Always write localStorage as cache
    localStorage.setItem(`qp_cfg_${templateId}`, JSON.stringify(cfg))
    try {
      await apiSaveConfig(templateId, cfg)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      console.error('Failed to save config', e)
      // localStorage saved — show success anyway
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  // ── Go to Generate with this template pre-selected ──────────────────────────
  const handleGenerate = () => {
    localStorage.setItem('qp_selected_template_id', templateId || '')
    localStorage.setItem('qp_selected_template_name', template?.name || '')
    localStorage.setItem('qp_template_prefill', JSON.stringify(cfg))
    localStorage.setItem('qp_prefill_source', 'template_use')
    navigate('/generate')
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F0F4F8]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <p className="text-sm">Loading template…</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#F0F4F8]">
        <p className="text-base font-semibold text-gray-600">Template not found</p>
        <button onClick={() => navigate('/templates')} className="rounded-lg bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800">
          ← Back to Templates
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* Top nav */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/templates')} className="text-sm text-gray-500 hover:text-black font-medium transition">
          ← Templates
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-semibold transition ${
              saved ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Details'}
          </button>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition"
          >
            <Zap size={14} /> Generate Paper
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Template header card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-2xl shrink-0">📄</div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{template.name}</h1>
              <p className="text-sm text-gray-400 mt-1">{template.total_marks} marks · {template.pdf_files?.length || 0} syllabus file{(template.pdf_files?.length || 0) !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-4 gap-3">
            {[
              { label: 'Modules', value: stats.modules_count },
              { label: 'Topics', value: stats.topics_count },
              { label: 'PYQ Questions', value: stats.questions_count },
              { label: 'PYQ Papers', value: template.question_papers?.length || 0 },
            ].map(s => (
              <div key={s.label} className="bg-[#F8FAFC] rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Status badges */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${stats.syllabus_processed ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              {stats.syllabus_processed ? '✓ Syllabus processed' : '○ Syllabus not processed'}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${stats.qp_processed ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              {stats.qp_processed ? '✓ PYQs extracted' : '○ No PYQs yet'}
            </span>
            {layoutSummary && (
              <span className="text-xs px-3 py-1 rounded-full font-semibold border bg-blue-50 border-blue-200 text-blue-700">
                ✓ Layout saved — {layoutSummary}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1">
          {(['config', 'layout', 'papers'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition capitalize ${
                activeTab === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t === 'config' ? '⚙️ Configuration' : t === 'layout' ? '📐 Layout' : '📋 Generated Papers'}
            </button>
          ))}
        </div>

        {/* ── CONFIG TAB ── */}
        {activeTab === 'config' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Exam Details</p>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Exam Name">
                <input value={cfg.examName} onChange={e => setCfg(p => ({ ...p, examName: e.target.value }))}
                  placeholder="e.g. Internal Assessment 1" className={inp} />
              </Field>
              <Field label="Subject">
                <input value={cfg.subject} onChange={e => setCfg(p => ({ ...p, subject: e.target.value }))}
                  placeholder="e.g. Operating Systems" className={inp} />
              </Field>
              <Field label="Difficulty">
                <select value={cfg.difficulty} onChange={e => setCfg(p => ({ ...p, difficulty: e.target.value }))} className={inp}>
                  <option>Easy</option><option>Medium</option><option>Hard</option><option>Mixed</option>
                </select>
              </Field>
              <Field label="Total Marks">
                <input type="number" value={cfg.totalMarks} onChange={e => setCfg(p => ({ ...p, totalMarks: +e.target.value }))}
                  className={inp} />
              </Field>
              <Field label="Duration">
                <input value={cfg.duration} onChange={e => setCfg(p => ({ ...p, duration: e.target.value }))}
                  placeholder="e.g. 3 Hours" className={inp} />
              </Field>
              <Field label="Language">
                <select value={cfg.language} onChange={e => setCfg(p => ({ ...p, language: e.target.value }))} className={inp}>
                  <option>English</option><option>Hindi</option><option>Both</option>
                </select>
              </Field>
            </div>

            <Field label="Special Instructions / Notes">
              <textarea value={cfg.notes} onChange={e => setCfg(p => ({ ...p, notes: e.target.value }))}
                placeholder="e.g. Focus on Module 3, include numerical problems…"
                rows={3} className={`${inp} resize-none`} />
            </Field>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
                  saved ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Details'}
              </button>
            </div>
          </div>
        )}

        {/* ── LAYOUT TAB ── */}
        {activeTab === 'layout' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Question Paper Layout</p>
            {layoutSummary ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-semibold">
                ✓ Layout saved — {layoutSummary}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
                No layout saved yet. Open the Layout Builder to design your paper structure.
              </div>
            )}
            <button
              onClick={() => navigate(`/layout/${templateId}`)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition"
            >
              ✏️ {layoutSummary ? 'Edit Layout' : 'Create Layout'}
            </button>
          </div>
        )}

        {/* ── PAPERS TAB ── */}
        {activeTab === 'papers' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Generated Papers</p>
            <GeneratedPapersList templateId={templateId!} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Generated papers sub-component ──────────────────────────────────────────

function GeneratedPapersList({ templateId }: { templateId: string }) {
  const [papers, setPapers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { apiGetGeneratedPapers } = require('../utils/api')

  useEffect(() => {
    apiGetGeneratedPapers(templateId)
      .then((res: any) => setPapers(res.generated_papers || []))
      .catch(() => setPapers([]))
      .finally(() => setLoading(false))
  }, [templateId])

  if (loading) return <div className="text-center py-8 text-gray-400"><Loader2 size={20} className="animate-spin mx-auto" /></div>
  if (papers.length === 0) return <p className="text-sm text-gray-400 text-center py-8">No papers generated yet. Click Generate Paper to create one.</p>

  return (
    <div className="space-y-3">
      {papers.map((p: any, i: number) => {
        const qCount = p.question_count || (p.questions || []).length || 0
        const marks = p.total_marks || '—'
        const date = p.generated_at || p.created_at
        return (
          <div key={p._id || i} className="flex items-center justify-between border border-gray-100 rounded-xl p-4 bg-[#F8FAFC]">
            <div>
              <div className="text-sm font-semibold text-gray-900">Paper #{i + 1}</div>
              <div className="text-xs text-gray-400 mt-1">{qCount} questions · {marks} marks{date ? ` · ${new Date(date).toLocaleDateString()}` : ''}</div>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('qp_current_paper', JSON.stringify(p))
                window.location.href = '/paper-preview'
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
            >
              View
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const inp = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  )
}
