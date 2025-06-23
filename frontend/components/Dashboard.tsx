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
      const res = await fetch(`http://localhost:8000/cases/filter?${params}`)
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
      const res = await fetch(`http://localhost:8000/cases/${id}/resolve`, { method: "PATCH" })
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
      await fetchCases()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const escalateCase = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/cases/${id}/escalate`, { method: "PATCH" })
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
      await fetchCases()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const requestVerification = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/cases/${id}/verify`, { method: "POST" })
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
      await fetchCases()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 pt-20">

      <h1 className="text-3xl font-bold mb-6">Case Management System</h1>
      <div className="bg-gray-900 shadow-md rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            className="w-full md:w-1/3 bg-gray-700 border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-200 placeholder-gray-400"
            placeholder="Search by description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="w-full md:w-1/3 bg-gray-700 border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-200"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="" className="text-gray-500">All Statuses</option>
            <option value="Pending" className="text-gray-500">Pending</option>
            <option value="Resolved" className="text-gray-500">Resolved</option>
            <option value="Escalated" className="text-gray-500">Escalated</option>
            <option value="Verification Requested" className="text-gray-500">Verification Requested</option>
          </select>
          <select
            className="w-full md:w-1/3 bg-gray-700 border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-200"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="" className="text-gray-500">All Priorities</option>
            <option value="Low" className="text-gray-500">Low</option>
            <option value="Medium" className="text-gray-500">Medium</option>
            <option value="High" className="text-gray-500">High</option>
          </select>
        </div>
        {error && (
          <div className="mb-6 p-3 bg-red-800 border border-red-700 text-red-200 rounded">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-3 border-b border-gray-700">ID</th>
                <th className="p-3 border-b border-gray-700">Description</th>
                <th className="p-3 border-b border-gray-700">Email</th>
                <th className="p-3 border-b border-gray-700">Priority</th>
                <th className="p-3 border-b border-gray-700">Category</th>
                <th className="p-3 border-b border-gray-700">Status</th>
                <th className="p-3 border-b border-gray-700">Escalation Level</th>
                <th className="p-3 border-b border-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-gray-700">
                  <td className="p-3 border-b border-gray-700">{c.id}</td>
                  <td className="p-3 border-b border-gray-700">{c.description}</td>
                  <td className="p-3 border-b border-gray-700">{c.email}</td>
                  <td className="p-3 border-b border-gray-700">{c.priority}</td>
                  <td className="p-3 border-b border-gray-700">{c.category}</td>
                  <td className="p-3 border-b border-gray-700">
                    <span className={c.status === "Resolved" ? "text-green-400" : c.status === "Escalated" ? "text-yellow-400" : "text-red-400"}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 border-b border-gray-700">{c.escalation_level}</td>
                  <td className="p-3 border-b border-gray-700 space-x-2">
                    {c.status === "Pending" && (
                      <>
                        <button
                          onClick={() => resolveCase(c.id)}
                          className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => escalateCase(c.id)}
                          className="bg-yellow-600 px-3 py-1 rounded hover:bg-yellow-700 transition"
                        >
                          Escalate
                        </button>
                        <button
                          onClick={() => requestVerification(c.id)}
                          className="bg-purple-600 px-3 py-1 rounded hover:bg-purple-700 transition"
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