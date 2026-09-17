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
  const dot =
    status === "Resolved" ? "dot-success" :
    status === "Escalated" ? "dot-danger" :
    status === "Verification Requested" ? "dot-warning" :
    "dot-neutral"
  return (
    <span className="pill">
      <span className={`pill-dot ${dot}`} />
      {status}
    </span>
  )
}

function PriorityTag({ priority }: { priority: string }) {
  return <span className="tag">{priority}</span>
}

function CategoryTag({ category }: { category: string }) {
  return <span className="tag">{category}</span>
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
    setToast({ message: "Classifying with Claude...", type: "success" })
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
      setToast({ message: "Case classified successfully", type: "success" })
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
    <div className="flex flex-col gap-5">
      {toast && (
        <div
          className={`fixed top-16 right-4 z-[60] px-3.5 py-2 rounded-md text-sm font-medium animate-slide-in border ${
            toast.type === "success" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-red-600 border-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="app-card p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[15px] font-semibold text-gray-900">New Case</h2>
          <span className="text-xs text-gray-400">Auto-classified</span>
        </div>
        <p className="text-[13px] text-gray-500 mb-4">Describe the issue and it will be routed automatically.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea
              className="w-full h-24 bg-white border border-gray-300 rounded-md p-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition resize-none text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue (e.g., login problems, payment issues)"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input
                type="email"
                className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
              <select
                className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition text-sm"
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
            className="w-full bg-gray-900 hover:bg-black text-white py-2 rounded-md font-medium text-sm transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Classifying..." : "Classify Case"}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-400 mb-2">Try an example</p>
          <div className="flex flex-wrap gap-1.5">
            {exampleCases.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => setExampleCase(example)}
                className="px-2.5 py-1 bg-white border border-gray-200 hover:border-gray-400 text-gray-600 rounded-md text-xs font-medium transition"
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        {result && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center gap-5 animate-fade-in">
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Category</p>
              <CategoryTag category={result} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Status</p>
              <StatusPill status={status} />
            </div>
          </div>
        )}
      </div>

      <div className="app-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-gray-900">Case History</h2>
          <span className="text-xs text-gray-400">{cases.length} case{cases.length === 1 ? "" : "s"}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="text"
            placeholder="Search by description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-1/3 bg-white border border-gray-300 rounded-md p-2 text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-gray-400 focus:outline-none transition text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-1/3 bg-white border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-1 focus:ring-gray-400 focus:outline-none transition text-sm"
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
            className="w-full sm:w-1/3 bg-white border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-1 focus:ring-gray-400 focus:outline-none transition text-sm"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {error && (
          <div className="p-2.5 mb-3 bg-white border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}

        {historyLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 rounded-md bg-gray-100 animate-pulse-soft" />
            ))}
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No cases match these filters yet.
          </div>
        ) : (
          <div className="overflow-x-auto thin-scroll -mx-1">
            <table className="w-full text-left border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  {["ID", "Description", "Email", "Priority", "Category", "Status", "Esc.", "Actions"].map((col) => (
                    <th key={col} className="px-2.5 py-1.5 border-b border-gray-200 text-gray-400 font-medium text-[11px] uppercase tracking-wide">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2.5 py-2 border-b border-gray-100 text-gray-400">#{c.id}</td>
                    <td className="px-2.5 py-2 border-b border-gray-100 max-w-[200px] truncate text-gray-700">{c.description}</td>
                    <td className="px-2.5 py-2 border-b border-gray-100 text-gray-500">{c.email}</td>
                    <td className="px-2.5 py-2 border-b border-gray-100"><PriorityTag priority={c.priority} /></td>
                    <td className="px-2.5 py-2 border-b border-gray-100"><CategoryTag category={c.category} /></td>
                    <td className="px-2.5 py-2 border-b border-gray-100"><StatusPill status={c.status} /></td>
                    <td className="px-2.5 py-2 border-b border-gray-100 text-gray-500">{c.escalation_level}</td>
                    <td className="px-2.5 py-2 border-b border-gray-100">
                      {c.status === "Pending" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => resolveCase(c.id)}
                            className="px-2 py-1 border border-gray-300 hover:border-gray-900 hover:text-gray-900 text-gray-600 rounded text-xs font-medium transition disabled:opacity-40"
                            disabled={actionLoading[c.id] === "resolve"}
                          >
                            {actionLoading[c.id] === "resolve" ? "..." : "Resolve"}
                          </button>
                          <button
                            onClick={() => escalateCase(c.id)}
                            className="px-2 py-1 border border-gray-300 hover:border-red-500 hover:text-red-600 text-gray-600 rounded text-xs font-medium transition disabled:opacity-40"
                            disabled={actionLoading[c.id] === "escalate"}
                          >
                            {actionLoading[c.id] === "escalate" ? "..." : "Escalate"}
                          </button>
                          <button
                            onClick={() => requestVerification(c.id)}
                            className="px-2 py-1 border border-gray-300 hover:border-gray-900 hover:text-gray-900 text-gray-600 rounded text-xs font-medium transition disabled:opacity-40"
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
