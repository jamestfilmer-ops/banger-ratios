'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SCALE = { 1:'Awful', 2:'Bad', 3:'Meh', 4:'OK', 5:'Good', 6:'Great', 7:'Perfect' }

function getBadge(ratio) {
  if (ratio >= 95) return { label: '💎 Untouchable', color: '#00B84D' }
  if (ratio >= 80) return { label: '🔥 Certified Banger', color: '#FF6B00' }
  if (ratio >= 65) return { label: '🥇 Solid Gold', color: '#FF9500' }
  if (ratio >= 50) return { label: '🎵 More Hits Than Misses', color: '#3B82F6' }
  if (ratio >= 35) return { label: '🎲 Hit or Miss', color: '#8B5CF6' }
  if (ratio >= 20) return { label: '⚠️ Filler Heavy', color: '#F59E0B' }
  return { label: '❌ Skip It', color: '#EF4444' }
}

function msToMin(ms) {
  if (!ms) return ''
  const s = Math.floor(ms / 1000)
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}

function fixArtwork(url) {
  if (!url) return null
  return url
    .replace('100x100bb', '600x600bb')
    .replace('100x100bb.jpg', '600x600bb.jpg')
    .replace('/100x100/', '/600x600/')
    .replace('100x100', '600x600')
}

export default function AlbumPage() {
  const { id: albumId } = useParams()
  const [album,     setAlbum]     = useState(null)
  const [tracks,    setTracks]    = useState([])
  const [myRatings, setMyRatings] = useState({})
  const [skipped,   setSkipped]   = useState({})
  const [user,      setUser]      = useState(null)
  const [loaded,    setLoaded]    = useState(false)
  const [error,     setError]     = useState(null)
  const [saved,     setSaved]     = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
    loadAlbum()
  }, [albumId])

  async function loadAlbum() {
    try {
      setError(null)
      setLoaded(false)

      const res = await Promise.race([
        fetch('https://itunes.apple.com/lookup?id=' + albumId + '&entity=song'),
        new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 8000))
      ])
      const data = await res.json()
      const results = data.results || []
      const albumData = results.find(r => r.wrapperType === 'collection')
      const trackData = results.filter(r => r.wrapperType === 'track')

      if (!albumData) throw new Error('Album not found on iTunes')

      const { data: dbAlbum, error: upsertErr } = await supabase
        .from('albums')
        .upsert({
          itunes_collection_id: albumData.collectionId,
          name:         albumData.collectionName,
          artist_name:  albumData.artistName,
          artwork_url:  fixArtwork(albumData.artworkUrl100),
          release_date: albumData.releaseDate?.split('T')[0],
          genre:        albumData.primaryGenreName,
          track_count:  trackData.length,
        }, { onConflict: 'itunes_collection_id' })
        .select()
        .single()

      if (upsertErr) throw upsertErr
      setAlbum(dbAlbum)

      if (trackData.length > 0) {
        const trackRows = trackData.map(t => ({
          album_id:        dbAlbum.id,
          itunes_track_id: t.trackId,
          name:            t.trackName,
          track_number:    t.trackNumber,
          duration_ms:     t.trackTimeMillis,
          preview_url:     t.previewUrl,
        }))
        await supabase.from('tracks').upsert(trackRows, { onConflict: 'itunes_track_id' })
      }

      const { data: dbTracks } = await supabase
        .from('tracks').select('*')
        .eq('album_id', dbAlbum.id)
        .order('track_number', { ascending: true })
      setTracks(dbTracks || [])

      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u || null)
      if (u) {
        const { data: ratings } = await supabase
          .from('ratings').select('track_id, score')
          .eq('user_id', u.id).eq('album_id', dbAlbum.id)
        const map = {}
        ;(ratings || []).forEach(r => { map[r.track_id] = r.score })
        setMyRatings(map)
      }

      setLoaded(true)
    } catch (err) {
      console.error('loadAlbum error:', err)
      setError(err.message)
      setLoaded(true)
    }
  }

  async function rateTrack(trackId, score) {
    if (!user) { window.location.href = '/auth'; return }
    setMyRatings(prev => ({ ...prev, [trackId]: score }))
    setSaved(false)
    await supabase.from('ratings').upsert(
      { user_id: user.id, track_id: trackId, album_id: album.id, score },
      { onConflict: 'user_id,track_id' }
    )
    await supabase.rpc('recalculate_banger_ratio', { p_album_id: album.id })
    const { data: updated } = await supabase.from('albums').select('*').eq('id', album.id).single()
    if (updated) setAlbum(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function skipTrack(trackId) {
    setSkipped(prev => ({ ...prev, [trackId]: !prev[trackId] }))
  }

  if (!loaded) return (
    <div style={{ padding: 80, textAlign: 'center', color: 'var(--gray-text)' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>♪</div>
      <div style={{ fontSize: 15 }}>Loading album...</div>
    </div>
  )

  if (error || !album) return (
    <div style={{ padding: 80, textAlign: 'center', color: 'var(--gray-text)' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>😕</div>
      <p style={{ marginBottom: 20, fontSize: 16 }}>Could not load this album.</p>
      <button onClick={loadAlbum} style={{
        padding: '12px 28px', borderRadius: 12, background: 'var(--pink)',
        color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        fontWeight: 600, fontSize: 15,
      }}>Try again</button>
    </div>
  )

  const rated     = Object.keys(myRatings).length
  const total     = tracks.length
  const skips     = Object.keys(skipped).length
  const remaining = total - rated - skips
  const progress  = total > 0 ? Math.round((rated + skips) / total * 100) : 0
  const badge     = getBadge(album.banger_ratio || 0)
  const artUrl    = fixArtwork(album.artwork_url)
  const bangerCount = tracks.filter(t => t.is_banger).length

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 120px' }}>

      {/* ── ALBUM HEADER ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 32,
        marginBottom: 40,
        alignItems: 'start',
      }}>
        {/* Artwork */}
        <div style={{
          width: 'clamp(160px, 22vw, 260px)',
          aspectRatio: '1',
          borderRadius: 18,
          overflow: 'hidden',
          background: 'var(--bg-soft)',
          flexShrink: 0,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        }}>
          {artUrl
            ? <img src={artUrl} alt={album.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.display = 'none' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, color: 'var(--gray-text)' }}>♪</div>}
        </div>

        {/* Info */}
        <div style={{ paddingTop: 4 }}>
          <div style={{ fontSize: 13, color: 'var(--gray-text)', marginBottom: 6, fontWeight: 500 }}>
            {[album.genre, album.release_date?.slice(0,4)].filter(Boolean).join(' · ')}
          </div>

          <h1 style={{
            fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)',
            fontWeight: 800, marginBottom: 4, lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}>{album.name}</h1>

          <div style={{ fontSize: 17, color: 'var(--gray-text)', marginBottom: 24, fontWeight: 500 }}>
            {album.artist_name}
          </div>

          {/* Ratio display — clean, no box */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: 800, color: 'var(--pink)', lineHeight: 1,
                letterSpacing: '-0.03em',
              }}>
                {album.banger_ratio != null ? album.banger_ratio + '%' : '—'}
              </span>
              <span style={{ fontSize: 16, color: 'var(--gray-text)', fontWeight: 500 }}>Banger Ratio</span>
            </div>

            <div style={{ fontSize: 13, color: 'var(--gray-text)', marginBottom: 10 }}>
              {bangerCount} banger{bangerCount !== 1 ? 's' : ''} out of {total} tracks
              {album.total_ratings > 0 ? ` · ${album.total_ratings} community ratings` : ''}
            </div>

            <span style={{
              display: 'inline-block', padding: '5px 14px', borderRadius: 20,
              background: badge.color + '18', fontSize: 12, fontWeight: 700,
              color: badge.color, letterSpacing: 0.2,
            }}>{badge.label}</span>
          </div>

          {/* Share button */}
          <button onClick={() => {
            const text = `${album.name} by ${album.artist_name} — ${album.banger_ratio}% Banger Ratio on Banger Ratios`
            if (navigator.share) navigator.share({ title: album.name, text, url: window.location.href })
            else { navigator.clipboard?.writeText(window.location.href); setSaved(true); setTimeout(() => setSaved(false), 2000) }
          }} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 10,
            border: '1.5px solid var(--border)',
            background: 'white', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            color: 'var(--gray-text)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 12, color: 'var(--gray-text)', marginBottom: 6, fontWeight: 500,
        }}>
          <span>{rated} rated · {skips} skipped · {remaining} remaining</span>
          <span style={{ color: progress === 100 ? '#00B84D' : 'var(--gray-text)', fontWeight: 700 }}>
            {progress}%
          </span>
        </div>
        <div style={{ height: 5, background: 'var(--bg-soft)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: progress + '%',
            background: progress === 100 ? '#00B84D' : 'var(--pink)',
            borderRadius: 99, transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* ── SIGN IN PROMPT ── */}
      {!user && (
        <div style={{
          background: 'rgba(255,0,102,0.04)',
          border: '1px solid rgba(255,0,102,0.15)',
          borderRadius: 12, padding: '12px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 14, color: 'var(--gray-text)' }}>
            Sign in to save ratings and contribute to the community score.
          </span>
          <a href="/auth" style={{
            padding: '8px 20px', borderRadius: 8, background: 'var(--pink)',
            color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>Sign In</a>
        </div>
      )}

      {/* ── SCALE LEGEND ── */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap',
        marginBottom: 16, justifyContent: 'flex-end',
      }}>
        {Object.entries(SCALE).map(([n, label]) => (
          <span key={n} style={{
            fontSize: 11, fontWeight: 500,
            color: parseInt(n) >= 5 ? 'var(--pink)' : 'var(--gray-text)',
          }}>{n}={label}</span>
        ))}
      </div>

      {/* ── TRACK LIST ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tracks.map(track => {
          const myScore   = myRatings[track.id]
          const isSkipped = skipped[track.id]
          return (
            <div key={track.id} style={{
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '14px 18px',
              opacity: isSkipped ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                {/* Track number */}
                <span style={{
                  fontSize: 12, color: 'var(--gray-text)',
                  width: 22, flexShrink: 0, paddingTop: 3,
                  textAlign: 'right', fontWeight: 500,
                }}>{track.track_number}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Track name row */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 8, marginBottom: 10, flexWrap: 'wrap',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{track.name}</span>
                    {track.is_banger && <span style={{ fontSize: 13 }}>🔥</span>}
                    {track.duration_ms > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--gray-text)' }}>
                        {msToMin(track.duration_ms)}
                      </span>
                    )}
                    {track.avg_rating > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--gray-text)' }}>
                        Avg {parseFloat(track.avg_rating).toFixed(1)} · {track.total_ratings} ratings
                      </span>
                    )}
                  </div>

                  {/* Rating buttons */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {[1,2,3,4,5,6,7].map(n => (
                      <button key={n} onClick={() => rateTrack(track.id, n)} style={{
                        width: 42, height: 42, borderRadius: 10, border: 'none',
                        background: myScore === n
                          ? 'var(--pink)'
                          : n >= 5 ? 'rgba(255,0,102,0.07)' : 'var(--bg-soft)',
                        color: myScore === n
                          ? 'white'
                          : n >= 5 ? 'var(--pink)' : 'var(--gray-text)',
                        fontWeight: myScore === n ? 700 : 500,
                        fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s',
                        transform: myScore === n ? 'scale(1.12)' : 'scale(1)',
                        boxShadow: myScore === n ? '0 2px 8px rgba(255,0,102,0.3)' : 'none',
                      }}>{n}</button>
                    ))}
                    <button onClick={() => skipTrack(track.id)} style={{
                      padding: '0 16px', height: 42, borderRadius: 10,
                      border: '1.5px solid ' + (isSkipped ? 'var(--pink)' : 'var(--border)'),
                      background: isSkipped ? 'rgba(255,0,102,0.07)' : 'transparent',
                      color: isSkipped ? 'var(--pink)' : 'var(--gray-text)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}>{isSkipped ? 'Unskip' : 'Skip'}</button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── SAVED TOAST ── */}
      {saved && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#111', color: 'white', padding: '12px 28px',
          borderRadius: 14, fontSize: 14, fontWeight: 600, zIndex: 999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>Saved ✓</div>
      )}
    </div>
  )
}
