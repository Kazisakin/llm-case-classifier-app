"use client"
import CaseForm from "@/components/CaseForm"
import Dashboard from "@/components/Dashboard"
import Navbar from "@/components/Navbar"
export default function Home() {
  return (
    <main className="max-w-6xl mx-auto p-6 pt-20 space-y-8">
      <Navbar />
      <CaseForm />
      <Dashboard />
    </main>
  )
}