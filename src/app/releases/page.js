'use client'
import { useState, useEffect } from 'react'

const GENRES = ['All', 'Hip-Hop/Rap', 'Pop', 'R&B/Soul', 'Rock', 'Alternative', 'Country', 'Electronic', 'Latin', 'K-Pop', 'Jazz', 'Metal', 'Classical']

// ─── PROMOTED ALBUMS ────────────────────────────────────────────────────────
// Paid/manual placements. 'link' goes to the artist's own site — NOT Apple Music.
// To add a new promoted artist: copy one block, fill in the details, done.
const PROMOTED_CONFIG = [
  {
    collectionId: 1734980417,
    name: 'Radical Optimism',
    artist: 'Dua Lipa',
    releaseDate: 'May 3, 2024',
    link: 'https://dualipa.com',
    fallbackArtwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/09/5c/2b/095c2b4e-3b5e-7e2e-0f33-e9a0ee8e4e4a/24UMGIM50410.rgb.jpg/600x600bb.jpg',
  },
  {
    collectionId: 1781270319,
    name: 'GNX',
    artist: 'Kendrick Lamar',
    releaseDate: 'Nov 22, 2024',
    link: 'https://oklama.com',
    fallbackArtwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/1d/3e/8f/1d3e8f4b-5c2a-9e7f-3b1a-8e4f2d6c9a0b/24UMGIM93351.rgb.jpg/600x600bb.jpg',
  },
  {
    collectionId: 1821337734,
    name: 'FRUIT',
    artist: 'Madeline Edwards',
    releaseDate: 'Jul 11, 2025',
    link: 'https://madelineedwards.com',
    fallbackArtwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2a/4b/6c/2a4b6c8d-9e1f-3a2b-7c4d-5e6f8a0b2c3d/196871234567.jpg/600x600bb.jpg',
  },
]

// ─── iTUNES SEARCH TERMS ────────────────────────────────────────────────────
const ITUNES_SEARCHES = [
  { term: 'hip hop rap album 2025',       genre: 'Hip-Hop/Rap' },
  { term: 'hip hop album 2026',           genre: 'Hip-Hop/Rap' },
  { term: 'pop album 2025',               genre: 'Pop' },
  { term: 'pop music album 2026',         genre: 'Pop' },
  { term: 'r&b soul album 2025',          genre: 'R&B/Soul' },
  { term: 'r&b album 2026',              genre: 'R&B/Soul' },
  { term: 'rock album 2025',              genre: 'Rock' },
  { term: 'rock music album 2026',        genre: 'Rock' },
  { term: 'indie alternative album 2025', genre: 'Alternative' },
  { term: 'alternative album 2026',       genre: 'Alternative' },
  { term: 'country album 2025',           genre: 'Country' },
  { term: 'country music 2026',           genre: 'Country' },
  { term: 'electronic dance album 2025',  genre: 'Electronic' },
  { term: 'electronic music 2026',        genre: 'Electronic' },
  { term: 'latin reggaeton album 2025',   genre: 'Latin' },
  { term: 'latin pop album 2025',         genre: 'Latin' },
  { term: 'k-pop album 2025',             genre: 'K-Pop' },
  { term: 'kpop album 2026',              genre: 'K-Pop' },
  { term: 'jazz album 2025',              genre: 'Jazz' },
  { term: 'metal album 2025',             genre: 'Metal' },
  { term: 'classical album 2025',         genre: 'Classical' },
  { term: 'new album 2025',               genre: null },
  { term: 'new album 2026',               genre: null },
  { term: 'album release 2025',           genre: null },
  { term: 'new music 2026',               genre: null },
]

// ─── LAST.FM TAGS → genre labels ────────────────────────────────────────────
const LASTFM_TAGS = [
  { tag: 'hip-hop',      genre: 'Hip-Hop/Rap' },
  { tag: 'rap',          genre: 'Hip-Hop/Rap' },
  { tag: 'pop',          genre: 'Pop' },
  { tag: 'rnb',          genre: 'R&B/Soul' },
  { tag: 'soul',         genre: 'R&B/Soul' },
  { tag: 'rock',         genre: 'Rock' },
  { tag: 'indie',        genre: 'Alternative' },
  { tag: 'alternative',  genre: 'Alternative' },
  { tag: 'country',      genre: 'Country' },
  { tag: 'electronic',   genre: 'Electronic' },
  { tag: 'dance',        genre: 'Electronic' },
  { tag: 'latin',        genre: 'Latin' },
  { tag: 'k-pop',        genre: 'K-Pop' },
  { tag: 'jazz',         genre: 'Jazz' },
  { tag: 'metal',        genre: 'Metal' },
  { tag: 'classical',    genre: 'Classical' },
]

const LASTFM_KEY  = 'f6de418e7c3b44cc5f80b1a5e11e5823'
const CUTOFF_MS   = 18 * 30 * 24 * 60 * 60 * 1000
const CUTOFF_DATE = new Date(Date.now() - CUTOFF_MS)
// Last.fm placeholder image hash — filter these out
const LASTFM_PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f'

const JUNK_PATTERNS = [
  /- single$/i, /- ep$/i, /\(single\)/i, /^\d{4} - /i, /^single$/i,
]

function isJunk(a) {
  const title  = a.name || ''
  const type   = a.collectionType || ''
  const tracks = a.trackCount || 0
  if (type === 'Single') return true
  if (tracks > 0 && tracks <= 2) return true
  if (JUNK_PATTERNS.some(p => p.test(title))) return true
  return false
}

// ─── FETCH helpers ───────────────────────────────────────────────────────────
async function fetchItunes() {
  const results = await Promise.all(
    ITUNES_SEARCHES.map(({ term, genre }) =>
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=25&sort=recent`)
        .then(r => r.json())
        .then(d => (d.results || []).map(a => ({
          id:            String(a.collectionId),
          name:          a.collectionName,
          artist:        a.artistName,
          artwork:       a.artworkUrl100?.replace('100x100', '300x300') || null,
          releaseDate:   a.releaseDate ? new Date(a.releaseDate) : null,
          link:          `/album/${a.collectionId}`,
          trackCount:    a.trackCount,
          collectionType: a.collectionType,
          _sourceGenre:  genre,
          _primaryGenre: a.primaryGenreName || '',
          _source:       'itunes',
        })))
        .catch(() => [])
    )
  )
  return results.flat()
}

async function fetchLastfm() {
  const results = await Promise.all(
    LASTFM_TAGS.map(({ tag, genre }) =>
      fetch(`https://ws.audioscrobbler.com/2.0/?method=tag.gettopalbums&tag=${encodeURIComponent(tag)}&api_key=${LASTFM_KEY}&format=json&limit=30`)
        .then(r => r.json())
        .then(d => (d?.albums?.album || []).map(a => {
          const artwork = a.image?.find(i => i.size === 'extralarge')?.['#text']
            || a.image?.slice(-1)[0]?.['#text']
            || null
          return {
            id:           `lfm_${a.mbid || (a.name + '_' + a.artist?.name)}`,
            name:         a.name,
            artist:       a.artist?.name || '',
            artwork:      artwork && !artwork.includes(LASTFM_PLACEHOLDER) ? artwork : null,
            releaseDate:  null,
            link:         a.url || '#',
            _sourceGenre: genre,
            _primaryGenre: '',
            _source:      'lastfm',
          }
        }))
        .catch(() => [])
    )
  )
  return results.flat()
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function ReleasesPage() {
  const [albums,      setAlbums]      = useState([])
  const [promoted,    setPromoted]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [activeGenre, setActiveGenre] = useState('All')

  useEffect(() => { loadPromoted(); loadAlbums() }, [])

  async function loadPromoted() {
    const resolved = await Promise.all(
      PROMOTED_CONFIG.map(async (p) => {
        try {
          const res  = await fetch(`https://itunes.apple.com/lookup?id=${p.collectionId}&entity=album`)
          const data = await res.json()
          const hit  = data?.results?.[0]
          const artwork = hit?.artworkUrl100?.replace('100x100', '600x600') || p.fallbackArtwork
          return { ...p, artwork }
        } catch {
          return { ...p, artwork: p.fallbackArtwork }
        }
      })
    )
    setPromoted(resolved)
  }

  async function loadAlbums() {
    setLoading(true)
    try {
      const [itunesRaw, lastfmRaw] = await Promise.all([fetchItunes(), fetchLastfm()])

      // Build genre sets per album ID
      const genreMap = new Map()
      for (const a of [...itunesRaw, ...lastfmRaw]) {
        if (!genreMap.has(a.id)) genreMap.set(a.id, new Set())
        if (a._sourceGenre) genreMap.get(a.id).add(a._sourceGenre)
        if (a._primaryGenre) {
          for (const g of GENRES) {
            if (g === 'All') continue
            if (a._primaryGenre.toLowerCase().includes(g.toLowerCase().split('/')[0])) {
              genreMap.get(a.id).add(g)
            }
          }
        }
      }

      // Filter
      const clean = [...itunesRaw, ...lastfmRaw].filter(a => {
        if (isJunk(a)) return false
        if (!a.name || !a.artist || !a.artwork) return false
        if (a._source === 'itunes' && a.releaseDate && a.releaseDate < CUTOFF_DATE) return false
        return true
      })

      // Deduplicate — iTunes first (links to rating page), then Last.fm to fill gaps
      const seenIds     = new Set()
      const seenArtists = new Set()
      const deduped     = []

      const itunesSorted = clean
        .filter(a => a._source === 'itunes')
        .sort((a, b) => (b.releaseDate || 0) - (a.releaseDate || 0))

      for (const a of itunesSorted) {
        if (seenIds.has(a.id) || seenArtists.has(a.artist.toLowerCase())) continue
        seenIds.add(a.id)
        seenArtists.add(a.artist.toLowerCase())
        deduped.push({ ...a, _genres: genreMap.get(a.id) || new Set() })
        if (deduped.length >= 150) break
      }

      for (const a of clean.filter(a => a._source === 'lastfm')) {
        if (seenIds.has(a.id) || seenArtists.has(a.artist.toLowerCase())) continue
        seenIds.add(a.id)
        seenArtists.add(a.artist.toLowerCase())
        deduped.push({ ...a, _genres: genreMap.get(a.id) || new Set() })
        if (deduped.length >= 280) break
      }

      setAlbums(deduped)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const filtered = activeGenre === 'All'
    ? albums
    : albums.filter(a => a._genres?.has(activeGenre))

  const marqueeItems = [...promoted, ...promoted, ...promoted]

  return (
    <div>

      {/* ── PROMOTED STRIP ── */}
      {promoted.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff0f5 0%, #ffe0ec 60%, #fff0f5 100%)',
          borderBottom: '1px solid rgba(255,0,102,0.13)',
          padding: '14px 0', overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 2,
            display: 'flex', alignItems: 'center', paddingLeft: 16, paddingRight: 52,
            background: 'linear-gradient(to right, #ffe0ec 55%, transparent)',
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: 'rgba(255,0,102,0.6)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Featured
            </span>
          </div>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 2, width: 60, background: 'linear-gradient(to left, #fff0f5, transparent)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', gap: 16, paddingLeft: 90, animation: 'marqueeScroll 65s linear infinite', width: 'max-content' }}>
            {marqueeItems.map((p, i) => (
              <a
                key={i}
                href={p.link}
                target='_blank'
                rel='noopener noreferrer'
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 16px 8px 8px', borderRadius: 10,
                  border: '1px solid rgba(255,0,102,0.18)',
                  background: 'rgba(255,255,255,0.78)',
                  textDecoration: 'none', flexShrink: 0, transition: 'background 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.97)' }}
                onMouseOut={e =>  { e.currentTarget.style.background = 'rgba(255,255,255,0.78)' }}
              >
                {p.artwork && (
                  <img src={p.artwork} alt={p.name} style={{ width: 52, height: 52, borderRadius: 6, objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }} />
                )}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap', lineHeight: 1.3, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 600, whiteSpace: 'nowrap', marginBottom: 2 }}>{p.artist}</div>
                  <div style={{ fontSize: 10, color: '#aaa', whiteSpace: 'nowrap' }}>{p.releaseDate}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 16px 100px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>New Releases</h1>
        <p style={{ fontSize: 14, color: 'var(--gray-text)', marginBottom: 20 }}>
          Fresh albums across every genre — rate them and build the leaderboard.
        </p>

        {/* Genre filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap', overflowX: 'auto', marginBottom: 24, paddingBottom: 4, WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {GENRES.map(genre => (
            <button key={genre} onClick={() => setActiveGenre(genre)} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', border: 'none', fontFamily: 'inherit', flexShrink: 0,
              background: activeGenre === genre ? 'var(--pink)' : 'var(--gray-100)',
              color: activeGenre === genre ? 'white' : 'var(--gray-600)',
              transition: 'all 0.15s',
            }}>{genre}</button>
          ))}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 12 }}>
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ aspectRatio: '1', background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.4s ease infinite' }} />
                <div style={{ padding: 10 }}>
                  <div style={{ height: 11, borderRadius: 4, background: '#f0f0f0', width: '80%', marginBottom: 6 }} />
                  <div style={{ height: 9, borderRadius: 4, background: '#f0f0f0', width: '55%' }} />
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
                <div style={{ fontSize: 36, marginBottom: 12 }}>🎵</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>No releases found for this genre</p>
                <p style={{ fontSize: 13 }}>Try a different filter, or check back soon.</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 12, color: 'var(--gray-text)', marginBottom: 16 }}>{filtered.length} albums</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 12 }}>
                  {filtered.map(a => (
                    <a
                      key={a.id}
                      href={a.link}
                      target={a._source === 'lastfm' ? '_blank' : undefined}
                      rel={a._source === 'lastfm' ? 'noopener noreferrer' : undefined}
                      style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'white', display: 'block', transition: 'all 0.15s', textDecoration: 'none' }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)' }}
                      onMouseOut={e =>  { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                    >
                      <img src={a.artwork} alt='' style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: '8px 10px 10px' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2, color: '#1a1a1a' }}>{a.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--gray-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{a.artist}</p>
                        {a.releaseDate && (
                          <p style={{ fontSize: 10, color: 'var(--gray-text)' }}>{a.releaseDate.toLocaleDateString()}</p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes marqueeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(calc(-100% / 3)); } }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}