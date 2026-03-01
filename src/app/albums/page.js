'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// These are shown as starter albums if no community ratings exist yet
const SEED_ALBUMS = [
  { itunes_id: 1440768268, title: 'To Pimp a Butterfly',   artist: 'Kendrick Lamar' },
  { itunes_id: 617154241,  title: 'good kid, m.A.A.d city', artist: 'Kendrick Lamar' },
  { itunes_id: 1122185081, title: 'DAMN.',                  artist: 'Kendrick Lamar' },
  { itunes_id: 1146195536, title: 'Blonde',                 artist: 'Frank Ocean' },
  { itunes_id: 1440831453, title: 'Flower Boy',             artist: 'Tyler, the Creator' },
  { itunes_id: 1490488656, title: 'IGOR',                   artist: 'Tyler, the Creator' },
  { itunes_id: 1527285389, title: 'SOS',                    artist: 'SZA' },
  { itunes_id: 1440935467, title: 'Ctrl',                   artist: 'SZA' },
  { itunes_id: 1558475672, title: 'Punisher',               artist: 'Phoebe Bridgers' },
  { itunes_id: 1549484521, title: 'Happier Than Ever',      artist: 'Billie Eilish' },
  { itunes_id: 1440765827, title: 'channel ORANGE',         artist: 'Frank Ocean' },
  { itunes_id: 1252085583, title: 'Lemonade',               artist: 'Beyoncé' },
]

export default function AlbumsPage() {
  const router = useRouter()

  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState([])
  const [dbAlbums, setDbAlbums]   = useState([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading]     = useState(true)

  // Load community-rated albums from the database on page load
  useEffect(() => {
    supabase
      .from('albums')
      .select('*')
      .order('banger_ratio', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        setDbAlbums(data || [])
        setLoading(false)
      })
  }, [])

  // Search iTunes when user submits the form
  async function search(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    try {
      const res  = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=20`
      )
      const data = await res.json()
      setResults(data.results || [])
    } catch {
      setResults([])
    }
    setSearching(false)
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--black)', margin: '0 0 8px' }}>
          Rate an Album
        </h1>
        <p style={{ color: 'var(--gray-600)', fontSize: 15, margin: 0 }}>
          Search any album and rate it track by track. See how it stacks up.
        </p>
      </div>

      {/* ── Search bar ── */}
      <form
        onSubmit={search}
        style={{
          display: 'flex', maxWidth: 540, marginBottom: 48,
          borderRadius: 12, border: '2px solid var(--gray-200)', overflow: 'hidden',
        }}
      >
        <input
          type="text"
          placeholder="Search any album or artist..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            flex: 1, padding: '14px 18px', border: 'none', fontSize: 15,
            outline: 'none', background: 'white', color: 'var(--black)',
          }}
        />
        <button
          type="submit"
          disabled={searching}
          style={{
            padding: '14px 24px', background: 'var(--pink)', border: 'none',
            color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            opacity: searching ? 0.7 : 1,
          }}
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* ── iTunes search results ── */}
      {results.length > 0 && (
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--black)', marginBottom: 20 }}>
            Search Results
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
            gap: '1.25rem',
          }}>
            {results.map(album => (
              <div
                key={album.collectionId}
                onClick={() => router.push(`/album/${album.collectionId}`)}
                style={{
                  cursor: 'pointer', borderRadius: 12,
                  border: '1px solid var(--gray-200)',
                  padding: 12, background: 'white',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                onMouseOut={e  => e.currentTarget.style.boxShadow = 'none'}
              >
                {album.artworkUrl100 ? (
                  <img
                    src={album.artworkUrl100.replace('100x100', '400x400')}
                    alt={album.collectionName}
                    style={{ width: '100%', borderRadius: 8, marginBottom: 10, display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', aspectRatio: '1', background: 'var(--gray-100)',
                    borderRadius: 8, marginBottom: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                  }}>🎵</div>
                )}
                <p style={{
                  fontWeight: 700, fontSize: 13, marginBottom: 4, color: 'var(--black)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {album.collectionName}
                </p>
                <p style={{
                  color: 'var(--gray-600)', fontSize: 12,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {album.artistName}
                </p>
                <p style={{ color: 'var(--pink)', fontSize: 12, marginTop: 8, fontWeight: 600 }}>
                  Rate it →
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Community rated albums (or seed albums if none yet) ── */}
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--black)', marginBottom: 20 }}>
          {dbAlbums.length > 0 ? 'Community Rated' : 'Popular Albums to Rate'}
        </h2>

        {loading ? (
          <p style={{ color: 'var(--gray-600)' }}>Loading...</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
            gap: '1.25rem',
          }}>

            {/* Show real DB albums if they exist */}
            {dbAlbums.length > 0 ? dbAlbums.map(album => (
              <div
                key={album.id}
                onClick={() => router.push(`/album/${album.itunes_collection_id || album.id}`)}
                style={{
                  cursor: 'pointer', borderRadius: 12,
                  border: '1px solid var(--gray-200)',
                  padding: 12, background: 'white',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                onMouseOut={e  => e.currentTarget.style.boxShadow = 'none'}
              >
                {album.artwork_url ? (
                  <img
                    src={album.artwork_url}
                    alt={album.name}
                    style={{ width: '100%', borderRadius: 8, marginBottom: 10, display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', aspectRatio: '1', background: 'var(--gray-100)',
                    borderRadius: 8, marginBottom: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                  }}>🎵</div>
                )}
                <p style={{
                  fontWeight: 700, fontSize: 13, marginBottom: 4, color: 'var(--black)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {album.name}
                </p>
                <p style={{
                  color: 'var(--gray-600)', fontSize: 12, marginBottom: 6,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {album.artist_name}
                </p>
                {album.banger_ratio != null && (
                  <p style={{ color: 'var(--pink)', fontWeight: 800, fontSize: 14 }}>
                    {album.banger_ratio}%
                    <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--gray-600)', marginLeft: 4 }}>
                      banger ratio
                    </span>
                  </p>
                )}
              </div>

            )) : SEED_ALBUMS.map(album => (
              /* Show seed albums if the DB is empty */
              <div
                key={album.itunes_id}
                onClick={() => router.push(`/album/${album.itunes_id}`)}
                style={{
                  cursor: 'pointer', borderRadius: 12,
                  border: '1px solid var(--gray-200)',
                  padding: 12, background: 'white',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                onMouseOut={e  => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{
                  width: '100%', aspectRatio: '1', background: 'var(--gray-100)',
                  borderRadius: 8, marginBottom: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                }}>🎵</div>
                <p style={{
                  fontWeight: 700, fontSize: 13, marginBottom: 4, color: 'var(--black)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {album.title}
                </p>
                <p style={{ color: 'var(--gray-600)', fontSize: 12, marginBottom: 6 }}>
                  {album.artist}
                </p>
                <p style={{ color: 'var(--pink)', fontSize: 12, fontWeight: 600 }}>
                  Be the first to rate →
                </p>
              </div>
            ))}

          </div>
        )}
      </section>

    </main>
  )
}