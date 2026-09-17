"use client"
import { useEffect, useRef, useState } from "react"
import Chart from "chart.js/auto"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://llm-case-classifier-app.onrender.com"

type Stats = {
  total: number
  resolved: number
  pending: number
  byCategory: { [key: string]: number }
  byPriority: { [key: string]: number }
  daily: { [key: string]: number }
}

type Insights = {
  avg_resolution_time_days: number
  top_category: string | null
  top_category_count: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const categoryChartRef = useRef<HTMLCanvasElement>(null)
  const priorityChartRef = useRef<HTMLCanvasElement>(null)
  const dailyChartRef = useRef<HTMLCanvasElement>(null)
  const chartsRef = useRef<{ category?: Chart; priority?: Chart; daily?: Chart }>({})

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [statsRes, insightsRes] = await Promise.all([
          fetch(`${BASE_URL}/cases/stats`),
          fetch(`${BASE_URL}/cases/insights`),
        ])
        if (!statsRes.ok) {
          const errorText = await statsRes.text()
          throw new Error(`Failed to fetch stats: ${statsRes.status} ${errorText}`)
        }
        const statsData = await statsRes.json()
        setStats({
          total: statsData.total ?? 0,
          resolved: statsData.resolved ?? 0,
          pending: statsData.pending ?? 0,
          byCategory: statsData.byCategory ?? {},
          byPriority: statsData.byPriority ?? {},
          daily: statsData.daily ?? {},
        })

        if (insightsRes.ok) {
          const insightsData = await insightsRes.json()
          setInsights(insightsData)
        }
        setError(null)
      } catch (err: unknown) {
        console.error("Fetch stats error:", err)
        setError(err instanceof Error ? err.message : "Failed to load statistics")
        setStats({ total: 0, resolved: 0, pending: 0, byCategory: {}, byPriority: {}, daily: {} })
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  useEffect(() => {
    if (loading || !stats || !categoryChartRef.current || !priorityChartRef.current || !dailyChartRef.current) return

    Object.values(chartsRef.current).forEach((c) => c?.destroy())

    const categoryChart = new Chart(categoryChartRef.current, {
      type: "bar",
      data: {
        labels: Object.keys(stats.byCategory),
        datasets: [{
          label: "Cases",
          data: Object.values(stats.byCategory),
          backgroundColor: "#0EA5E9",
          borderRadius: 6,
          maxBarThickness: 28,
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: "#94A3B8" }, grid: { color: "#F1F5F9" } },
          x: { ticks: { color: "#94A3B8" }, grid: { display: false } },
        },
      },
    })

    const priorityChart = new Chart(priorityChartRef.current, {
      type: "doughnut",
      data: {
        labels: Object.keys(stats.byPriority),
        datasets: [{
          data: Object.values(stats.byPriority),
          backgroundColor: ["#EF4444", "#F59E0B", "#22C55E"],
          borderWidth: 0,
        }],
      },
      options: {
        plugins: { legend: { position: "bottom", labels: { color: "#64748B", boxWidth: 10, padding: 12 } } },
        cutout: "65%",
      },
    })

    const dailyChart = new Chart(dailyChartRef.current, {
      type: "line",
      data: {
        labels: Object.keys(stats.daily),
        datasets: [{
          label: "Daily Cases",
          data: Object.values(stats.daily),
          borderColor: "#0EA5E9",
          backgroundColor: "rgba(14,165,233,0.08)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: "#0EA5E9",
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: "#94A3B8" }, grid: { color: "#F1F5F9" } },
          x: { ticks: { color: "#94A3B8" }, grid: { display: false } },
        },
      },
    })

    chartsRef.current = { category: categoryChart, priority: priorityChart, daily: dailyChart }

    return () => {
      categoryChart.destroy()
      priorityChart.destroy()
      dailyChart.destroy()
    }
  }, [loading, stats])

  if (loading) {
    return (
      <div className="app-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Case Statistics</h2>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse-soft" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats || (stats.total === 0 && Object.keys(stats.byCategory).length === 0)) {
    return (
      <div className="app-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Case Statistics</h2>
        <p className="text-sm text-slate-400">{error ? `Couldn't load stats: ${error}` : "No statistics yet — submit a case to get started."}</p>
      </div>
    )
  }

  return (
    <div className="app-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Case Statistics</h2>
        <span className="pill pill-brand">Live</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatTile label="Total" value={stats.total} />
        <StatTile label="Resolved" value={stats.resolved} accent="text-emerald-600" />
        <StatTile label="Pending" value={stats.pending} accent="text-amber-600" />
        <StatTile
          label="Avg. Resolution"
          value={insights ? `${insights.avg_resolution_time_days.toFixed(1)}d` : "—"}
        />
      </div>

      {insights?.top_category && (
        <div className="mb-6 p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">Most common category</span>
          <span className="flex items-center gap-2">
            <span className="pill pill-brand">{insights.top_category}</span>
            <span className="text-xs text-slate-400">{insights.top_category_count} case{insights.top_category_count === 1 ? "" : "s"}</span>
          </span>
        </div>
      )}

      <div className="space-y-6">
        <ChartBlock title="Cases by Category"><canvas ref={categoryChartRef} className="max-h-56" /></ChartBlock>
        <ChartBlock title="Cases by Priority"><canvas ref={priorityChartRef} className="max-h-56" /></ChartBlock>
        <ChartBlock title="Daily Volume"><canvas ref={dailyChartRef} className="max-h-56" /></ChartBlock>
      </div>
    </div>
  )
}

function StatTile({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-semibold ${accent ?? "text-slate-900"}`}>{value}</p>
    </div>
  )
}

function ChartBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{title}</h3>
      <div className="w-full h-56">{children}</div>
    </div>
  )
}
