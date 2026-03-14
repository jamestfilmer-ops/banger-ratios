'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const GENRES = ['All','Rock','Pop','Hip-Hop/Rap','R&B/Soul','Alternative','Country','Electronic','Jazz','Classical']

function AlbumsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const artistFilter = searchParams.get('artist')

  const [query,      setQuery]      = useState('')
  const [results,    setResults]    = useState([])
  const [itunesMap,  setItunesMap]  = useState({})
  const [community,  setCommunity]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [searching,  setSearching]  = useState(false)
  const [clicking,   setClicking]   = useState(null)
  const [searchMode, setSearchMode] = useState('albums')
  const [genre,      setGenre]      = useState('All')

  useEffect(() => {
    supabase.from('albums').select('*')
      .order('banger_ratio', { ascending: false, nullsFirst: false })
      .then(({ data }) => { setCommunity(data || []); setLoading(false) })
  }, [])

  async function doSearch() {
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    setItunesMap({})
    try {
      const res = await fetch('/api/spotify-search?q=' + encodeURIComponent(query) + '&type=' + searchMode)
      const data = await res.json()
      const items = searchMode === 'song' ? (data.tracks || []) : (data.albums || [])
      setResults(items)
      // Background iTunes ID resolution
      items.slice(0, 12).forEach(async (item) => {
        try {
          const hint = item.searchHint || ((item.albumName || '') + ' ' + item.artistName)
          const r = await fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(hint) + '&entity=album&limit=1')
          const d = await r.json()
          const match = d.results?.[0]
          if (match) {
            const key = item.spotifyId || item.spotifyAlbumId || item.spotifyTrackId
            setItunesMap(prev => ({ ...prev, [key]: match.collectionId }))
          }
        } catch {}
      })
    } catch (err) { console.error(err) }
    setSearching(false)
  }

  // Click handler — if iTunes ID is ready use it, otherwise fetch it now
  async function handleResultClick(item) {
    const key = item.spotifyId || item.spotifyAlbumId || item.spotifyTrackId
    if (itunesMap[key]) {
      router.push('/album/' + itunesMap[key])
      return
    }
    setClicking(key)
    try {
      const hint = item.searchHint || ((item.albumName || '') + ' ' + item.artistName)
      const r = await fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(hint) + '&entity=album&limit=1')
      const d = await r.json()
      const match = d.results?.[0]
      if (match) {
        router.push('/album/' + match.collectionId)
      } else {
        alert('Could not find this album in iTunes. Try searching the album title directly.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    }
    setClicking(null)
  }

  function ratioColor(r) {
    if (r >= 90) return '#00B84D'
    if (r >= 75) return '#FF9500'
    return 'var(--pink)'
  }

  const displayed = community.filter(a => {
    if (artistFilter) return a.artist_name?.toLowerCase().includes(artistFilter.toLowerCase())
    if (genre !== 'All') return a.genre === genre
    return true
  })

  return (
    <main className="section" style={{ paddingTop: '2rem' }}>
      <div className="page-header">
        <h1>{artistFilter ? artistFilter + "'s Albums" : 'Search & Rate'}</h1>
        <p>{artistFilter
          ? 'Community ratings for ' + artistFilter
          : 'Find any album or song. Rate it track by track.'}</p>
      </div>

      {/* Search mode toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: '1rem' }}>
        {[['albums','Albums'],['song','Songs & Tracks']].map(([mode, label]) => (
          <button key={mode} onClick={() => { setSearchMode(mode); setResults([]) }} style={{
            padding: '7px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            border: '1.5px solid ' + (searchMode === mode ? 'var(--pink)' : 'var(--border)'),
            background: searchMode === mode ? 'var(--pink)' : 'white',
            color: searchMode === mode ? 'white' : 'var(--gray-text)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{label}</button>
        ))}
      </div>

      {/* Search bar */}
      <div className="search-wrap">
        <input
          className="search-input"
          placeholder={searchMode === 'song'
            ? 'Search any song (e.g. Dry Spell, Kacey Musgraves)...'
            : 'Search any album or artist...'}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
        />
        <button className="primary-btn" onClick={doSearch} disabled={searching} style={{ whiteSpace: 'nowrap' }}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Spotify results */}
      {results.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontSize: 13, color: 'var(--gray-text)', marginBottom: '1.2rem', textAlign: 'center' }}>
            {searchMode === 'song' ? 'Click to rate the full album' : 'Click to rate track by track'}
          </p>
          <div className="album-grid">
            {results.map((item, i) => {
              const key     = item.spotifyId || item.spotifyAlbumId || item.spotifyTrackId || i
              const name    = item.albumName || ''
              const artist  = item.artistName || ''
              const artwork = item.artwork || item.albumArtwork || ''
              const isReady = !!itunesMap[key]
              const isLoading = clicking === key

              return (
                <div key={key}
                  onClick={() => handleResultClick(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="album-card" style={{ opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    <div className="album-art">
                      {artwork
                        ? <img src={artwork} alt={name} />
                        : <span style={{ fontSize: '2rem', color: 'var(--gray-text)' }}>♪</span>}
                    </div>
                    <div className="album-info">
                      <div className="album-title">{name}</div>
                      <div className="album-artist">{artist}</div>
                      {searchMode === 'song' && item.trackName && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--pink)', marginTop: 2, fontWeight: 600 }}>
                          Contains: {item.trackName}
                        </div>
                      )}
                      <div style={{ fontSize: '0.7rem', marginTop: 2, color: isReady ? '#00B84D' : 'var(--gray-text)', fontWeight: isReady ? 600 : 400 }}>
                        {isLoading ? 'Loading...' : isReady ? 'Ready to rate' : item.releaseDate?.slice(0,4) || ''}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Genre filter */}
      {!artistFilter && results.length === 0 && (
        <div className="genre-tabs">
          {GENRES.map(g => (
            <button key={g}
              className={'genre-tab' + (genre === g ? ' active' : '')}
              onClick={() => setGenre(g)}>{g}</button>
          ))}
        </div>
      )}

      {/* Community rated */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>Community Rated</h2>
        <p style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>
          Albums already scored. Click any to add your rating.
        </p>
      </div>

      {loading ? (
        <div className="album-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ width: '100%', aspectRatio: '1', background: '#f0f0f0' }} />
              <div style={{ padding: '0.9rem' }}>
                <div style={{ height: 12, background: '#f0f0f0', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 10, background: '#f4f4f4', borderRadius: 4, width: '70%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--gray-text)', marginTop: '3rem' }}>
          No albums yet — search one above and be the first to rate it!
        </p>
      ) : (
        <div className="album-grid">
          {displayed.map(album => (
            <Link key={album.id} href={'/album/' + album.itunes_collection_id} className="album-card">
              <div className="album-art">
                {album.artwork_url
                  ? <img
                      src={album.artwork_url.replace('100x100bb','300x300bb').replace('600x600bb','300x300bb')}
                      alt={album.name}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  : <span style={{ fontSize: '2rem', color: 'var(--gray-text)' }}>♪</span>}
              </div>
              <div className="album-info">
                <div className="album-title">{album.name}</div>
                <div className="album-artist">{album.artist_name}</div>
                {album.banger_ratio != null && (
                  <div className="album-ratio" style={{ color: ratioColor(album.banger_ratio) }}>
                    {album.banger_ratio}% banger ratio
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

export default function AlbumsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-text)' }}>Loading...</div>}>
      <AlbumsContent />
    </Suspense>
  )
}
