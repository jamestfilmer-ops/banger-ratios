'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const tabs = [
  { href: '/',             label: 'Home',         icon: '🏠' },
  { href: '/leaderboards', label: 'Charts',       icon: '🏆' },
  { href: '/releases',     label: 'New',          icon: '🎵' },
  { href: '/friends',      label: 'Friends',      icon: '👥' },
  { href: '/data',         label: 'Data',         icon: '📊' },
  { href: '/merch',        label: 'Merch',        icon: '🛍️' },
  { href: '/about',        label: 'About',        icon: 'ℹ️' },
]

const mobileBottomTabs = [
  { href: '/',             label: 'Home',     icon: '🏠' },
  { href: '/leaderboards', label: 'Charts',   icon: '🏆' },
  { href: '/releases',     label: 'New',      icon: '🎵' },
  { href: '/friends',      label: 'Friends',  icon: '👥' },
  { href: '/profile',      label: 'Profile',  icon: '👤' },
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

  useEffect(() => {
    if (menuOpen) setMenuOpen(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const isActive = (href) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <>
      {/* ── Top Nav ── */}
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
          {/* Logo */}
          <a href='/' style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

          {/* Desktop tabs */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className='desktop-nav'>
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

          {/* Desktop auth */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className='desktop-nav'>
            {user ? (
              <>
                <a href='/profile' style={{
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
              <a href='/auth' style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--pink)', color: 'white',
              }}>Sign In</a>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className='hamburger'
            style={{
              display: 'none', background: 'none', border: 'none',
              cursor: 'pointer', padding: 8, borderRadius: 8, color: 'var(--black)',
            }}
            aria-label='Toggle menu'
          >
            {menuOpen ? (
              <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'>
                <line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/>
              </svg>
            ) : (
              <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'>
                <line x1='3' y1='6'  x2='21' y2='6'/>
                <line x1='3' y1='12' x2='21' y2='12'/>
                <line x1='3' y1='18' x2='21' y2='18'/>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 57, left: 0, right: 0, zIndex: 99,
          background: 'white', borderBottom: '1px solid var(--gray-200)',
          padding: '12px 16px 20px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }} className='mobile-menu'>
          {tabs.map(t => (
            <a key={t.href} href={t.href} style={{
              display: 'block', padding: '11px 14px', borderRadius: 10,
              fontSize: 15, fontWeight: isActive(t.href) ? 600 : 400,
              color: isActive(t.href) ? 'var(--pink)' : 'var(--black)',
              background: isActive(t.href) ? 'var(--pink-subtle)' : 'transparent',
              marginBottom: 2,
            }}>{t.icon} {t.label}</a>
          ))}
          <div style={{ borderTop: '1px solid var(--gray-200)', marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {user ? (
              <>
                <a href='/profile' style={{
                  display: 'block', padding: '11px 14px', borderRadius: 10,
                  fontSize: 15, fontWeight: 600, background: 'var(--gray-100)', color: 'var(--black)',
                }}>Profile</a>
                <button onClick={signOut} style={{
                  padding: '11px 14px', borderRadius: 10, fontSize: 15, fontWeight: 600,
                  background: 'none', border: '1px solid var(--gray-200)',
                  color: 'var(--gray-600)', cursor: 'pointer', textAlign: 'left',
                }}>Sign Out</button>
              </>
            ) : (
              <a href='/auth' style={{
                display: 'block', padding: '11px 14px', borderRadius: 10,
                fontSize: 15, fontWeight: 700, background: 'var(--pink)',
                color: 'white', textAlign: 'center',
              }}>Sign In</a>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Nav ── */}
      <nav className='mobile-bottom-nav' style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(255,255,255,0.97)',
        borderTop: '1px solid var(--gray-200)',
        backdropFilter: 'blur(20px)',
        display: 'none',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0 4px' }}>
          {mobileBottomTabs.map(t => (
            <a key={t.href} href={t.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, padding: '4px 12px', borderRadius: 8, fontSize: 10,
              fontWeight: isActive(t.href) ? 700 : 400,
              color: isActive(t.href) ? 'var(--pink)' : 'var(--gray-600)',
              textDecoration: 'none', minWidth: 52,
            }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span>{t.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </>
  )
}
