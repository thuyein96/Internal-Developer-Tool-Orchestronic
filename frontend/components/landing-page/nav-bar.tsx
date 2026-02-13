import OrchestronicLogo from "../orchestronic-logo"
import Link from "next/link"

const navLinks = [
  { href: "/home", label: "Home" },
  { href: "/dashboard", label: "Product" },
  { href: "/about", label: "About" },
]

export default function NavBar() {
  return (
    <nav className="flex justify-between items-center">
      <Link href="/" className="flex items-center">
        <OrchestronicLogo size={40} />
        <span className="text-xl font-semibold uppercase">Orchestronic</span>
      </Link>
      <div>
        <ul className="flex gap-6 text-sm font-medium">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className="hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
