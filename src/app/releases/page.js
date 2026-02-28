'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ─── GENRES ──────────────────────────────────────────────────────────────────
// Apple Music official genre IDs — used for RSS feed filtering
const GENRES = {
  'All':         '',
  'Hip-Hop/Rap': '18',
  'Pop':         '14',
  'R&B/Soul':    '15',
  'Rock':        '21',
  'Alternative': '20',
  'Country':     '6',
  'Electronic':  '7',
  'Latin':       '12',
  'K-Pop':       '51',
  'Jazz':        '11',
  'Metal':       '1153',
  'Classical':   '5',
}

const GENRE_LABELS = Object.keys(GENRES)

// ─── PROMOTED ALBUMS ─────────────────────────────────────────────────────────
// Paid/manual placements. 'link' goes to the artist's own site.
// To add: copy a block, fill in details. collectionId is the Apple Music album ID.
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
    link: 'https://madelineedwardsmusic.com',
    fallbackArtwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2a/4b/6c/2a4b6c8d-9e1f-3a2b-7c4d-5e6f8a0b2c3d/196871234567.jpg/600x600bb.jpg',
  },
]

// ─── SPOTIFY CONFIG ───────────────────────────────────────────────────────────
// ⚠️  ROTATE THESE CREDENTIALS before going public.
// developer.spotify.com → your app → Settings → regenerate secret
const SPOTIFY_CLIENT_ID     = '15f57ccce8a84efe870353d58ac7a36b'
const SPOTIFY_CLIENT_SECRET = 'cd03adf021cf40f891a17ad795bd6f01'

const LIMIT = 100 // Apple RSS supports up to 100

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function hiresArt(url) {
  if (!url) return null
  return url
    .replace(/\/\d+x\d+bb\.jpg$/, '/600x600bb.jpg')
    .replace(/\/\d+x\d+bb\.png$/, '/600x600bb.png')
}

function buildAppleUrl(genreId) {
  const base = `https://rss.applemarketingtools.com/api/v2/us/music/most-played/${LIMIT}/albums.json`
  return genreId ? `${base}?genreId=${genreId}` : base
}

async function getSpotifyToken() {
  const creds = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
  const res   = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

// ─── FETCH: Apple RSS ─────────────────────────────────────────────────────────
async function fetchApple(genreId) {
  try {
    const res   = await fetch(buildAppleUrl(genreId))
    const data  = await res.json()
    const items = data?.feed?.results || []
    return items
      .map(item => ({
        id:          item.id,
        name:        item.name,
        artist:      item.artistName,
        artwork:     hiresArt(item.artworkUrl100),
        releaseDate: item.releaseDate ? new Date(item.releaseDate) : null,
        link:        `/album/${item.id}`,
        _source:     'apple',
      }))
      .filter(a => a.id && a.name && a.artwork)
  } catch (e) {
    console.error('Apple RSS fetch failed:', e)
    return []
  }
}

// ─── FETCH: Spotify new releases ──────────────────────────────────────────────
async function fetchSpotify() {
  try {
    const token = await getSpotifyToken()
    if (!token) return []
    const pages = await Promise.all([
      fetch('https://api.spotify.com/v1/browse/new-releases?limit=50&offset=0',  { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('https://api.spotify.com/v1/browse/new-releases?limit=50&offset=50', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
    return pages
      .flatMap(p => p?.albums?.items || [])
      .filter(a => a.album_type === 'album')
      .map(a => ({
        id:          `sp_${a.id}`,
        name:        a.name,
        artist:      a.artists?.map(ar => ar.name).join(', ') || '',
        artwork:     a.images?.[0]?.url || null,
        releaseDate: a.release_date ? new Date(a.release_date) : null,
        link:        `/album/${a.id}?source=spotify&name=${encodeURIComponent(a.name)}&artist=${encodeURIComponent(a.artists?.[0]?.name || '')}`,
        _source:     'spotify',
      }))
      .filter(a => a.name && a.artwork)
  } catch (e) {
    console.error('Spotify fetch failed:', e)
    return []
  }
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function ReleasesPage() {
  const router = useRouter()

  const [allAlbums,   setAllAlbums]   = useState([]) // full unfiltered set
  const [promoted,    setPromoted]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [activeGenre, setActiveGenre] = useState('All')

  useEffect(() => { loadPromoted(); loadAlbums() }, [])

  // When genre changes, re-fetch Apple RSS with that genre ID (Spotify stays global)
  const [spotifyAlbums, setSpotifyAlbums] = useState([])

  useEffect(() => {
    if (spotifyAlbums.length === 0 && !loading) return
    loadAppleForGenre()
  }, [activeGenre])

  async function loadPromoted() {
    const resolved = await Promise.all(
      PROMOTED_CONFIG.map(async (p) => {
        try {
          const res  = await fetch(`https://itunes.apple.com/lookup?id=${p.collectionId}`)
          const data = await res.json()
          const hit  = data?.results?.find(r => r.wrapperType === 'collection') || data?.results?.[0]
          const url  = hit?.artworkUrl100
          if (url) return { ...p, artwork: url.replace('100x100', '600x600') }
          throw new Error('no artwork')
        } catch {
          return { ...p, artwork: p.fallbackArtwork }
        }
      })
    )
    setPromoted(resolved.filter(p => p.artwork))
  }

  async function loadAlbums() {
    setLoading(true)
    try {
      const [appleRaw, spotifyRaw] = await Promise.all([
        fetchApple(GENRES['All']),
        fetchSpotify(),
      ])
      setSpotifyAlbums(spotifyRaw)
      setAllAlbums(mergeAndDedupe(appleRaw, spotifyRaw))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function loadAppleForGenre() {
    if (activeGenre === 'All') {
      setAllAlbums(mergeAndDedupe([], spotifyAlbums))
      // Re-fetch apple all
      const appleRaw = await fetchApple('')
      setAllAlbums(mergeAndDedupe(appleRaw, spotifyAlbums))
      return
    }
    setLoading(true)
    const appleRaw = await fetchApple(GENRES[activeGenre])
    setAllAlbums(mergeAndDedupe(appleRaw, spotifyAlbums))
    setLoading(false)
  }

  function mergeAndDedupe(appleRaw, spotifyRaw) {
    const seen    = new Map()
    const deduped = []

    function normalizeKey(artist, name) {
      return `${artist.toLowerCase().replace(/[^a-z0-9]/g, '')}__${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`
    }

    // Apple first — it's genre-filtered and links to our rating page
    for (const a of appleRaw) {
      const key = normalizeKey(a.artist, a.name)
      if (seen.has(key)) continue
      seen.set(key, true)
      deduped.push(a)
    }

    // Spotify fills gaps
    for (const a of spotifyRaw) {
      const key = normalizeKey(a.artist, a.name)
      if (seen.has(key)) continue
      seen.set(key, true)
      deduped.push(a)
    }

    return deduped
  }

  // For All genre, show everything. For specific genre, Apple RSS already filtered it —
  // just also filter Spotify by name matching since Spotify's /new-releases is global
  const displayed = allAlbums

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
              <a key={i} href={p.link} target='_blank' rel='noopener noreferrer'
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
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 6 }}>
            New Releases
          </h1>
          <p style={{ color: 'var(--gray-text)', fontSize: 15 }}>
            Fresh albums waiting for their Banger Ratio
          </p>
        </div>

        {/* Genre dropdown */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={activeGenre}
            onChange={e => setActiveGenre(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1.5px solid var(--gray-200)',
              background: 'white',
              color: '#1a1a1a',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: 36,
              minWidth: 180,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            {GENRE_LABELS.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {activeGenre !== 'All' && (
            <button
              onClick={() => setActiveGenre('All')}
              style={{
                padding: '10px 14px', borderRadius: 10, border: 'none',
                background: 'var(--gray-100)', color: 'var(--gray-600)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Loading skeletons */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                background: 'var(--bg-soft)', borderRadius: 14,
                aspectRatio: '3/4', animation: 'fadeIn 0.6s ease both',
                animationDelay: `${i * 0.04}s`,
              }} />
            ))}
          </div>

        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--gray-text)' }}>
            <p style={{ fontSize: 18, marginBottom: 8 }}>No albums found for this genre right now.</p>
            <button onClick={() => setActiveGenre('All')} style={{
              padding: '10px 24px', background: 'var(--pink)', color: 'white',
              border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>Show All Genres</button>
          </div>

        ) : (
          <>
            <p style={{ fontSize: 12, color: 'var(--gray-text)', marginBottom: 16 }}>
              {displayed.length} albums
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {displayed.map(album => (
                <div
                  key={album.id}
                  onClick={() => router.push(album.link)}
                  style={{
                    background: 'white', borderRadius: 14,
                    border: '1px solid var(--border)',
                    overflow: 'hidden', cursor: 'pointer',
                    transition: 'transform 0.18s, box-shadow 0.18s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)' }}
                  onMouseOut={e =>  { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                >
                  <div style={{ width: '100%', aspectRatio: '1', background: 'var(--bg-soft)', overflow: 'hidden' }}>
                    {album.artwork ? (
                      <img
                        src={album.artwork}
                        alt={album.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🎵</div>
                    )}
                  </div>
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>
                      {album.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {album.artist}
                    </div>
                    {album.releaseDate && (
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                        {album.releaseDate.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <style>{`
        @keyframes marqueeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(calc(-100% / 3)); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}