"use client"
import { useEffect, useState } from "react" 
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

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
    const fetchStats = async () => {
      try {
        const res = await fetch("https://llm-case-classifier-app.onrender.com/cases/stats")
        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error("Failed to fetch stats:", err)
      }
    }
    fetchStats()
  }, [])

  if (!stats) return <LoadingScreen />

  return (
    
    <main className="min-h-screen bg-[#0F4A4F] pt-20 pb-12 px-6">
      
      <div className="max-w-5xl mx-auto text-white space-y-10">
        <h1 className="text-4xl font-bold text-center text-[#AFDDE5]">Case Statistics Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
    <div className="bg-[#003135] p-6 rounded-xl shadow-md hover:shadow-lg text-center border border-[#0FAAAF] transition-all duration-300">
      <p className="text-[#AFDDE5] font-medium">{title}</p>
      <h2 className="text-4xl font-bold mt-2">{value}</h2>
    </div>
  )
}

function BreakdownSection({ title, data }: { title: string; data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: key,
    count: value
  }))

  return (
    <div className="bg-[#003135] p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300">
      <h2 className="text-2xl font-semibold text-[#AFDDE5] mb-4">{title}</h2>

      {/* Bar Chart */}
      <div className="w-full h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: "#AFDDE5" }} />
            <YAxis tick={{ fill: "#AFDDE5" }} />
            <Tooltip />
            <Bar dataKey="count" fill="#0FAAAF" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-[#0F4A4F] text-[#AFDDE5] uppercase">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Label</th>
              <th className="px-6 py-3 text-left font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map(({ name, count }) => (
              <tr key={name} className="hover:bg-[#0FAAAF]/20 transition-colors">
                <td className="px-6 py-4">{name}</td>
                <td className="px-6 py-4">{count}</td>
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
    <div className="min-h-screen flex items-center justify-center bg-[#0F4A4F]">
      <p className="text-[#AFDDE5] text-xl font-medium animate-pulse">Loading dashboard...</p>
    </div>
  )
}
