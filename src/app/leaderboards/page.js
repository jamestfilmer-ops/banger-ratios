'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const GENRES  = ['All','Hip-Hop/Rap','Pop','Rock','R&B/Soul','Alternative','Country','Electronic','Jazz','Metal']
const DECADES = ['All','2020s','2010s','2000s','1990s','1980s','1970s']

function artFix(url) {
  if (!url) return null
  return url.replace('100x100bb','300x300bb').replace('600x600bb','300x300bb').replace('100x100','300x300')
}
function ratioColor(r) {
  if (r >= 90) return '#00B84D'
  if (r >= 75) return '#FF9500'
  return 'var(--pink)'
}
function getBadge(r) {
  if (r >= 90) return '💎'
  if (r >= 75) return '🥇'
  if (r >= 60) return '🎵'
  return ''
}

export default function LeaderboardsPage() {
  const [albums,  setAlbums]  = useState([])
  const [tracks,  setTracks]  = useState([])
  const [genre,   setGenre]   = useState('All')
  const [decade,  setDecade]  = useState('All')
  const [tab,     setTab]     = useState('albums')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [genre, decade])

  async function load() {
    setLoading(true)
    let q = supabase.from('albums').select('*').gt('total_ratings', 0).limit(100)
    if (genre !== 'All') q = q.eq('genre', genre)
    if (decade !== 'All') {
      const yr = parseInt(decade)
      q = q.gte('release_date', yr + '-01-01').lt('release_date', (yr + 10) + '-01-01')
    }
    q = q.order('banger_ratio', { ascending: false })
    const { data } = await q
    setAlbums(data || [])

    const { data: trackData } = await supabase
      .from('tracks')
      .select('*, albums!tracks_album_id_fkey(name, artist_name, artwork_url, itunes_collection_id)')
      .gt('total_ratings', 0)
      .order('avg_rating', { ascending: false })
      .limit(50)
    setTracks(trackData || [])
    setLoading(false)
  }

  // Build artists from albums
  const artistMap = {}
  albums.forEach(a => {
    if (!a.artist_name) return
    if (!artistMap[a.artist_name]) {
      artistMap[a.artist_name] = { name: a.artist_name, artwork: artFix(a.artwork_url), albums: 0, totalRatio: 0, totalRatings: 0 }
    }
    artistMap[a.artist_name].albums++
    artistMap[a.artist_name].totalRatio += parseFloat(a.banger_ratio || 0)
    artistMap[a.artist_name].totalRatings += (a.total_ratings || 0)
  })
  const artists = Object.values(artistMap)
    .map(a => ({ ...a, avgRatio: parseFloat((a.totalRatio / a.albums).toFixed(1)) }))
    .sort((a, b) => b.avgRatio - a.avgRatio)

  const pill = (label, active, onClick) => (
    <button key={label} onClick={onClick} style={{
      padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 400,
      border: '1px solid ' + (active ? 'var(--pink)' : 'var(--border)'),
      background: active ? 'var(--pink)' : 'white',
      color: active ? 'white' : 'var(--gray-text)',
      cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
    }}>{label}</button>
  )

  const rowStyle = (i) => ({
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '12px 16px', borderRadius: 12,
    background: i < 3 ? 'rgba(255,0,102,0.03)' : 'white',
    border: '1px solid ' + (i < 3 ? 'rgba(255,0,102,0.12)' : 'var(--border)'),
    marginBottom: 8, textDecoration: 'none', color: 'inherit',
    transition: 'transform 0.15s',
  })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>

      <div className="page-header" style={{ textAlign: 'left', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Leaderboards</h1>
        <p style={{ color: 'var(--gray-text)', fontSize: 14 }}>The highest-rated music, ranked by the community</p>
      </div>

      {/* Primary tabs — Albums / Songs / Artists */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: '#f4f4f5', borderRadius: 12, padding: 4, width: 'fit-content',
      }}>
        {[['albums','Albums'],['tracks','Songs'],['artists','Artists']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '8px 22px', borderRadius: 9, border: 'none', fontSize: 13,
            fontWeight: tab === key ? 700 : 400,
            background: tab === key ? 'white' : 'transparent',
            color: tab === key ? 'var(--pink)' : 'var(--gray-text)',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* Genre + Decade filters — albums tab only */}
      {tab === 'albums' && (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {GENRES.map(g => pill(g, genre === g, () => setGenre(g)))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
            {DECADES.map(d => pill(d, decade === d, () => setDecade(d)))}
          </div>
        </>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--gray-text)', paddingTop: '3rem' }}>Loading...</p>
      ) : (
        <>
          {/* ALBUMS TAB */}
          {tab === 'albums' && (
            <div>
              {albums.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--gray-text)', paddingTop: '2rem' }}>No albums match these filters yet.</p>
              ) : albums.map((album, i) => (
                <Link key={album.id} href={'/album/' + album.itunes_collection_id}
                  style={rowStyle(i)}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateX(3px)'}
                  onMouseOut={e => e.currentTarget.style.transform = ''}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-text)', width: 24, flexShrink: 0, textAlign: 'center' }}>
                    {i + 1}
                  </span>
                  <div style={{
                    width: 52, height: 52, borderRadius: 8, overflow: 'hidden',
                    background: '#f0f0f0', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {artFix(album.artwork_url)
                      ? <img src={artFix(album.artwork_url)} alt={album.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.target.style.display = 'none' }} />
                      : <span style={{ fontSize: '1.4rem', color: 'var(--gray-text)' }}>♪</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getBadge(album.banger_ratio)} {album.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>
                      {album.artist_name}{album.genre ? ' · ' + album.genre : ''}{album.release_date ? ' · ' + album.release_date.slice(0,4) : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: ratioColor(album.banger_ratio) }}>{album.banger_ratio}%</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>{album.total_ratings} ratings</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* SONGS TAB */}
          {tab === 'tracks' && (
            <div>
              <p style={{ color: 'var(--gray-text)', fontSize: 13, marginBottom: 16 }}>
                Individual tracks ranked by average community rating (1–7 scale).
              </p>
              {tracks.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--gray-text)', paddingTop: '2rem' }}>
                  No track ratings yet. Rate some albums to populate this list!
                </p>
              ) : tracks.map((track, i) => {
                const album = track.albums
                return (
                  <Link key={track.id} href={'/album/' + (album?.itunes_collection_id || '')}
                    style={rowStyle(i)}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateX(3px)'}
                    onMouseOut={e => e.currentTarget.style.transform = ''}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-text)', width: 24, flexShrink: 0, textAlign: 'center' }}>{i + 1}</span>
                    <div style={{
                      width: 52, height: 52, borderRadius: 8, overflow: 'hidden',
                      background: '#f0f0f0', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {artFix(album?.artwork_url)
                        ? <img src={artFix(album.artwork_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                        : <span style={{ fontSize: '1.4rem', color: 'var(--gray-text)' }}>♪</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>{album?.artist_name} — {album?.name}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--pink)' }}>
                        {parseFloat(track.avg_rating).toFixed(1)}<span style={{ fontSize: 12, color: 'var(--gray-text)' }}>/7</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>
                        {track.total_ratings} ratings{track.is_banger ? ' · 🔥' : ''}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* ARTISTS TAB */}
          {tab === 'artists' && (
            <div>
              <p style={{ color: 'var(--gray-text)', fontSize: 13, marginBottom: 16 }}>
                Artists ranked by average Banger Ratio across all their rated albums.
              </p>
              {artists.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--gray-text)', paddingTop: '2rem' }}>No artist data yet.</p>
              ) : artists.map((artist, i) => (
                <Link key={artist.name} href={'/albums?artist=' + encodeURIComponent(artist.name)}
                  style={rowStyle(i)}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateX(3px)'}
                  onMouseOut={e => e.currentTarget.style.transform = ''}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-text)', width: 24, flexShrink: 0, textAlign: 'center' }}>{i + 1}</span>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', overflow: 'hidden',
                    background: '#f0f0f0', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem',
                  }}>
                    {artist.artwork
                      ? <img src={artist.artwork} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                      : '♪'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{artist.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>
                      {artist.albums} album{artist.albums !== 1 ? 's' : ''} rated · {artist.totalRatings} total ratings
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: ratioColor(artist.avgRatio) }}>{artist.avgRatio}%</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>avg ratio</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
