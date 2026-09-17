"use client"
import { useState, useEffect } from "react"

type Case = {
  id: number
  description: string
  email: string
  priority: string
  category: string
  status: string
  created_at: string
  resolved_at: string | null
  escalation_level: number
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://llm-case-classifier-app.onrender.com"

const exampleCases = [
  { label: "Fraud", description: "Unauthorized $450 charge on my card that I never made", priority: "High", email: "test@example.com" },
  { label: "Account Access", description: "Unable to reset my password, the reset link keeps expiring", priority: "Medium", email: "test@example.com" },
  { label: "Verification", description: "I need to verify my identity to unlock my account", priority: "Medium", email: "test@example.com" },
  { label: "General Inquiry", description: "Question about how billing cycles work on my plan", priority: "Low", email: "test@example.com" },
]

function StatusPill({ status }: { status: string }) {
  const variant =
    status === "Resolved" ? "pill-success" :
    status === "Escalated" ? "pill-danger" :
    status === "Verification Requested" ? "pill-warning" :
    "pill-neutral"
  return (
    <span className={`pill ${variant}`}>
      <span className="pill-dot" />
      {status}
    </span>
  )
}

function PriorityPill({ priority }: { priority: string }) {
  const variant = priority === "High" ? "pill-danger" : priority === "Medium" ? "pill-warning" : "pill-neutral"
  return <span className={`pill ${variant}`}>{priority}</span>
}

function CategoryPill({ category }: { category: string }) {
  return <span className="pill pill-brand">{category}</span>
}

export default function CaseForm() {
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [priority, setPriority] = useState("Medium")
  const [result, setResult] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<{ [key: number]: string | null }>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || !email.trim() || !priority) return
    setLoading(true)
    setToast({ message: "Classifying with Claude... this can take a few seconds", type: "success" })
    try {
      const res = await fetch(`${BASE_URL}/classify-case`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, email, priority })
      })
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to classify case: ${res.status} ${errorText}`)
      }
      const data = await res.json()
      setResult(data.category)
      setStatus(data.status)
      setToast({ message: "Case classified successfully!", type: "success" })
      await fetchCases()
    } catch (err: unknown) {
      console.error("Classification error:", err)
      setResult("Error")
      setStatus("Failed")
      setToast({ message: `Failed to classify case: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" })
    } finally {
      setLoading(false)
      setDescription("")
      setEmail("")
      setPriority("Medium")
      setTimeout(() => setToast(null), 3500)
    }
  }

  const fetchCases = async () => {
    setHistoryLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append("status", statusFilter)
      if (priorityFilter) params.append("priority", priorityFilter)
      const res = await fetch(`${BASE_URL}/cases/filter?${params.toString()}`)
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to fetch cases: ${res.status} ${errorText}`)
      }
      const data = await res.json()
      const filtered = data.filter((c: Case) =>
        c.description.toLowerCase().includes(search.toLowerCase())
      )
      setCases(filtered)
      setError(null)
    } catch (err: unknown) {
      console.error("Fetch cases error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, search])

  const runAction = async (
    id: number,
    action: "resolve" | "escalate" | "verify",
    method: "PATCH" | "POST",
    path: string,
    successMessage: string
  ) => {
    setActionLoading((prev) => ({ ...prev, [id]: action }))
    try {
      const res = await fetch(`${BASE_URL}${path}`, { method })
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`${res.status} ${errorText}`)
      }
      setToast({ message: successMessage, type: "success" })
      await fetchCases()
    } catch (err: unknown) {
      console.error(`${action} case error:`, err)
      setToast({ message: `Action failed: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" })
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }))
      setTimeout(() => setToast(null), 3000)
    }
  }

  const resolveCase = (id: number) => runAction(id, "resolve", "PATCH", `/cases/${id}/resolve`, `Case #${id} resolved`)
  const escalateCase = (id: number) => runAction(id, "escalate", "PATCH", `/cases/${id}/escalate`, `Case #${id} escalated`)
  const requestVerification = (id: number) => runAction(id, "verify", "POST", `/cases/${id}/verify`, `Verification requested for #${id}`)

  const setExampleCase = (example: { description: string; priority: string; email: string }) => {
    setDescription(example.description)
    setEmail(example.email)
    setPriority(example.priority)
  }

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <div
          className={`fixed top-20 right-4 z-[60] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-slide-in ${
            toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="app-card p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-slate-900">New Case</h2>
          <span className="pill pill-brand">AI triage</span>
        </div>
        <p className="text-sm text-slate-500 mb-5">Describe the issue -- Claude will classify and route it automatically.</p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
            <textarea
              className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition resize-none text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue (e.g., login problems, payment issues)"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
              <input
                type="email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Priority</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white py-2.5 rounded-xl font-medium text-sm transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm"
            disabled={loading}
          >
            {loading ? "Classifying..." : "Classify Case"}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-2">Try an example</p>
          <div className="flex flex-wrap gap-2">
            {exampleCases.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => setExampleCase(example)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-medium transition"
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4 animate-fade-in">
            <div>
              <p className="text-xs text-slate-500 mb-1">Category</p>
              <CategoryPill category={result} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <StatusPill status={status} />
            </div>
          </div>
        )}
      </div>

      <div className="app-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Case History</h2>
          <span className="text-xs text-slate-400">{cases.length} case{cases.length === 1 ? "" : "s"}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
          <input
            type="text"
            placeholder="Search by description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-1/3 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#0EA5E9] focus:outline-none focus:border-transparent transition text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-1/3 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-[#0EA5E9] focus:outline-none focus:border-transparent transition text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
            <option value="Verification Requested">Verification Requested</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full sm:w-1/3 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-[#0EA5E9] focus:outline-none focus:border-transparent transition text-sm"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {error && (
          <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {historyLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-11 rounded-xl bg-slate-100 animate-pulse-soft" />
            ))}
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No cases match these filters yet.
          </div>
        ) : (
          <div className="overflow-x-auto thin-scroll -mx-2">
            <table className="w-full text-left border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  {["ID", "Description", "Email", "Priority", "Category", "Status", "Esc.", "Actions"].map((col) => (
                    <th key={col} className="px-3 py-2 border-b border-slate-200 text-slate-400 font-medium text-xs uppercase tracking-wide">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 border-b border-slate-100 text-slate-400">#{c.id}</td>
                    <td className="px-3 py-2.5 border-b border-slate-100 max-w-[220px] truncate text-slate-700">{c.description}</td>
                    <td className="px-3 py-2.5 border-b border-slate-100 text-slate-500">{c.email}</td>
                    <td className="px-3 py-2.5 border-b border-slate-100"><PriorityPill priority={c.priority} /></td>
                    <td className="px-3 py-2.5 border-b border-slate-100"><CategoryPill category={c.category} /></td>
                    <td className="px-3 py-2.5 border-b border-slate-100"><StatusPill status={c.status} /></td>
                    <td className="px-3 py-2.5 border-b border-slate-100 text-slate-500">{c.escalation_level}</td>
                    <td className="px-3 py-2.5 border-b border-slate-100">
                      {c.status === "Pending" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => resolveCase(c.id)}
                            className="px-2.5 py-1 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0284C7] transition text-xs font-medium disabled:bg-slate-300"
                            disabled={actionLoading[c.id] === "resolve"}
                          >
                            {actionLoading[c.id] === "resolve" ? "..." : "Resolve"}
                          </button>
                          <button
                            onClick={() => escalateCase(c.id)}
                            className="px-2.5 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-xs font-medium disabled:bg-slate-300"
                            disabled={actionLoading[c.id] === "escalate"}
                          >
                            {actionLoading[c.id] === "escalate" ? "..." : "Escalate"}
                          </button>
                          <button
                            onClick={() => requestVerification(c.id)}
                            className="px-2.5 py-1 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition text-xs font-medium disabled:bg-slate-300"
                            disabled={actionLoading[c.id] === "verify"}
                          >
                            {actionLoading[c.id] === "verify" ? "..." : "Verify"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
