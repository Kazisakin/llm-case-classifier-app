"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/", label: "Workspace" },
  { href: "/stats", label: "Insights" },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-900 text-white">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </span>
          <span className="text-gray-900 text-[14px] font-semibold">
            Case Classifier
          </span>
        </Link>

        <div className="flex items-center gap-5 h-full">
          {links.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`h-full flex items-center text-[13px] font-medium border-b-2 transition-colors ${
                  active
                    ? "text-gray-900 border-gray-900"
                    : "text-gray-500 border-transparent hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          <span className="hidden sm:inline text-[12px] text-gray-400">
            Claude API
          </span>
        </div>
      </div>
    </nav>
  )
}
