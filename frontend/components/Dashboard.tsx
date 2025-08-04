"use client"
import { useEffect, useRef, useState } from "react"
import Chart from "chart.js/auto"

const BASE_URL = "http://localhost:8000"

export default function Dashboard() {
  const [stats, setStats] = useState<{
    total: number
    resolved: number
    pending: number
    byCategory: { [key: string]: number }
    byPriority: { [key: string]: number }
    daily: { [key: string]: number }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const categoryChartRef = useRef<HTMLCanvasElement>(null)
  const priorityChartRef = useRef<HTMLCanvasElement>(null)
  const dailyChartRef = useRef<HTMLCanvasElement>(null)
  const [charts, setCharts] = useState<{ category?: Chart; priority?: Chart; daily?: Chart }>({})

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${BASE_URL}/cases/stats`)
        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`Failed to fetch stats: ${res.status} ${errorText}`)
        }
        const data = await res.json()
        console.log("Stats API response:", data)
        setStats({
          total: data.total ?? 0,
          resolved: data.resolved ?? 0,
          pending: data.pending ?? 0,
          byCategory: data.byCategory ?? {},
          byPriority: data.byPriority ?? {},
          daily: data.daily ?? {},
        })
        setError(null)
      } catch (err: unknown) {
        console.error("Fetch stats error:", err)
        setError(err instanceof Error ? err.message : "Failed to load statistics")
        setStats({
          total: 0,
          resolved: 0,
          pending: 0,
          byCategory: {},
          byPriority: {},
          daily: {},
        })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    if (loading || !stats || !categoryChartRef.current || !priorityChartRef.current || !dailyChartRef.current) return

    const categoryChart = new Chart(categoryChartRef.current, {
      type: "bar",
      data: {
        labels: Object.keys(stats.byCategory),
        datasets: [{
          label: "Cases by Category",
          data: Object.values(stats.byCategory),
          backgroundColor: "#0EA5E9",
          borderRadius: 4,
        }],
      },
      options: {
        scales: { y: { beginAtZero: true, ticks: { color: "#1E293B" } }, x: { ticks: { color: "#1E293B" } } },
        plugins: { legend: { labels: { color: "#1E293B" } } },
      },
    })

    const priorityChart = new Chart(priorityChartRef.current, {
      type: "doughnut",
      data: {
        labels: Object.keys(stats.byPriority),
        datasets: [{
          label: "Cases by Priority",
          data: Object.values(stats.byPriority),
          backgroundColor: ["#22C55E", "#0EA5E9", "#EF4444"],
        }],
      },
      options: { plugins: { legend: { labels: { color: "#1E293B" } } } },
    })

    const dailyChart = new Chart(dailyChartRef.current, {
      type: "line",
      data: {
        labels: Object.keys(stats.daily),
        datasets: [{
          label: "Daily Cases",
          data: Object.values(stats.daily),
          borderColor: "#0EA5E9",
          backgroundColor: "#0EA5E9",
          fill: false,
          tension: 0.3,
        }],
      },
      options: {
        scales: { y: { beginAtZero: true, ticks: { color: "#1E293B" } }, x: { ticks: { color: "#1E293B" } } },
        plugins: { legend: { labels: { color: "#1E293B" } } },
      },
    })

    setCharts({ category: categoryChart, priority: priorityChart, daily: dailyChart })

    return () => {
      categoryChart.destroy()
      priorityChart.destroy()
      dailyChart.destroy()
    }
  }, [loading, stats])

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md">
        <h1 className="text-xl font-bold text-[#38BDF8] mb-6">Case Statistics</h1>
        <p className="text-sm text-[#1E293B]">Loading statistics...</p>
      </div>
    )
  }

  if (error || !stats || (stats.total === 0 && Object.keys(stats.byCategory).length === 0)) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md">
        <h1 className="text-xl font-bold text-[#38BDF8] mb-6">Case Statistics</h1>
        <p className="text-sm text-[#EF4444]">{error || "No statistics available. Try submitting a case."}</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-xl font-bold text-[#38BDF8] mb-6">Case Statistics</h1>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#F1F5F9] rounded-lg">
            <h3 className="text-sm font-medium text-[#38BDF8]">Total Cases</h3>
            <p className="text-xl font-semibold text-[#1E293B]">{stats.total}</p>
          </div>
          <div className="p-4 bg-[#F1F5F9] rounded-lg">
            <h3 className="text-sm font-medium text-[#38BDF8]">Resolved Cases</h3>
            <p className="text-xl font-semibold text-[#1E293B]">{stats.resolved}</p>
          </div>
          <div className="p-4 bg-[#F1F5F9] rounded-lg">
            <h3 className="text-sm font-medium text-[#38BDF8]">Pending Cases</h3>
            <p className="text-xl font-semibold text-[#1E293B]">{stats.pending}</p>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-[#38BDF8] mb-2">Cases by Category</h3>
            <canvas ref={categoryChartRef} className="max-h-64"></canvas>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#38BDF8] mb-2">Cases by Priority</h3>
            <canvas ref={priorityChartRef} className="max-h-64"></canvas>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#38BDF8] mb-2">Daily Cases</h3>
            <canvas ref={dailyChartRef} className="max-h-64"></canvas>
          </div>
        </div>
      </div>
    </div>
  )
}