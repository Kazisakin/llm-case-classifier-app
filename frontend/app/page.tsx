"use client"
import CaseForm from "@/components/CaseForm"
import Dashboard from "@/components/Dashboard"

export default function Home() {
  return (
    <div className="pb-12">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Support Case Workspace</h1>
        <p className="text-sm text-gray-500 mt-1">
          Submit a case for automated triage, then track and act on the queue below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <CaseForm />
        <Dashboard />
      </div>

      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
        Next.js, FastAPI, and the Claude API. Cases are classified into Fraud, Account Access,
        Verification, or General Inquiry, with dashboards and email alerts on status changes.
      </div>
    </div>
  )
}
