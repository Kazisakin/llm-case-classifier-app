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
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] text-white shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </span>
          <span className="text-[#0F172A] text-[15px] font-semibold tracking-tight group-hover:text-[#0284C7] transition-colors">
            Case Classifier
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#0EA5E9] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          <span className="hidden sm:inline-flex ml-3 items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Powered by Claude
          </span>
        </div>
      </div>
    </nav>
  )
}
