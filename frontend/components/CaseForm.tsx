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

const BASE_URL = "http://localhost:8000"

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
  const [actionLoading, setActionLoading] = useState<{ [key: number]: string | null }>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || !email.trim() || !priority) return
    setLoading(true)
    setToast({ message: "Processing... Backend may take a minute", type: "success" })
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
      setToast({ message: `Failed to classify case: ${err instanceof Error ? err.message : 'Unknown error'}`, type: "error" })
    } finally {
      setLoading(false)
      setDescription("")
      setEmail("")
      setPriority("Medium")
      setTimeout(() => setToast(null), 3000)
    }
  }

  const fetchCases = async () => {
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
    }
  }

  useEffect(() => {
    fetchCases()
  }, [statusFilter, priorityFilter, search])

  const resolveCase = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: "resolve" }))
    try {
      const res = await fetch(`${BASE_URL}/cases/${id}/resolve`, { method: "PATCH" })
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to resolve case: ${res.status} ${errorText}`)
      }
      setToast({ message: `Case ${id} resolved successfully`, type: "success" })
      await fetchCases()
    } catch (err: unknown) {
      console.error("Resolve case error:", err)
      setToast({ message: `Failed to resolve case: ${err instanceof Error ? err.message : 'Unknown error'}`, type: "error" })
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }))
      setTimeout(() => setToast(null), 3000)
    }
  }

  const escalateCase = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: "escalate" }))
    try {
      const res = await fetch(`${BASE_URL}/cases/${id}/escalate`, { method: "PATCH" })
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to escalate case: ${res.status} ${errorText}`)
      }
      setToast({ message: `Case ${id} escalated successfully`, type: "success" })
      await fetchCases()
    } catch (err: unknown) {
      console.error("Escalate case error:", err)
      setToast({ message: `Failed to escalate case: ${err instanceof Error ? err.message : 'Unknown error'}`, type: "error" })
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }))
      setTimeout(() => setToast(null), 3000)
    }
  }

  const requestVerification = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: "verify" }))
    try {
      const res = await fetch(`${BASE_URL}/cases/${id}/verify`, { method: "POST" })
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to request verification: ${res.status} ${errorText}`)
      }
      setToast({ message: `Verification requested for case ${id}`, type: "success" })
      await fetchCases()
    } catch (err: unknown) {
      console.error("Verify case error:", err)
      setToast({ message: `Failed to request verification: ${err instanceof Error ? err.message : 'Unknown error'}`, type: "error" })
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }))
      setTimeout(() => setToast(null), 3000)
    }
  }

  const exampleCases = [
    { description: "Suspicious login from unknown device", priority: "High", email: "test@example.com" },
    { description: "Question about account balance", priority: "Low", email: "test@example.com" },
    { description: "Unable to reset password", priority: "Medium", email: "test@example.com" },
  ]

  const setExampleCase = (example: { description: string; priority: string; email: string }) => {
    setDescription(example.description)
    setEmail(example.email)
    setPriority(example.priority)
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-xl font-bold text-[#38BDF8] mb-6">Submit a Case</h1>
      {toast && (
        <div className={`absolute top-4 right-4 p-3 rounded-lg shadow-md ${toast.type === "success" ? "bg-[#22C55E]" : "bg-[#EF4444]"} text-white text-sm font-medium animate-slide-in`}>
          {toast.message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            className="w-full h-24 bg-[#F1F5F9] border border-gray-300 rounded-lg p-3 text-[#1E293B] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] transition duration-200 resize-none text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue (e.g., login problems, payment issues)"
          />
        </div>
        <div>
          <input
            type="email"
            className="w-full bg-[#F1F5F9] border border-gray-300 rounded-lg p-3 text-[#1E293B] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] transition duration-200 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        <div>
          <select
            className="w-full bg-[#F1F5F9] border border-gray-300 rounded-lg p-3 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] transition duration-200 text-sm"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-[#0EA5E9] hover:bg-[#38BDF8] text-white py-2.5 rounded-lg font-medium text-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Classifying..." : "Classify Case"}
        </button>
      </form>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-[#38BDF8] mb-2">Test with Example Cases</h3>
        <p className="text-xs text-gray-500 mb-2">Click to try sample inputs for the classifier.</p>
        <div className="flex flex-wrap gap-2">
          {exampleCases.map((example, index) => (
            <button
              key={index}
              onClick={() => setExampleCase(example)}
              className="px-3 py-1.5 bg-[#0EA5E9] hover:bg-[#38BDF8] text-white rounded-lg text-xs font-medium transition duration-200"
            >
              {example.description.slice(0, 15)}...
            </button>
          ))}
        </div>
      </div>
      {result && (
        <div className="mt-4 p-4 bg-[#F1F5F9] border border-gray-300 rounded-lg">
          <h2 className="text-sm font-medium text-[#38BDF8] mb-2">Classification Result</h2>
          <p className="text-xs text-[#1E293B]"><strong>Category:</strong> {result}</p>
          <p className="text-xs text-[#1E293B]"><strong>Status:</strong> {status}</p>
        </div>
      )}
      <h1 className="text-xl font-bold text-[#38BDF8] mt-8 mb-4">Case History</h1>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-1/3 bg-[#F1F5F9] border border-gray-300 rounded-lg p-2.5 text-[#1E293B] placeholder-gray-500 focus:ring-2 focus:ring-[#0EA5E9] focus:outline-none transition duration-200 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-1/3 bg-[#F1F5F9] border border-gray-300 rounded-lg p-2.5 text-[#1E293B] focus:ring-2 focus:ring-[#0EA5E9] focus:outline-none transition duration-200 text-sm"
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
            className="w-full sm:w-1/3 bg-[#F1F5F9] border border-gray-300 rounded-lg p-2.5 text-[#1E293B] focus:ring-2 focus:ring-[#0EA5E9] focus:outline-none transition duration-200 text-sm"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        {error && (
          <div className="p-3 bg-[#EF4444] border border-gray-300 rounded-lg text-white text-sm">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0 text-sm">
            <thead className="bg-[#F1F5F9]">
              <tr>
                {["ID", "Description", "Email", "Priority", "Category", "Status", "Escalation", "Actions"].map((col) => (
                  <th key={col} className="p-2.5 border-b border-gray-300 text-[#38BDF8] font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-[#0EA5E9]/10 transition duration-200">
                  <td className="p-2.5 border-b border-gray-300">{c.id}</td>
                  <td className="p-2.5 border-b border-gray-300">{c.description}</td>
                  <td className="p-2.5 border-b border-gray-300">{c.email}</td>
                  <td className="p-2.5 border-b border-gray-300">{c.priority}</td>
                  <td className="p-2.5 border-b border-gray-300">{c.category}</td>
                  <td className="p-2.5 border-b border-gray-300">
                    <span
                      className={
                        c.status === "Resolved"
                          ? "text-[#22C55E]"
                          : c.status === "Escalated"
                          ? "text-[#EF4444]"
                          : c.status === "Verification Requested"
                          ? "text-yellow-500"
                          : "text-[#1E293B]"
                      }
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-2.5 border-b border-gray-300">{c.escalation_level}</td>
                  <td className="p-2.5 border-b border-gray-300 space-x-2">
                    {c.status === "Pending" && (
                      <>
                        <button
                          onClick={() => resolveCase(c.id)}
                          className="px-2.5 py-1 bg-[#0EA5E9] text-white rounded hover:bg-[#38BDF8] transition duration-200 text-xs disabled:bg-gray-400 disabled:cursor-not-allowed"
                          disabled={actionLoading[c.id] === "resolve"}
                        >
                          {actionLoading[c.id] === "resolve" ? "Resolving..." : "Resolve"}
                        </button>
                        <button
                          onClick={() => escalateCase(c.id)}
                          className="px-2.5 py-1 bg-[#EF4444] text-white rounded hover:bg-[#F87171] transition duration-200 text-xs disabled:bg-gray-400 disabled:cursor-not-allowed"
                          disabled={actionLoading[c.id] === "escalate"}
                        >
                          {actionLoading[c.id] === "escalate" ? "Escalating..." : "Escalate"}
                        </button>
                        <button
                          onClick={() => requestVerification(c.id)}
                          className="px-2.5 py-1 bg-[#38BDF8] text-white rounded hover:bg-[#0EA5E9] transition duration-200 text-xs disabled:bg-gray-400 disabled:cursor-not-allowed"
                          disabled={actionLoading[c.id] === "verify"}
                        >
                          {actionLoading[c.id] === "verify" ? "Verifying..." : "Verify"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}