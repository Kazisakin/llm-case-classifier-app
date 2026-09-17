"use client"
import { useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://llm-case-classifier-app.onrender.com"

type Stats = {
  total: number
  resolved: number
  pending: number
  byCategory: Record<string, number>
  byPriority: Record<string, number>
  daily: Record<string, number>
}

type Insights = {
  avg_resolution_time_days: number
  top_category: string | null
  top_category_count: number
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, insightsRes] = await Promise.all([
          fetch(`${BASE_URL}/cases/stats`),
          fetch(`${BASE_URL}/cases/insights`),
        ])
        if (!statsRes.ok) throw new Error(`Failed to fetch stats: ${statsRes.status}`)
        setStats(await statsRes.json())
        if (insightsRes.ok) setInsights(await insightsRes.json())
      } catch (err) {
        console.error("Failed to fetch stats:", err)
        setError(err instanceof Error ? err.message : "Failed to load statistics")
      }
    }
    fetchAll()
  }, [])

  if (error) {
    return (
      <div className="py-10 text-center text-sm text-red-600">
        Could not load insights: {error}
      </div>
    )
  }

  if (!stats) return <LoadingScreen />

  return (
    <div className="pb-12">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Insights</h1>
        <p className="text-sm text-gray-500 mt-1">Case volume, mix, and resolution speed.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Cases" value={stats.total} />
        <StatCard label="Resolved" value={stats.resolved} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard
          label="Avg. Resolution"
          value={insights ? `${insights.avg_resolution_time_days.toFixed(2)} days` : "-"}
        />
      </div>

      {insights?.top_category && (
        <div className="app-card p-3.5 mb-6 flex items-center justify-between">
          <span className="text-sm text-gray-500">Most common category overall</span>
          <span className="flex items-center gap-2">
            <span className="tag">{insights.top_category}</span>
            <span className="text-xs text-gray-400">{insights.top_category_count} cases</span>
          </span>
        </div>
      )}

      <div className="space-y-5">
        <BreakdownSection title="Category Breakdown" data={stats.byCategory} />
        <BreakdownSection title="Priority Breakdown" data={stats.byPriority} />
        <BreakdownSection title="Daily Volume" data={stats.daily} />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="app-card p-3.5">
      <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function BreakdownSection({ title, data }: { title: string; data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([key, value]) => ({ name: key, count: value }))

  if (chartData.length === 0) {
    return (
      <div className="app-card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-400">No data yet.</p>
      </div>
    )
  }

  return (
    <div className="app-card p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">{title}</h2>

      <div className="w-full h-56 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#374151" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto thin-scroll rounded-md border border-gray-100">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-400 uppercase text-[11px]">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Label</th>
              <th className="px-3 py-2 text-left font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map(({ name, count }) => (
              <tr key={name} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 border-t border-gray-100 text-gray-700">{name}</td>
                <td className="px-3 py-2 border-t border-gray-100 text-gray-700">{count}</td>
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
    <div className="py-16 space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 rounded-md bg-gray-100 animate-pulse-soft" />
      ))}
    </div>
  )
}
