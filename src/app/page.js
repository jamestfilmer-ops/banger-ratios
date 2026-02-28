// FILE: src/app/page.js
// Cmd+A → Delete → Paste
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function AnimatedCount({ value }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === null) return
    const steps = 50
    const increment = value / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      setDisplay(Math.min(Math.round(increment * step), value))
      if (step >= steps) clearInterval(timer)
    }, 1200 / steps)
    return () => clearInterval(timer)
  }, [value])
  if (value === null) return <span style={{ color: '#ccc' }}>—</span>
  const n = display
  const f = n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : n.toLocaleString()
  return <span>{f}</span>
}

export default function Home() {
  const [counts, setCounts] = useState({ albums: null, ratings: null, users: null })

  useEffect(() => {
    async function load() {
      const [{ count: a }, { count: r }, { count: u }] = await Promise.all([
        supabase.from('albums').select('*', { count: 'exact', head: true }),
        supabase.from('ratings').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ])
      setCounts({ albums: a||0, ratings: r||0, users: u||0 })
    }
    load()
  }, [])

  return (
    <main className="section">
      <div style={{ textAlign: 'center', paddingTop: '2rem' }}>

        {/* Pill badge — THE NEW STANDARD FOR MUSIC QUALITY */}
        <div style={{
          display: 'inline-block',
          background: 'var(--pink-subtle)',
          borderRadius: 20,
          padding: '0.35rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '2px',
          color: 'var(--pink)',
          border: '1px solid rgba(255,0,102,0.15)',
        }}>
          THE NEW STANDARD FOR MUSIC QUALITY
        </div>

        {/* Headline with accent serif on Talent. */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 6vw, 3.8rem)',
          fontWeight: 700,
          lineHeight: 1.1,
          maxWidth: 800,
          margin: '0 auto 1.5rem',
        }}>
          Streams Don't Measure{' '}
          <span className="accent-serif" style={{ color: 'var(--pink)' }}>Talent.</span>
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--gray-text)',
          maxWidth: 580,
          margin: '0 auto 2.5rem',
          lineHeight: 1.7,
        }}>
          Rate every track 1–7. The{' '}
          <strong style={{ color: 'var(--black)' }}>Banger Ratio</strong>{' '}
          reveals which albums actually deliver.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/albums" className="primary-btn">Rate an Album</a>
          <a href="/leaderboards" className="secondary-btn">See the Leaderboard</a>
        </div>
      </div>

      {/* Stats row — soft pink background section */}
      <div style={{
        marginTop: '4rem',
        background: 'linear-gradient(135deg, var(--pink-subtle) 0%, #FFE8F2 100%)',
        borderRadius: 20,
        border: '1px solid rgba(255,0,102,0.12)',
        padding: '3rem 2rem',
        display: 'flex',
        justifyContent: 'center',
        gap: 'clamp(2rem, 8vw, 6rem)',
        flexWrap: 'wrap',
        textAlign: 'center',
      }}>
        {[
          { value: counts.albums,  label: 'ALBUMS RATED' },
          { value: counts.ratings, label: 'TRACK RATINGS' },
          { value: counts.users,   label: 'COMMUNITY MEMBERS' },
        ].map(({ value, label }) => (
          <div key={label}>
            <div className="stat-number"><AnimatedCount value={value} /></div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
