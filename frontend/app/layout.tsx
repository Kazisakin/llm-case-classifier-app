import type { Metadata } from "next"
import "./globals.css"
import Navbar from "@/components/Navbar"

export const metadata: Metadata = {
  title: "Case Classifier — AI-Powered Support Triage",
  description: "Automated support case classification and triage, powered by Claude.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--bg)] antialiased">
        <Navbar />
        <main className="pt-8 px-6 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  )
}
