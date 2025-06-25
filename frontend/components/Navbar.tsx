"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-[#0F4A4F] shadow-md sticky top-0 z-50 w-full">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-white text-2xl font-bold tracking-tight hover:text-[#AFDDE5] transition duration-300"
        >
          Case Manager
        </Link>
        <div className="flex space-x-6">
          <Link
            href="/"
            className={`text-sm font-medium ${
              pathname === "/" ? "text-white" : "text-[#AFDDE5] hover:text-white"
            } transition duration-300 hover:underline`}
          >
            Home
          </Link>
          <Link
            href="/stats"
            className={`text-sm font-medium ${
              pathname === "/stats" ? "text-white" : "text-[#AFDDE5] hover:text-white"
            } transition duration-300 hover:underline`}
          >
            Statistics
          </Link>
        </div>
      </div>
    </nav>
  )
}
