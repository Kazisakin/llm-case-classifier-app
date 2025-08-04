import type { Metadata } from "next"
import "./globals.css"
import Navbar from "@/components/Navbar"

export const metadata: Metadata = {
  title: "Ticket (Case) Classifier",
  description: "Automated case classification system built by a co-op student",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </head>
      <body className="min-h-screen bg-[#F1F5F9]">
        <Navbar /> 
        <main className="pt-20 px-6 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  )
}