'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const tabs = [
  { href: '/',             label: 'Home' },
  { href: '/albums',       label: 'Albums' },
  { href: '/artists',      label: 'Artists' },
  { href: '/leaderboards', label: 'Leaderboards' },
  { href: '/releases',     label: 'Releases' },
  { href: '/merch',        label: 'Merch' },
  { href: '/about',        label: 'About' },
]

export default function Nav() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const isActive = (href) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav style={{
      borderBottom: '1px solid var(--border)',
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 100,
      padding: '0 24px',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, background: 'var(--pink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, color: 'white', letterSpacing: 0.5,
          }}>BR</div>
          <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--black)', letterSpacing: 0.5 }}>
            BANGER RATIOS
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {tabs.map(t => (
            <Link key={t.href} href={t.href} style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 13,
              fontWeight: isActive(t.href) ? 600 : 400,
              color: isActive(t.href) ? 'var(--pink)' : 'var(--gray-text)',
              background: isActive(t.href) ? 'rgba(255,0,102,0.06)' : 'transparent',
              transition: 'all 0.15s',
            }}>{t.label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user ? (
            <>
              <Link href="/profile" style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--bg-soft)', color: 'var(--black)',
              }}>Profile</Link>
              <button onClick={signOut} style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--gray-text)', cursor: 'pointer', fontFamily: 'inherit',
              }}>Sign Out</button>
            </>
          ) : (
            <Link href="/auth" style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'var(--pink)', color: 'white',
            }}>Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
