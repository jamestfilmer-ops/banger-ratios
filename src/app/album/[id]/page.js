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

const timeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
])

export default function AlbumPage() {
  const { id: albumId } = useParams()
  const [album,     setAlbum]     = useState(null)
  const [tracks,    setTracks]    = useState([])
  const [myRatings, setMyRatings] = useState({})
  const [skipped,   setSkipped]   = useState({})
  const [user,      setUser]      = useState(null)
  const [loaded,    setLoaded]    = useState(false)
  const [error,     setError]     = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
    loadAlbum()
  }, [albumId])

  async function loadAlbum() {
    try {
      setError(null)
      setLoaded(false)

      // First try to load from Supabase (fast)
      const { data: existing } = await supabase
        .from('albums')
        .select('*')
        .eq('itunes_collection_id', albumId)
        .single()

      // Then fetch fresh from iTunes (gets correct artwork + tracks)
      let albumData = null
      let trackData = []
      try {
        const res = await timeout(
          fetch('https://itunes.apple.com/lookup?id=' + albumId + '&entity=song'),
          8000
        )
        const data = await res.json()
        const results = data.results || []
        albumData = results.find(r => r.wrapperType === 'collection')
        trackData = results.filter(r => r.wrapperType === 'track')
      } catch (fetchErr) {
        console.warn('iTunes fetch failed, using Supabase fallback:', fetchErr.message)
      }

      let dbAlbum = existing

      if (albumData) {
        // Save fresh data back to Supabase
        const { data: upserted } = await supabase.from('albums').upsert({
          itunes_collection_id: albumData.collectionId,
          name:         albumData.collectionName,
          artist_name:  albumData.artistName,
          artwork_url:  albumData.artworkUrl100?.replace('100x100', '600x600'),
          release_date: albumData.releaseDate?.split('T')[0],
          genre:        albumData.primaryGenreName,
          track_count:  trackData.length,
        }, { onConflict: 'itunes_collection_id' }).select().single()

        if (upserted) dbAlbum = upserted

        if (dbAlbum && trackData.length > 0) {
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
      }

      if (!dbAlbum) {
        setError('Album not found')
        setLoaded(true)
        return
      }

      setAlbum(dbAlbum)

      // Load tracks from DB
      const { data: dbTracks } = await supabase
        .from('tracks').select('*').eq('album_id', dbAlbum.id)
        .order('track_number', { ascending: true })
      setTracks(dbTracks || [])

      // Load user ratings
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
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-text)' }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>♪</div>
      Loading album...
    </div>
  )

  if (error || !album) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-text)' }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>😕</div>
      <p style={{ marginBottom: 16 }}>Could not load this album.</p>
      <button onClick={loadAlbum} style={{
        padding: '10px 24px', borderRadius: 10, background: 'var(--pink)',
        color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
      }}>Try again</button>
    </div>
  )

  const rated     = Object.keys(myRatings).length
  const total     = tracks.length
  const skips     = Object.keys(skipped).length
  const remaining = total - rated - skips
  const progress  = total > 0 ? Math.round((rated + skips) / total * 100) : 0
  const badge     = getBadge(album.banger_ratio || 0)
  const artUrl    = album.artwork_url || null

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 100px' }}>

      {/* Album header */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{
          width: 180, height: 180, borderRadius: 16, overflow: 'hidden',
          background: 'var(--bg-soft)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}>
          {artUrl
            ? <img src={artUrl} alt={album.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display='none' }} />
            : <span style={{ fontSize: 48, color: 'var(--gray-text)' }}>♪</span>}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, color: 'var(--gray-text)', marginBottom: 4 }}>
            {album.genre}{album.release_date ? ' · ' + album.release_date.slice(0,4) : ''}
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 700, marginBottom: 6, lineHeight: 1.2 }}>
            {album.name}
          </h1>
          <div style={{ fontSize: 16, color: 'var(--gray-text)', marginBottom: 20 }}>{album.artist_name}</div>

          <div style={{
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 14, padding: '16px 20px', display: 'inline-block',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--pink)', lineHeight: 1 }}>
                {album.banger_ratio != null ? album.banger_ratio + '%' : '—'}
              </span>
              <span style={{ fontSize: 14, color: 'var(--gray-text)' }}>Banger Ratio</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-text)', marginBottom: 8 }}>
              {tracks.filter(t => t.is_banger).length} bangers / {tracks.length} tracks
              {album.total_ratings > 0 ? ' · ' + album.total_ratings + ' ratings' : ''}
            </div>
            <div style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 20,
              background: badge.color + '18', fontSize: 12, fontWeight: 600, color: badge.color,
            }}>{badge.label}</div>
          </div>

          <button onClick={() => {
            const text = album.name + ' by ' + album.artist_name + ' — ' + album.banger_ratio + '% Banger Ratio on Banger Ratios'
            if (navigator.share) navigator.share({ title: album.name, text, url: window.location.href })
            else { navigator.clipboard?.writeText(window.location.href); setSaved(true); setTimeout(() => setSaved(false), 2000) }
          }} style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 12,
            padding: '8px 18px', borderRadius: 10, border: '1.5px solid var(--border)',
            background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gray-text)', marginBottom: 8 }}>
          <span>{rated} rated · {skips} skipped · {remaining} remaining</span>
          <span style={{ fontWeight: 600, color: progress === 100 ? '#00B84D' : 'var(--gray-text)' }}>{progress}%</span>
        </div>
        <div style={{ height: 6, background: 'var(--bg-soft)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: progress + '%', background: progress === 100 ? '#00B84D' : 'var(--pink)', borderRadius: 3, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Sign in prompt */}
      {!user && (
        <div style={{
          background: 'rgba(255,0,102,0.05)', border: '1px solid rgba(255,0,102,0.15)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 14, color: 'var(--gray-text)' }}>Sign in to save your ratings and contribute to the community score.</span>
          <a href="/auth" style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--pink)', color: 'white', fontSize: 13, fontWeight: 600 }}>Sign In</a>
        </div>
      )}

      {/* Scale legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, justifyContent: 'flex-end' }}>
        {Object.entries(SCALE).map(([n, label]) => (
          <span key={n} style={{ fontSize: 11, color: parseInt(n) >= 5 ? 'var(--pink)' : 'var(--gray-text)' }}>
            {n}={label}
          </span>
        ))}
      </div>

      {/* Tracks */}
      {tracks.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--gray-text)', padding: '2rem' }}>
          <p>No tracks loaded yet. <button onClick={loadAlbum} style={{ color: 'var(--pink)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Retry</button></p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tracks.map(track => {
            const myScore  = myRatings[track.id]
            const isSkipped = skipped[track.id]
            return (
              <div key={track.id} style={{
                background: 'white', border: '1px solid var(--border)', borderRadius: 14,
                padding: '14px 16px', opacity: isSkipped ? 0.45 : 1, transition: 'opacity 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--gray-text)', width: 20, flexShrink: 0, paddingTop: 2, textAlign: 'right' }}>
                    {track.track_number}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{track.name}</span>
                      {track.is_banger && <span style={{ fontSize: 14 }}>🔥</span>}
                      {track.duration_ms && <span style={{ fontSize: 12, color: 'var(--gray-text)' }}>{msToMin(track.duration_ms)}</span>}
                      {track.avg_rating > 0 && (
                        <span style={{ fontSize: 12, color: 'var(--gray-text)' }}>
                          Avg: {parseFloat(track.avg_rating).toFixed(1)}/7
                          {track.total_ratings > 0 ? ' · ' + track.total_ratings + ' ratings' : ''}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {[1,2,3,4,5,6,7].map(n => (
                        <button key={n} onClick={() => rateTrack(track.id, n)} style={{
                          width: 38, height: 38, borderRadius: 10, border: 'none',
                          background: myScore === n ? 'var(--pink)' : (n >= 5 ? 'rgba(255,0,102,0.07)' : 'var(--bg-soft)'),
                          color: myScore === n ? 'white' : (n >= 5 ? 'var(--pink)' : 'var(--gray-text)'),
                          fontWeight: myScore === n ? 700 : 500, fontSize: 14,
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                          transform: myScore === n ? 'scale(1.1)' : 'scale(1)',
                        }}>{n}</button>
                      ))}
                      <button onClick={() => skipTrack(track.id)} style={{
                        padding: '0 14px', height: 38, borderRadius: 10,
                        border: '1.5px solid ' + (isSkipped ? 'var(--pink)' : 'var(--border)'),
                        background: isSkipped ? 'rgba(255,0,102,0.07)' : 'white',
                        color: isSkipped ? 'var(--pink)' : 'var(--gray-text)',
                        fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                      }}>{isSkipped ? 'Unskip' : 'Skip'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {saved && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#111', color: 'white', padding: '12px 24px', borderRadius: 12,
          fontSize: 14, fontWeight: 500, zIndex: 999,
        }}>
          Saved ✓
        </div>
      )}
    </div>
  )
}
