"use client"
import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"

type Stats = {
  total_cases: number
  resolved_cases: number
  pending_cases: number
  category_breakdown: Record<string, number>
  priority_breakdown: Record<string, number>
  daily_breakdown: Record<string, number>
  avg_resolution_time_days: number
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch("http://localhost:8000/cases/stats")
      .then((res) => res.json())
      .then(setStats)
  }, [])

  if (!stats) return <LoadingScreen />

  return (
    <main className="min-h-screen p-6">
      <Navbar />
      <div className="max-w-5xl mx-auto space-y-10">
        <h1 className="text-4xl font-bold text-center text-gray-200">Case Statistics Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard title="Total Cases" value={stats.total_cases} />
          <StatCard title="Resolved Cases" value={stats.resolved_cases} />
          <StatCard title="Pending Cases" value={stats.pending_cases} />
          <StatCard title="Avg Resolution Time (Days)" value={stats.avg_resolution_time_days.toFixed(2)} />
        </div>
        <BreakdownSection title="Category Breakdown" data={stats.category_breakdown} />
        <BreakdownSection title="Priority Breakdown" data={stats.priority_breakdown} />
        <BreakdownSection title="Daily Breakdown" data={stats.daily_breakdown} />
      </div>
    </main>
  )
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center border border-gray-700">
      <p className="text-gray-400 font-medium">{title}</p>
      <h2 className="text-4xl font-bold text-gray-200 mt-2">{value}</h2>
    </div>
  )
}

function BreakdownSection({ title, data }: { title: string; data: Record<string, number> }) {
  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold text-gray-200 mb-4">{title}</h2>
      <div className="overflow-x-auto rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 uppercase">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Label</th>
              <th className="px-6 py-3 text-left font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data).map(([key, value]) => (
              <tr key={key} className="hover:bg-gray-800 transition-colors duration-200">
                <td className="px-6 py-4 text-gray-300">{key}</td>
                <td className="px-6 py-4 text-gray-300">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-xl font-medium animate-pulse">Loading dashboard...</p>
    </div>
  )
}