"use client"
import CaseForm from "@/components/CaseForm"
import Dashboard from "@/components/Dashboard"
import Stats from "@/app/stats/page"

export default function Home() {
  return (
    <div className="space-y-8 pb-12">
      <CaseForm />
      <Dashboard />
      <Stats />
    </div>
  )
}
