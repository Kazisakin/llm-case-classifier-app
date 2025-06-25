"use client"
import { useEffect, useState } from "react"

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

const BASE_URL = "https://llm-case-classifier-app.onrender.com"

export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([])
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  const fetchCases = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append("status", statusFilter)
      if (priorityFilter) params.append("priority", priorityFilter)
      const res = await fetch(`${BASE_URL}/cases/filter?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
      const data = await res.json()
      const filtered = data.filter((c: Case) =>
        c.description.toLowerCase().includes(search.toLowerCase())
      )
      setCases(filtered)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  useEffect(() => {
    fetchCases()
  }, [statusFilter, priorityFilter, search])

  const resolveCase = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/cases/${id}/resolve`, { method: "PATCH" })
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
      await fetchCases()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const escalateCase = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/cases/${id}/escalate`, { method: "PATCH" })
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
      await fetchCases()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const requestVerification = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/cases/${id}/verify`, { method: "POST" })
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
      await fetchCases()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-12 text-white">
      <h1 className="text-3xl font-bold mb-6 text-[#AFDDE5]">History</h1>

      <div className="bg-[#003135] shadow-md rounded-xl p-6 transition-all duration-300 hover:shadow-lg">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 bg-[#0F4A4F] border border-[#0FAAAF] rounded-lg p-3 placeholder-gray-400 focus:ring-2 focus:ring-[#AFDDE5] focus:outline-none transition"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-1/3 bg-[#0F4A4F] border border-[#0FAAAF] rounded-lg p-3 text-white focus:ring-2 focus:ring-[#AFDDE5] focus:outline-none transition"
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
            className="w-full md:w-1/3 bg-[#0F4A4F] border border-[#0FAAAF] rounded-lg p-3 text-white focus:ring-2 focus:ring-[#AFDDE5] focus:outline-none transition"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-[#964734] border border-[#0FAAAF] text-white rounded">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-[#0F4A4F]">
              <tr>
                {["ID", "Description", "Email", "Priority", "Category", "Status", "Escalation", "Actions"].map((col) => (
                  <th key={col} className="p-3 border-b border-[#0FAAAF] text-[#AFDDE5] font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-[#0FAAAF]/10 transition">
                  <td className="p-3 border-b border-[#0FAAAF]">{c.id}</td>
                  <td className="p-3 border-b border-[#0FAAAF]">{c.description}</td>
                  <td className="p-3 border-b border-[#0FAAAF]">{c.email}</td>
                  <td className="p-3 border-b border-[#0FAAAF]">{c.priority}</td>
                  <td className="p-3 border-b border-[#0FAAAF]">{c.category}</td>
                  <td className="p-3 border-b border-[#0FAAAF]">
                    <span
                      className={
                        c.status === "Resolved"
                          ? "text-[#56da7e]"
                          : c.status === "Escalated"
                          ? "text-[#f87171]"
                          : c.status === "Verification Requested"
                          ? "text-yellow-400"
                          : "text-white"
                      }
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 border-b border-[#0FAAAF]">{c.escalation_level}</td>
                  <td className="p-3 border-b border-[#0FAAAF] space-x-2">
                    {c.status === "Pending" && (
                      <>
                        <button
                          onClick={() => resolveCase(c.id)}
                          className="bg-[#AFDDE5] text-[#003135] px-3 py-1 rounded hover:bg-[#0FAAAF] transition"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => escalateCase(c.id)}
                          className="bg-[#964734] text-white px-3 py-1 rounded hover:bg-[#003135] transition"
                        >
                          Escalate
                        </button>
                        <button
                          onClick={() => requestVerification(c.id)}
                          className="bg-[#0FAAAF] text-white px-3 py-1 rounded hover:bg-[#AFDDE5] transition"
                        >
                          Verify
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
