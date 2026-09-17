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
          backgroundColor: "#374151",
          borderRadius: 3,
          maxBarThickness: 22,
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: "#9CA3AF", font: { size: 11 } }, grid: { color: "#F3F4F6" } },
          x: { ticks: { color: "#9CA3AF", font: { size: 11 } }, grid: { display: false } },
        },
      },
    })

    const priorityChart = new Chart(priorityChartRef.current, {
      type: "doughnut",
      data: {
        labels: Object.keys(stats.byPriority),
        datasets: [{
          data: Object.values(stats.byPriority),
          backgroundColor: ["#111827", "#9CA3AF", "#D1D5DB"],
          borderWidth: 0,
        }],
      },
      options: {
        plugins: { legend: { position: "bottom", labels: { color: "#6B7280", boxWidth: 8, font: { size: 11 }, padding: 12 } } },
        cutout: "68%",
      },
    })

    const dailyChart = new Chart(dailyChartRef.current, {
      type: "line",
      data: {
        labels: Object.keys(stats.daily),
        datasets: [{
          label: "Daily Cases",
          data: Object.values(stats.daily),
          borderColor: "#111827",
          backgroundColor: "rgba(17,24,39,0.04)",
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointBackgroundColor: "#111827",
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: "#9CA3AF", font: { size: 11 } }, grid: { color: "#F3F4F6" } },
          x: { ticks: { color: "#9CA3AF", font: { size: 11 } }, grid: { display: false } },
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
      <div className="app-card p-5">
        <h2 className="text-[15px] font-semibold text-gray-900 mb-3">Case Statistics</h2>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 rounded-md bg-gray-100 animate-pulse-soft" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats || (stats.total === 0 && Object.keys(stats.byCategory).length === 0)) {
    return (
      <div className="app-card p-5">
        <h2 className="text-[15px] font-semibold text-gray-900 mb-2">Case Statistics</h2>
        <p className="text-sm text-gray-400">{error ? `Couldn't load stats: ${error}` : "No statistics yet -- submit a case to get started."}</p>
      </div>
    )
  }

  return (
    <div className="app-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-gray-900">Case Statistics</h2>
        <span className="text-xs text-gray-400">Live</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <StatTile label="Total" value={stats.total} />
        <StatTile label="Resolved" value={stats.resolved} />
        <StatTile label="Pending" value={stats.pending} />
        <StatTile
          label="Avg. Resolution"
          value={insights ? `${insights.avg_resolution_time_days.toFixed(1)}d` : "-"}
        />
      </div>

      {insights?.top_category && (
        <div className="mb-5 px-3 py-2.5 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-between">
          <span className="text-[13px] text-gray-500">Most common category</span>
          <span className="flex items-center gap-2">
            <span className="tag">{insights.top_category}</span>
            <span className="text-xs text-gray-400">{insights.top_category_count} case{insights.top_category_count === 1 ? "" : "s"}</span>
          </span>
        </div>
      )}

      <div className="space-y-5">
        <ChartBlock title="Cases by Category"><canvas ref={categoryChartRef} className="max-h-52" /></ChartBlock>
        <ChartBlock title="Cases by Priority"><canvas ref={priorityChartRef} className="max-h-52" /></ChartBlock>
        <ChartBlock title="Daily Volume"><canvas ref={dailyChartRef} className="max-h-52" /></ChartBlock>
      </div>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
      <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function ChartBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">{title}</h3>
      <div className="w-full h-52">{children}</div>
    </div>
  )
}
