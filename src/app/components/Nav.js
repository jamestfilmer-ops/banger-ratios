'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const tabs = [
  { href: '/',             label: 'Home' },
  { href: '/leaderboards', label: 'Leaderboards' },
  { href: '/releases',     label: 'New Releases' },
  { href: '/friends',      label: 'Friends' },
  { href: '/merch',        label: 'Merch' },
  { href: '/about',        label: 'About' },
]

export default function Nav() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)

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
      borderBottom: '1px solid var(--gray-200)',
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
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'var(--pink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, color: 'white', letterSpacing: 0.5,
          }}>BR</div>
          <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--black)', letterSpacing: 0.5 }}>
            BANGER RATIOS
          </span>
        </a>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {tabs.map(t => (
            <a key={t.href} href={t.href} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13,
              fontWeight: isActive(t.href) ? 600 : 400,
              color: isActive(t.href) ? 'var(--pink)' : 'var(--gray-600)',
              background: isActive(t.href) ? 'var(--pink-subtle)' : 'transparent',
              transition: 'all 0.15s',
            }}>{t.label}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user ? (
            <>
              <a href="/profile" style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--gray-100)', color: 'var(--black)',
              }}>Profile</a>
              <button onClick={signOut} style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'none', border: '1px solid var(--gray-200)',
                color: 'var(--gray-600)', cursor: 'pointer',
              }}>Sign Out</button>
            </>
          ) : (
            <a href="/auth" style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'var(--pink)', color: 'white',
            }}>Sign In</a>
          )}
        </div>
      </div>
    </nav>
  )
}