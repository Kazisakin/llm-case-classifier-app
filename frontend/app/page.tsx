"use client"
import CaseForm from "@/components/CaseForm"
import Dashboard from "@/components/Dashboard"

export default function Home() {
  return (
    <div className="pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Case Workspace</h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit a case for instant AI triage, then track and act on the queue below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <CaseForm />
        <Dashboard />
      </div>

      <footer className="mt-10 py-5 px-6 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-center text-white shadow-md">
        <p className="text-sm font-medium">
          Built with Next.js, Tailwind CSS, FastAPI, and the Claude API. Cases are automatically
          classified into Fraud, Account Access, Verification, or General Inquiry — with live
          dashboards and email alerts on status changes.
        </p>
      </footer>
    </div>
  )
}
