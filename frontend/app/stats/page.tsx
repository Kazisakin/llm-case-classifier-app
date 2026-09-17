"use client"
import { useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://llm-case-classifier-app.onrender.com"

// Matches the actual shape returned by GET /cases/stats and GET /cases/insights
// (a previous version of this page expected different field names entirely and
// silently rendered nothing/NaN -- fixed to match the real backend response).
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
        Couldn't load insights: {error}
      </div>
    )
  }

  if (!stats) return <LoadingScreen />

  return (
    <div className="pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Insights</h1>
        <p className="text-sm text-slate-500 mt-1">A deeper look at case volume, mix, and resolution speed.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Cases" value={stats.total} />
        <StatCard label="Resolved" value={stats.resolved} accent="text-emerald-600" />
        <StatCard label="Pending" value={stats.pending} accent="text-amber-600" />
        <StatCard
          label="Avg. Resolution"
          value={insights ? `${insights.avg_resolution_time_days.toFixed(2)} days` : "—"}
        />
      </div>

      {insights?.top_category && (
        <div className="app-card p-4 mb-8 flex items-center justify-between">
          <span className="text-sm text-slate-500">Most common category overall</span>
          <span className="flex items-center gap-2">
            <span className="pill pill-brand">{insights.top_category}</span>
            <span className="text-xs text-slate-400">{insights.top_category_count} cases</span>
          </span>
        </div>
      )}

      <div className="space-y-6">
        <BreakdownSection title="Category Breakdown" data={stats.byCategory} />
        <BreakdownSection title="Priority Breakdown" data={stats.byPriority} />
        <BreakdownSection title="Daily Volume" data={stats.daily} />
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="app-card p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${accent ?? "text-slate-900"}`}>{value}</p>
    </div>
  )
}

function BreakdownSection({ title, data }: { title: string; data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([key, value]) => ({ name: key, count: value }))

  if (chartData.length === 0) {
    return (
      <div className="app-card p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">{title}</h2>
        <p className="text-sm text-slate-400">No data yet.</p>
      </div>
    )
  }

  return (
    <div className="app-card p-6">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">{title}</h2>

      <div className="w-full h-64 mb-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 12 }} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto thin-scroll rounded-xl border border-slate-100">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Label</th>
              <th className="px-4 py-2.5 text-left font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map(({ name, count }) => (
              <tr key={name} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 border-t border-slate-100 text-slate-700">{name}</td>
                <td className="px-4 py-2.5 border-t border-slate-100 text-slate-700">{count}</td>
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
        <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse-soft" />
      ))}
    </div>
  )
}
