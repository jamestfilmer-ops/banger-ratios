'use client'
import { useState, useEffect } from 'react'

const GENRES = ['All', 'Hip-Hop/Rap', 'Pop', 'R&B/Soul', 'Rock', 'Alternative', 'Country', 'Electronic', 'Latin', 'K-Pop']

const SEARCHES = [
  'new album 2026', 'new music 2026', 'album release 2026',
  'best albums 2025', 'hip hop 2026', 'pop 2026', 'r&b 2026', 'indie 2026',
]

// iTunes collection IDs — confirmed from Apple Music URLs.
// We call the iTunes lookup API at runtime to get real artwork URLs.
// This is the same API the rest of the site uses, so it always works.
const PROMOTED_CONFIG = [
  {
    collectionId: 1734980417,   // Dua Lipa – Radical Optimism
    name: 'Radical Optimism',
    artist: 'Dua Lipa',
    releaseDate: 'May 3, 2024',
    link: 'https://www.dualipa.com',
  },
  {
    collectionId: 1833328839,   // Taylor Swift – The Life of a Showgirl
    name: 'The Life of a Showgirl',
    artist: 'Taylor Swift',
    releaseDate: 'Oct 3, 2025',
    link: 'https://www.taylorswift.com',
  },
  {
    collectionId: 1781270319,   // Kendrick Lamar – GNX
    name: 'GNX',
    artist: 'Kendrick Lamar',
    releaseDate: 'Nov 22, 2024',
    link: 'https://www.kendricklamar.com',
  },
]

export default function ReleasesPage() {
  const [albums,      setAlbums]      = useState([])
  const [promoted,    setPromoted]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [activeGenre, setActiveGenre] = useState('All')

  useEffect(() => {
    loadPromoted()
    loadAlbums()
  }, [])

  // Fetch real artwork for each featured album from iTunes lookup API
  async function loadPromoted() {
    const resolved = await Promise.all(
      PROMOTED_CONFIG.map(async (p) => {
        try {
          const res  = await fetch(`https://itunes.apple.com/lookup?id=${p.collectionId}&entity=album`)
          const data = await res.json()
          const hit  = data?.results?.[0]
          const artwork = hit?.artworkUrl100?.replace('100x100', '600x600') || null
          return { ...p, artwork }
        } catch {
          return { ...p, artwork: null }
        }
      })
    )
    // Only show cards where artwork loaded successfully
    setPromoted(resolved.filter(p => p.artwork))
  }

  async function loadAlbums() {
    setLoading(true)
    try {
      const results = await Promise.all(
        SEARCHES.map(term =>
          fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=25&sort=recent`)
            .then(r => r.json())
            .then(d => d.results || [])
            .catch(() => [])
        )
      )
      const seen        = new Set()
      const seenArtists = new Set()
      const all         = results.flat().sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
      const deduped     = []
      for (const a of all) {
        if (seen.has(a.collectionId)) continue
        if (seenArtists.has(a.artistName)) continue
        seen.add(a.collectionId)
        seenArtists.add(a.artistName)
        deduped.push(a)
        if (deduped.length >= 60) break
      }
      setAlbums(deduped)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const filtered = activeGenre === 'All'
    ? albums
    : albums.filter(a => a.primaryGenreName?.toLowerCase().includes(activeGenre.toLowerCase()))

  // Triple for seamless loop
  const marqueeItems = [...promoted, ...promoted, ...promoted]

  return (
    <div>

      {/* ── Promoted banner — only shows after artwork loads ── */}
      {promoted.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff0f5 0%, #ffe0ec 60%, #fff0f5 100%)',
          borderBottom: '1px solid rgba(255,0,102,0.13)',
          padding: '14px 0',
          overflow: 'hidden',
          position: 'relative',
        }}>

          {/* FEATURED label pinned left */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 2,
            display: 'flex', alignItems: 'center',
            paddingLeft: 16, paddingRight: 52,
            background: 'linear-gradient(to right, #ffe0ec 55%, transparent)',
            pointerEvents: 'none',
          }}>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: 2,
              color: 'rgba(255,0,102,0.6)', textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>Featured</span>
          </div>

          {/* Fade right edge */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 2,
            width: 80,
            background: 'linear-gradient(to left, #fff0f5, transparent)',
            pointerEvents: 'none',
          }} />

          {/* Scrolling track */}
          <div style={{
            display: 'flex',
            gap: 20,
            paddingLeft: 90,
            animation: 'marqueeScroll 55s linear infinite',
            width: 'max-content',
          }}>
            {marqueeItems.map((p, i) => (
              <a
                key={i}
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 20px 10px 10px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,0,102,0.18)',
                  background: 'rgba(255,255,255,0.78)',
                  textDecoration: 'none',
                  flexShrink: 0,
                  transition: 'background 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.97)' }}
                onMouseOut={e =>  { e.currentTarget.style.background = 'rgba(255,255,255,0.78)' }}
              >
                <img
                  src={p.artwork}
                  alt={p.name}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 6,
                    objectFit: 'cover',
                    flexShrink: 0,
                    display: 'block',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                  }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap', lineHeight: 1.3, marginBottom: 2 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 600, whiteSpace: 'nowrap', marginBottom: 3 }}>
                    {p.artist}
                  </div>
                  <div style={{ fontSize: 10, color: '#aaa', whiteSpace: 'nowrap' }}>
                    {p.releaseDate}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Page content ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px 80px' }}>

        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>New Releases</h1>
        <p style={{ fontSize: 14, color: 'var(--gray-text)', marginBottom: 20 }}>
          Fresh albums waiting for their Banger Ratio
        </p>

        {/* Genre filter tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {GENRES.map(genre => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                background: activeGenre === genre ? 'var(--pink)' : 'var(--gray-100)',
                color:      activeGenre === genre ? 'white'       : 'var(--gray-600)',
                transition: 'all 0.15s',
              }}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Skeleton loader */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 14 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{
                  aspectRatio: '1',
                  background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
                  backgroundSize: '400px 100%',
                  animation: 'shimmer 1.4s ease infinite',
                }} />
                <div style={{ padding: 10 }}>
                  <div style={{ height: 12, borderRadius: 4, background: '#f0f0f0', width: '80%', marginBottom: 6 }} />
                  <div style={{ height: 10, borderRadius: 4, background: '#f0f0f0', width: '55%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Album grid */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 14 }}>
            {filtered.length === 0 ? (
              <p style={{ color: 'var(--gray-text)', fontSize: 14, gridColumn: '1/-1' }}>
                No releases found for this genre. Try another filter.
              </p>
            ) : filtered.map(a => (
              <a
                key={a.collectionId}
                href={`/album/${a.collectionId}`}
                style={{
                  borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)',
                  background: 'white', display: 'block', transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)' }}
                onMouseOut={e =>  { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
              >
                <img
                  src={a.artworkUrl100?.replace('100x100', '300x300')}
                  alt=""
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ padding: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                    {a.collectionName}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--gray-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                    {a.artistName}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--gray-text)' }}>
                    {new Date(a.releaseDate).toLocaleDateString()}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}

      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
      `}</style>

    </div>
  )
}