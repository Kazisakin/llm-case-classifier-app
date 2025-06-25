import type { Metadata } from "next"
import "./globals.css"
import Navbar from "@/components/Navbar" // ✅ import it globally

export const metadata: Metadata = {
  title: "Ticket (Case) Classifier",
  description: "Ticket (Case) Classifier",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#024950] text-white min-h-screen">
        <Navbar /> {/* ✅ Global Navbar here */}
        <main className="pt-24 px-4 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  )
}
