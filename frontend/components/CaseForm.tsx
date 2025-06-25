"use client"
import { useState } from "react"

export default function CaseForm() {
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [priority, setPriority] = useState("Medium")
  const [result, setResult] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || !email.trim() || !priority) return
    setLoading(true)
    try {
      const res = await fetch("https://llm-case-classifier-app.onrender.com/classify-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, email, priority })
      })
      if (!res.ok) throw new Error("Failed to classify case")
      const data = await res.json()
      setResult(data.category)
      setStatus(data.status)
    } catch {
      setResult("Error")
      setStatus("Failed")
    } finally {
      setLoading(false)
      setDescription("")
      setEmail("")
      setPriority("Medium")
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 text-white">
      <h1 className="text-3xl font-bold mb-6 text-[#AFDDE5]">Submit a Case</h1>

      <div className="bg-[#003135] rounded-xl p-6 shadow-lg transition-all duration-300">
        <form onSubmit={handleSubmit} className="space-y-5">
          <textarea
            className="w-full h-32 bg-[#0F4A4F] border border-[#0FAAAF] rounded-lg p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#AFDDE5] resize-none transition duration-300"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue (e.g., login problems, payment issues)"
          />

          <input
            type="email"
            className="w-full bg-[#0F4A4F] border border-[#0FAAAF] rounded-lg p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#AFDDE5] transition duration-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />

          <select
            className="w-full bg-[#0F4A4F] border border-[#0FAAAF] rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-[#AFDDE5] transition duration-300"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <button
            type="submit"
            className="w-full bg-[#56da7e] hover:bg-[#0FAAAF] text-white py-3 rounded-lg font-semibold transition duration-300 focus:outline-none focus:ring-2 focus:ring-[#AFDDE5] disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Classifying..." : "Classify Case"}
          </button>
        </form>

        {result && (
          <div className="mt-6 p-4 bg-[#0F4A4F] border border-[#0FAAAF] rounded-lg transition duration-300">
            <h2 className="text-lg font-semibold mb-2 text-[#AFDDE5]">Classification Result</h2>
            <p><strong>Category:</strong> {result}</p>
            <p><strong>Status:</strong> {status}</p>
          </div>
        )}
      </div>
    </div>
  )
}
