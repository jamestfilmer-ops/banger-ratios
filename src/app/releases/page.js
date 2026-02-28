// FILE: src/app/releases/page.js
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const GENRES = ['All', 'Hip-Hop/Rap', 'Pop', 'R&B/Soul', 'Rock', 'Alternative', 'Country', 'Electronic', 'Latin', 'K-Pop']

const SEARCHES = [
  'new album 2026', 'new music 2026', 'album release 2026',
  'best albums 2025', 'hip hop 2026', 'pop 2026', 'r&b 2026', 'indie 2026',
]

export default function ReleasesPage() {
  const router = useRouter()
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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>

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
  )
}