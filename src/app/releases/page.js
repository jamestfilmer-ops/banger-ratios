 // FILE: src/app/releases/page.js
'use client'
import { useState, useEffect } from 'react'

const GENRES = ['All', 'Hip-Hop/Rap', 'Pop', 'R&B/Soul', 'Rock', 'Alternative', 'Country', 'Electronic', 'Latin', 'K-Pop']

const SEARCHES = [
  'new album 2026', 'new music 2026', 'album release 2026',
  'best albums 2025', 'hip hop 2026', 'pop 2026', 'r&b 2026', 'indie 2026',
]

const PROMOTED = [
  {
    name: 'Radical Optimism',
    artist: 'Dua Lipa',
    releaseDate: 'May 3, 2024',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/a0/da/6a/a0da6a1e-5b8b-8a69-e11d-dc6c4bf3f5aa/24UMGIM25986.rgb.jpg/600x600bb.jpg',
    link: 'https://www.dualipa.com',
  },
  {
    name: 'The Tortured Poets Department',
    artist: 'Taylor Swift',
    releaseDate: 'Apr 19, 2024',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fc/16/49/fc164920-00b6-9ac5-14cb-ae03d8cde1db/24UMGIM24246.rgb.jpg/600x600bb.jpg',
    link: 'https://www.taylorswift.com',
  },
  {
    name: 'GNX',
    artist: 'Kendrick Lamar',
    releaseDate: 'Nov 22, 2024',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/28/be/8b/28be8b7d-2a4c-9f4d-c4b3-6a9e5b8e7d2a/24PGEM66801.rgb.jpg/600x600bb.jpg',
    link: 'https://www.kendricklamar.com',
  },
]

// Triple for seamless loop
const MARQUEE_ITEMS = [...PROMOTED, ...PROMOTED, ...PROMOTED]

export default function ReleasesPage() {
  const [albums,      setAlbums]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [activeGenre, setActiveGenre] = useState('All')

  useEffect(() => { load() }, [])

  async function load() {
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

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
    gap: 14,
  }

  return (
    <div>

      {/* ── Scrolling promoted banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #fff0f5 0%, #ffe0ec 60%, #fff0f5 100%)',
        borderBottom: '1px solid rgba(255,0,102,0.13)',
        padding: '14px 0',
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* "FEATURED" label pinned left */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 2,
          display: 'flex', alignItems: 'center',
          paddingLeft: 16, paddingRight: 48,
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

        {/* Scrolling track — 55s for a slow, dignified scroll */}
        <div style={{
          display: 'flex',
          gap: 20,
          paddingLeft: 90,
          animation: 'marqueeScroll 55s linear infinite',
          width: 'max-content',
        }}>
          {MARQUEE_ITEMS.map((p, i) => (
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
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.97)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.78)'
              }}
            >
              {/* Album art — plain img, no wrapper that could show a checkmark */}
              <img
                src={p.artwork}
                alt=""
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
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: '#1a1a1a', whiteSpace: 'nowrap',
                  lineHeight: 1.3, marginBottom: 2,
                }}>
                  {p.name}
                </div>
                <div style={{
                  fontSize: 11, color: 'var(--pink)',
                  fontWeight: 600, whiteSpace: 'nowrap',
                  marginBottom: 3,
                }}>
                  {p.artist}
                </div>
                <div style={{
                  fontSize: 10, color: '#aaa',
                  whiteSpace: 'nowrap',
                }}>
                  {p.releaseDate}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

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
          <div style={gridStyle}>
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
          <div style={gridStyle}>
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

      {/* Marquee + shimmer animations */}
      <style>{`
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>

    </div>
  )
}