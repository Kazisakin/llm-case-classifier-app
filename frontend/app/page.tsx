"use client"
import CaseForm from "@/components/CaseForm"
import Dashboard from "@/components/Dashboard"

export default function Home() {
  return (
    <div className="py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CaseForm />
        <Dashboard />
      </div>
      <footer className="mt-12 py-6 bg-[#0EA5E9] rounded-lg text-center text-white">
        <p className="text-sm font-medium">
          Built by using React, Tailwind CSS, FastAPI, PostgreSQL, and OpenAI API. 
          This project automates case classification into Fraud, General Inquiry, Account Access, and Verification, 
          with real-time dashboards and email alerts.
        </p>
      </footer>
    </div>
  )
}