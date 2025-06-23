"use client"
import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4 shadow-md sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-xl font-semibold">Case Manager</Link>
        <div className="space-x-6">
          <Link href="#" className="text-gray-300 hover:text-gray-100 transition">Home</Link>
          
          <Link href="/stats" className="text-gray-300 hover:text-gray-100 transition">Stats</Link>
        </div>
      </div>
    </nav>
  )
}