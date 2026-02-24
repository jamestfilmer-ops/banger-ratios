'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/',            label: 'Home'        },
  { href: '/albums',      label: 'Albums'      },
  { href: '/leaderboards', label: 'Leaderboard' },
  { href: '/artists',     label: 'Artists'     },
  { href: '/releases',    label: 'New Releases' },
  { href: '/merch',       label: 'Merch'       },
  { href: '/about',       label: 'About'       },
  { href: '/auth',        label: 'Sign In'     },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="logo">
          <span className="logo-square" />
          BANGER <span className="logo-pink">RATIOS</span>
        </Link>
        <div className="nav-right">
          {LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="nav-link">
              <span className={pathname === href ? 'active' : ''}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
