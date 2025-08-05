"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-[#0EA5E9] shadow-md sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="text-white text-xl font-bold tracking-tight hover:text-[#F1F5F9] transition duration-200"
        >
          Case Manager
        </Link>
        <div className="flex items-center space-x-4">1         
          
        </div>
      </div>
    </nav>
  )
}