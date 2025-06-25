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
  } catch (error) {
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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6">Submit a New Case</h1>
      <div className="bg-gray-900 shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full h-32 bg-gray-700 border-gray-600 rounded-lg p-4 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-200 placeholder-gray-500 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue (e.g., login problems, payment issues)"
          />
          <input
            type="email"
            className="w-full bg-gray-700 border-gray-600 rounded-lg p-4 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-200 placeholder-gray-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <select
            className="w-full bg-gray-700 border-gray-600 rounded-lg p-4 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-200 appearance-none"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="Low" className="text-gray-500">Low</option>
            <option value="Medium" className="text-gray-500">Medium</option>
            <option value="High" className="text-gray-500">High</option>
          </select>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Classifying..." : "Classify Case"}
          </button>
        </form>
        {result && (
          <div className="mt-6 p-4 bg-gray-700 border border-gray-600 rounded-lg">
            <h2 className="text-lg font-medium mb-2">Classification Result</h2>
            <p className="text-gray-300"><strong>Category:</strong> {result}</p>
            <p className="text-gray-300"><strong>Status:</strong> {status}</p>
          </div>
        )}
      </div>
    </div>
  )
}