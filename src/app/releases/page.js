'use client'
import { useState, useEffect } from 'react'

const GENRES = ['All', 'Hip-Hop/Rap', 'Pop', 'R&B/Soul', 'Rock', 'Alternative', 'Country', 'Electronic', 'Latin', 'K-Pop']

// iTunes genre IDs — more reliable than text matching
const GENRE_IDS = {
  'Hip-Hop/Rap': [18],
  'Pop':         [14],
  'R&B/Soul':    [15],
  'Rock':        [21],
  'Alternative': [20],
  'Country':     [6],
  'Electronic':  [7],
  'Latin':       [12],
  'K-Pop':       [51],
}

const SEARCHES = [
  'new album 2025', 'new album 2026', 'best albums 2025',
  'hip hop 2025', 'pop 2025', 'r&b 2025', 'indie 2025',
  'country 2025', 'rock 2025', 'alternative 2025',
  'new music 2026', 'rap 2025',
]

// Featured banner artists. collectionId = iTunes album ID.
// Artwork fetched from iTunes API at runtime — always real.
const PROMOTED_CONFIG = [
  {
    collectionId: 1734980417,
    name: 'Radical Optimism',
    artist: 'Dua Lipa',
    releaseDate: 'May 3, 2024',
    link: 'https://music.apple.com/us/album/radical-optimism/1734980417',
  },
  {
    collectionId: 1833328839,
    name: 'The Life of a Showgirl',
    artist: 'Taylor Swift',
    releaseDate: 'Oct 3, 2025',
    link: 'https://music.apple.com/us/album/the-life-of-a-showgirl/1833328839',
  },
  {
    collectionId: 1781270319,
    name: 'GNX',
    artist: 'Kendrick Lamar',
    releaseDate: 'Nov 22, 2024',
    link: 'https://music.apple.com/us/album/gnx/1781270319',
  },
  {
    collectionId: 1821337734,   // Madeline Edwards - FRUIT (Jul 11, 2025)
    name: 'FRUIT',
    artist: 'Madeline Edwards',
    releaseDate: 'Jul 11, 2025',
    link: 'https://music.apple.com/us/album/fruit/1821337734',
  },
]

// Only show albums from the last 18 months - this is the date fix
const CUTOFF_MS   = 18 * 30 * 24 * 60 * 60 * 1000
const CUTOFF_DATE = new Date(Date.now() - CUTOFF_MS)

export default function ReleasesPage() {
  const [albums,      setAlbums]      = useState([])
  const [promoted,    setPromoted]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [activeGenre, setActiveGenre] = useState('All')

  useEffect(() => {
    loadPromoted()
    loadAlbums()
  }, [])

  async function loadPromoted() {
    const resolved = await Promise.all(
      PROMOTED_CONFIG.map(async (p) => {
        try {
          const res     = await fetch(`https://itunes.apple.com/lookup?id=${p.collectionId}&entity=album`)
          const data    = await res.json()
          const hit     = data?.results?.[0]
          const artwork = hit?.artworkUrl100?.replace('100x100', '600x600') || null
          return { ...p, artwork }
        } catch {
          return { ...p, artwork: null }
        }
      })
    )
    setPromoted(resolved.filter(p => p.artwork))
  }

  async function loadAlbums() {
    setLoading(true)
    try {
      const results = await Promise.all(
        SEARCHES.map(term =>
          fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=30&sort=recent`)
            .then(r => r.json())
            .then(d => d.results || [])
            .catch(() => [])
        )
      )
      const seen        = new Set()
      const seenArtists = new Set()
      const all = results
        .flat()
        // KEY DATE FIX: only albums from last 18 months
        .filter(a => {
          if (!a.releaseDate) return false
          return new Date(a.releaseDate) >= CUTOFF_DATE
        })
        .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
      const deduped = []
      for (const a of all) {
        if (seen.has(a.collectionId)) continue
        if (seenArtists.has(a.artistName)) continue
        seen.add(a.collectionId)
        seenArtists.add(a.artistName)
        deduped.push(a)
        if (deduped.length >= 80) break
      }
      setAlbums(deduped)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  // Genre filter: use iTunes genre ID numbers for accuracy
  const filtered = activeGenre === 'All'
    ? albums
    : albums.filter(a => {
        const ids = GENRE_IDS[activeGenre] || []
        if (ids.length > 0 && a.primaryGenreId) {
          return ids.includes(a.primaryGenreId)
        }
        return a.primaryGenreName?.toLowerCase().includes(activeGenre.toLowerCase().split('/')[0])
      })

  const marqueeItems = [...promoted, ...promoted, ...promoted]

  return (
    <div>

      {/* Promoted banner */}
      {promoted.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff0f5 0%, #ffe0ec 60%, #fff0f5 100%)',
          borderBottom: '1px solid rgba(255,0,102,0.13)',
          padding: '14px 0',
          overflow: 'hidden',
          position: 'relative',
        }}>

          {/* FEATURED label */}
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
            width: 60,
            background: 'linear-gradient(to left, #fff0f5, transparent)',
            pointerEvents: 'none',
          }} />

          {/* Scrolling track */}
          <div style={{
            display: 'flex',
            gap: 16,
            paddingLeft: 90,
            animation: 'marqueeScroll 65s linear infinite',
            width: 'max-content',
          }}>
            {marqueeItems.map((p, i) => (
              <a
                key={i}
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 16px 8px 8px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,0,102,0.18)',
                  background: 'rgba(255,255,255,0.78)',
                  textDecoration: 'none', flexShrink: 0, transition: 'background 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.97)' }}
                onMouseOut={e =>  { e.currentTarget.style.background = 'rgba(255,255,255,0.78)' }}
              >
                <img src={p.artwork} alt={p.name}
                  style={{ width: 52, height: 52, borderRadius: 6, objectFit: 'cover',
                    flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a',
                    whiteSpace: 'nowrap', lineHeight: 1.3, marginBottom: 2 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 600,
                    whiteSpace: 'nowrap', marginBottom: 2 }}>
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

      {/* Page content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 16px 100px' }}>

        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>New Releases</h1>
        <p style={{ fontSize: 14, color: 'var(--gray-text)', marginBottom: 20 }}>
          Fresh albums waiting for their Banger Ratio
        </p>

        {/* Genre filter — horizontal scroll on mobile */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'nowrap',
          overflowX: 'auto', marginBottom: 24, paddingBottom: 4,
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none', scrollbarWidth: 'none',
        }}>
          {GENRES.map(genre => (
            <button key={genre} onClick={() => setActiveGenre(genre)} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', border: 'none', fontFamily: 'inherit', flexShrink: 0,
              background: activeGenre === genre ? 'var(--pink)' : 'var(--gray-100)',
              color:      activeGenre === genre ? 'white'       : 'var(--gray-600)',
              transition: 'all 0.15s',
            }}>
              {genre}
            </button>
          ))}
        </div>

        {/* Skeleton loader */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 12 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{
                  aspectRatio: '1',
                  background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
                  backgroundSize: '400px 100%',
                  animation: 'shimmer 1.4s ease infinite',
                }} />
                <div style={{ padding: 10 }}>
                  <div style={{ height: 11, borderRadius: 4, background: '#f0f0f0', width: '80%', marginBottom: 6 }} />
                  <div style={{ height: 9,  borderRadius: 4, background: '#f0f0f0', width: '55%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Album grid */}
        {!loading && (
          <>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--gray-text)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>&#127925;</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>
                  No recent releases for this genre
                </p>
                <p style={{ fontSize: 13 }}>Try a different filter, or check back soon.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 12 }}>
                {filtered.map(a => (
                  <a key={a.collectionId} href={`/album/${a.collectionId}`}
                    style={{
                      borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)',
                      background: 'white', display: 'block', transition: 'all 0.15s',
                      textDecoration: 'none',
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)' }}
                    onMouseOut={e =>  { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                  >
                    <img src={a.artworkUrl100?.replace('100x100', '300x300')} alt=""
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: '8px 10px 10px' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', marginBottom: 2, color: '#1a1a1a' }}>
                        {a.collectionName}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--gray-text)', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
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
          </>
        )}

      </div>

      <style>{`
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>

    </div>
  )
}
