'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const GENRES = ['All','Rock','Pop','Hip-Hop/Rap','R&B/Soul','Alternative','Country','Electronic','Jazz','Classical']

function AlbumsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const artistFilter = searchParams.get('artist')

  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState([])
  const [community, setCommunity]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [searching, setSearching]   = useState(false)
  const [searchMode, setSearchMode] = useState('albums')
  const [genre, setGenre]           = useState('All')

  useEffect(() => {
    supabase.from('albums').select('*')
      .order('banger_ratio', { ascending: false, nullsFirst: false })
      .then(({ data }) => { setCommunity(data || []); setLoading(false) })
  }, [])

  async function doSearch() {
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    try {
      const entity = searchMode === 'songs' ? 'musicTrack' : 'album'
      const res = await fetch(
        'https://itunes.apple.com/search?term=' + encodeURIComponent(query) +
        '&entity=' + entity + '&limit=20'
      )
      const data = await res.json()
      setResults(data.results || [])
    } catch { setResults([]) }
    setSearching(false)
  }

  function artUrl(url) {
    if (!url) return null
    return url.replace('100x100', '300x300').replace('60x60', '300x300')
  }

  const displayed = community.filter(a => {
    if (artistFilter) return a.artist_name?.toLowerCase().includes(artistFilter.toLowerCase())
    if (genre !== 'All') return a.genre === genre
    return true
  })

  function ratioColor(r) {
    if (r >= 90) return '#00B84D'
    if (r >= 75) return '#FF9500'
    return 'var(--pink)'
  }

  return (
    <main className="section" style={{ paddingTop: '2rem' }}>
      <div className="page-header">
        <h1>{artistFilter ? artistFilter + "'s Albums" : 'Search & Rate'}</h1>
        <p>{artistFilter ? 'Community ratings for ' + artistFilter : 'Find any album or song. Rate it track by track.'}</p>
      </div>

      {/* Search mode toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: '1rem' }}>
        {[['albums', 'Albums'], ['songs', 'Songs & Tracks']].map(([mode, label]) => (
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
          placeholder={searchMode === 'songs'
            ? 'Search any song (e.g. Dry Spell, Kacey Musgraves)...'
            : 'Search any album or artist (e.g. Deeper Well, Kacey Musgraves)...'}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
        />
        <button className="primary-btn" onClick={doSearch} disabled={searching} style={{ whiteSpace: 'nowrap' }}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontSize: 13, color: 'var(--gray-text)', marginBottom: '1.2rem', textAlign: 'center' }}>
            {searchMode === 'songs'
              ? 'Click any result to rate the full album'
              : 'Click any album to rate it track by track'}
          </p>
          <div className="album-grid">
            {results.map(item => (
              <Link
                key={item.trackId || item.collectionId}
                href={'/album/' + item.collectionId}
                className="album-card"
              >
                <div className="album-art">
                  {artUrl(item.artworkUrl100)
                    ? <img src={artUrl(item.artworkUrl100)} alt="" />
                    : <span style={{ fontSize: '2rem', color: 'var(--gray-text)' }}>♪</span>}
                </div>
                <div className="album-info">
                  <div className="album-title">
                    {searchMode === 'songs' ? (item.collectionName || item.trackName) : item.collectionName}
                  </div>
                  <div className="album-artist">{item.artistName}</div>
                  {searchMode === 'songs' && item.trackName && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--pink)', marginTop: '0.2rem', fontWeight: 600 }}>
                      Contains: {item.trackName}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Genre filter */}
      {!artistFilter && results.length === 0 && (
        <div className="genre-tabs">
          {GENRES.map(g => (
            <button key={g} className={'genre-tab' + (genre === g ? ' active' : '')} onClick={() => setGenre(g)}>{g}</button>
          ))}
        </div>
      )}

      {/* Community rated */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>Community Rated</h2>
        <p style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>Albums already scored. Click any to add your rating.</p>
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
                  ? <img src={album.artwork_url.replace('100x100bb', '300x300bb').replace('600x600bb', '300x300bb')}
                      alt={album.name} onError={e => { e.target.style.display = 'none' }} />
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
