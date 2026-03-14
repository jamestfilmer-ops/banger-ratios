'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const HOW_IT_WORKS = [
  { step: '01', title: 'Search any album', body: 'Type any album name or artist. Every record ever released is searchable via iTunes — 100 million tracks and counting.' },
  { step: '02', title: 'Rate every track 1-7', body: 'Not just a thumbs up. A real score for every song. 5 and above counts as a banger. Below that? Filler.' },
  { step: '03', title: 'The Banger Ratio is calculated', body: 'Bangers divided by total tracks times 100. Simple. Communal. Impossible to argue with once you have seen your favorite album number.' },
]

function useCountUp(target, duration) {
  const [count, setCount] = useState(0)
  const startedRef = useRef(false)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !startedRef.current) {
        startedRef.current = true
        const start = performance.now()
        const tick = (now) => {
          const elapsed = now - start
          const progress = Math.min(elapsed / (duration || 1800), 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.round(eased * target))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])
  return [count, ref]
}

function StatCounter({ value, label }) {
  const [count, ref] = useCountUp(value)
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div className="stat-number">{count.toLocaleString()}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function artFix(url) {
  if (!url) return null
  return url.replace('100x100bb', '300x300bb').replace('600x600bb', '300x300bb').replace('100x100', '300x300')
}

function ratioColor(r) {
  if (r >= 90) return '#00B84D'
  if (r >= 75) return '#FF9500'
  return 'var(--pink)'
}

export default function HomePage() {
  const [stats, setStats] = useState({ albums: 0, ratings: 0, members: 0 })
  const [topAlbums, setTopAlbums] = useState([])

  useEffect(() => {
    supabase.from('albums').select('id', { count: 'exact', head: true }).then(r => {
      supabase.from('ratings').select('id', { count: 'exact', head: true }).then(r2 => {
        supabase.from('profiles').select('id', { count: 'exact', head: true }).then(r3 => {
          setStats({ albums: r.count || 0, ratings: r2.count || 0, members: r3.count || 0 })
        })
      })
    })
    supabase.from('albums').select('id, name, artist_name, artwork_url, banger_ratio, itunes_collection_id')
      .gt('total_ratings', 0)
      .order('banger_ratio', { ascending: false })
      .limit(14)
      .then(({ data }) => setTopAlbums(data || []))
  }, [])

  return (
    <main style={{ overflowX: 'hidden' }}>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '5rem 2rem 3rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,0,102,0.08)', border: '1px solid rgba(255,0,102,0.2)',
          borderRadius: 20, padding: '5px 16px',
          fontSize: 12, fontWeight: 600, color: 'var(--pink)',
          letterSpacing: 1, textTransform: 'uppercase', marginBottom: '1.5rem',
        }}>Community Music Ratings</div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 700,
          lineHeight: 1.1, marginBottom: '1.25rem', letterSpacing: '-0.02em',
        }}>
          Streams measure popularity.<br />
          <span style={{ color: 'var(--pink)' }}>We measure quality.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: 'var(--gray-text)',
          maxWidth: 540, margin: '0 auto 2.5rem', lineHeight: 1.65,
        }}>
          Rate every track 1-7. Any track averaging 5+ is a banger.
          The Banger Ratio settles the debate — no algorithm, no label deals. Just the community.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/albums" className="primary-btn" style={{ fontSize: '1rem' }}>Rate an Album</Link>
          <Link href="/leaderboards" className="secondary-btn" style={{ fontSize: '1rem' }}>See the Leaderboard</Link>
        </div>
      </section>

      {/* SCROLLING ALBUM STRIP */}
      {topAlbums.length > 0 && (
        <div style={{ overflow: 'hidden', padding: '1.5rem 0', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', gap: 16, animation: 'scroll-albums 45s linear infinite', width: 'max-content' }}>
            {[...topAlbums, ...topAlbums].map((album, i) => (
              <Link key={i} href={'/album/' + album.itunes_collection_id} style={{
                flexShrink: 0, width: 140, background: 'white',
                borderRadius: 14, border: '1px solid var(--border)',
                overflow: 'hidden', textDecoration: 'none',
                transition: 'transform 0.2s',
              }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={e => e.currentTarget.style.transform = ''}
              >
                <div style={{ width: 140, height: 140, background: 'var(--bg-soft)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: 'var(--gray-text)' }}>
                  {artFix(album.artwork_url)
                    ? <img src={artFix(album.artwork_url)} alt={album.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                    : '♪'}
                </div>
                <div style={{ padding: '0.6rem 0.7rem' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.artist_name}</div>
                  {album.banger_ratio != null && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: ratioColor(album.banger_ratio), marginTop: 3 }}>{album.banger_ratio}%</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* STATS */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'white', padding: '3rem 2rem' }}>
        <div className="stats" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
          <StatCounter value={stats.albums} label="Albums Rated" />
          <StatCounter value={stats.ratings} label="Track Ratings" />
          <StatCounter value={stats.members} label="Community Members" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: '0.5rem' }}>How it works</h2>
          <p style={{ color: 'var(--gray-text)', fontSize: '1.05rem' }}>Three steps. Infinite arguments settled.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
          {HOW_IT_WORKS.map(({ step, title, body }) => (
            <div key={step} style={{
              background: 'white', border: '1px solid var(--border)',
              borderRadius: 20, padding: '2rem', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -10, right: 16,
                fontSize: '5rem', fontWeight: 800, color: 'rgba(255,0,102,0.05)',
                lineHeight: 1, userSelect: 'none',
              }}>{step}</div>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,0,102,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pink)' }}>{step}</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.6rem' }}>{title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-text)', lineHeight: 1.65, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LEADERBOARD PREVIEW */}
      {topAlbums.length > 0 && (
        <section style={{ background: 'white', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '4rem 2rem' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.3rem' }}>Community leaderboard</h2>
                <p style={{ color: 'var(--gray-text)', fontSize: '0.9rem', margin: 0 }}>Real ratings from real listeners. No algorithm.</p>
              </div>
              <Link href="/leaderboards" style={{
                padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: '1.5px solid var(--border)', color: 'var(--black)', textDecoration: 'none',
              }}>See full leaderboard</Link>
            </div>
            {topAlbums.slice(0, 5).map((album, i) => (
              <Link key={album.id} href={'/album/' + album.itunes_collection_id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '12px 16px', borderRadius: 14,
                background: i === 0 ? 'rgba(255,0,102,0.03)' : 'transparent',
                border: '1px solid ' + (i === 0 ? 'rgba(255,0,102,0.12)' : 'var(--border)'),
                marginBottom: 8, textDecoration: 'none', color: 'inherit',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-text)', width: 24, flexShrink: 0, textAlign: 'center' }}>
                  {i === 0 ? '🏆' : i + 1}
                </span>
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-soft)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {artFix(album.artwork_url)
                    ? <img src={artFix(album.artwork_url)} alt={album.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                    : '♪'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>{album.artist_name}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: ratioColor(album.banger_ratio) }}>{album.banger_ratio}%</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>banger ratio</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* BOTTOM CTA */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '5rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: '1rem' }}>Your opinion matters here.</h2>
        <p style={{ color: 'var(--gray-text)', fontSize: '1.05rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          No paid placements. No record label influence. No algorithm deciding what is good.
          Just the community — rating what they actually hear.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth" className="primary-btn" style={{ fontSize: '1rem' }}>Join the Community</Link>
          <Link href="/about" className="secondary-btn" style={{ fontSize: '1rem' }}>How Banger Ratio Works</Link>
        </div>
      </section>

      <style>{`
        @keyframes scroll-albums {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

    </main>
  )
}
