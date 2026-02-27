'use client'
 
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
 
const SCALE = { 1:"Awful", 2:"Bad", 3:"Meh", 4:"OK", 5:"Good", 6:"Great", 7:"Perfect" }
 
function getBadge(ratio) {
  if (ratio >= 90) return '💎 Certified Classic'
  if (ratio >= 75) return '🥇 Solid Gold'
  if (ratio >= 60) return '🎵 Hit or Miss'
  if (ratio >= 40) return '⚠️ Filler Warning'
  return '❌ Skip It'
}
 
export default function AlbumPage() {
  const { id: albumId } = useParams()
  const [album,     setAlbum]     = useState(null)
  const [tracks,    setTracks]    = useState([])
  const [myRatings, setMyRatings] = useState({})
  const [skipped,   setSkipped]   = useState({})
  const [user,      setUser]      = useState(null)
  const [loaded,    setLoaded]    = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [dirty,     setDirty]     = useState(false)
 
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
    loadAlbum()
  }, [albumId])
 
  async function loadAlbum() {
    const res  = await fetch(`https://itunes.apple.com/lookup?id=${albumId}&entity=song`)
    const data = await res.json()
    const results   = data.results || []
    const albumData = results.find(r  => r.wrapperType === 'collection')
    const trackData = results.filter(r => r.wrapperType === 'track')
    if (!albumData) return
 
    const { data: dbAlbum } = await supabase.from('albums').upsert({
      itunes_collection_id: albumData.collectionId,
      name:         albumData.collectionName,
      artist_name:  albumData.artistName,
      artwork_url:  albumData.artworkUrl100?.replace('100x100','600x600'),
      release_date: albumData.releaseDate?.split('T')[0],
      genre:        albumData.primaryGenreName,
      track_count:  trackData.length,
    }, { onConflict: 'itunes_collection_id' }).select().single()
 
    setAlbum(dbAlbum)
 
    const trackRows = trackData.map(t => ({
      album_id:        dbAlbum.id,
      itunes_track_id: t.trackId,
      name:            t.trackName,
      track_number:    t.trackNumber,
      duration_ms:     t.trackTimeMillis,
      preview_url:     t.previewUrl,
    }))
    await supabase.from('tracks').upsert(trackRows, { onConflict: 'itunes_track_id' })
 
    const { data: dbTracks } = await supabase.from('tracks').select('*')
      .eq("album_id", dbAlbum.id).order("track_number", { ascending: true })
    setTracks(dbTracks || [])
 
    const { data: { user: u } } = await supabase.auth.getUser()
    if (u) {
      const { data: existing } = await supabase.from('ratings')
        .select('track_id, score').eq('user_id', u.id).eq('album_id', dbAlbum.id)
      const map = {}
      ;(existing || []).forEach(r => map[r.track_id] = r.score)
      setMyRatings(map)
    }
    setLoaded(true)
  }
 
  function rate(trackId, score) {
    if (!user) return
    setMyRatings(prev => ({ ...prev, [trackId]: score }))
    setSkipped(prev  => { const n={...prev}; delete n[trackId]; return n })
    setDirty(true); setSaved(false)
  }
 
  function skip(trackId) {
    setSkipped(prev  => ({ ...prev, [trackId]: true }))
    setMyRatings(prev => { const n={...prev}; delete n[trackId]; return n })
    setDirty(true); setSaved(false)
  }
 
  async function submitAll() {
    if (!user || !album) return
    setSaving(true)
    const entries = Object.entries(myRatings)
    if (entries.length === 0) { setSaving(false); return }
 
    const rows = entries.map(([trackId, score]) => ({
      user_id:  user.id,
      track_id: parseInt(trackId),
      album_id: album.id,
      score,
    }))
    await supabase.from('ratings').upsert(rows, { onConflict: 'user_id,track_id' })
    await supabase.rpc('recalculate_banger_ratio', { p_album_id: album.id })
 
    const { data: dbTracks } = await supabase.from('tracks').select('*')
      .eq("album_id", album.id).order("track_number", { ascending: true })
    setTracks(dbTracks || [])
    const { data: refreshed } = await supabase.from('albums').select('*').eq('id', album.id).single()
    setAlbum(refreshed)
    setSaving(false); setSaved(true); setDirty(false)
  }
 
  function msToTime(ms) {
    if (!ms) return ""
    return `${Math.floor(ms/60000)}:${Math.floor((ms%60000)/1000).toString().padStart(2,"0")}`
  }
 
  if (!loaded) return (
    <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'var(--gray-400)' }}>Loading album...</p>
    </div>
  )
 
  const ratedTracks = tracks.filter(t => t.total_ratings > 0)
  const bangers     = tracks.filter(t => t.is_banger).length
  const myCount     = Object.keys(myRatings).length
  const skipCount   = Object.keys(skipped).length
  const progress    = tracks.length ? ((myCount+skipCount)/tracks.length*100).toFixed(0) : 0
 
  return (
    <div style={{ minHeight:'100vh', background:'#FAFAFA' }}>
      <main style={{ maxWidth:720, margin:'0 auto', padding:'28px 20px 120px' }}>
 
        {/* ── Album header ── */}
        {album && (
          <div style={{ display:'flex', gap:24, marginBottom:32, flexWrap:'wrap' }}>
            {album.artwork_url && (
              <img src={album.artwork_url} alt=""
                style={{ width:200, height:200, borderRadius:14, boxShadow:'0 8px 30px rgba(0,0,0,0.12)', flexShrink:0 }} />
            )}
            <div style={{ flex:1, minWidth:200 }}>
              <p style={{ fontSize:12, color:'var(--gray-400)', fontWeight:600, marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>
                {album.genre} · {album.release_date?.slice(0,4)}
              </p>
              <h1 style={{ fontSize:26, fontWeight:700, margin:'0 0 4px' }}>{album.name}</h1>
              <p style={{ color:'var(--gray-600)', fontSize:15, marginBottom:16 }}>{album.artist_name}</p>
 
              <div style={{ background:'white', borderRadius:14, padding:20, border:'1px solid var(--gray-200)' }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                  <span style={{ fontSize:40, fontWeight:700, color:'var(--pink)', lineHeight:1 }}>
                    {album.banger_ratio ?? 0}%
                  </span>
                  <span style={{ fontSize:13, color:'var(--gray-400)', fontWeight:500 }}>Banger Ratio</span>
                </div>
                <p style={{ color:'var(--gray-400)', fontSize:12, marginTop:4 }}>
                  {bangers} bangers / {ratedTracks.length || album.track_count} tracks
                  · {album.total_ratings || 0} ratings
                </p>
                {album.total_ratings > 0 && (
                  <p style={{ fontSize:13, color:'var(--pink)', fontWeight:700, marginTop:8 }}>
                    {getBadge(album.banger_ratio)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
 
        {/* ── Sign-in prompt ── */}
        {!user && (
          <div style={{
            background:'var(--pink-light)', border:'1px solid rgba(255,0,102,0.15)',
            borderRadius:12, padding:'14px 18px', marginBottom:20,
          }}>
            <p style={{ color:'var(--pink)', fontSize:13 }}>
              <a href='/auth' style={{ fontWeight:700, textDecoration:'underline' }}>Sign in</a>
              {' to rate tracks and contribute to the Banger Ratio!'}
            </p>
          </div>
        )}
 
        {/* ── Progress bar ── */}
        {user && (
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:12, color:'var(--gray-400)', fontWeight:500 }}>
                {myCount} rated · {skipCount} skipped · {tracks.length - myCount - skipCount} remaining
              </span>
              <span style={{ fontSize:12, color:'var(--pink)', fontWeight:600 }}>{progress}%</span>
            </div>
            <div style={{ height:4, background:'var(--gray-200)', borderRadius:2, overflow:'hidden' }}>
              <div style={{
                height:'100%', background:'var(--pink)', borderRadius:2,
                width:progress+'%', transition:'width 0.3s ease',
              }} />
            </div>
          </div>
        )}
 
        {/* ── Scale legend ── */}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginBottom:12, flexWrap:'wrap' }}>
          {Object.entries(SCALE).map(([n, label]) => (
            <span key={n} style={{ fontSize:10, color:'var(--gray-400)', fontWeight:500 }}>
              {n}={label}
            </span>
          ))}
        </div>
 
        {/* ── Track list ── */}
        {tracks.map(track => {
          const myScore  = myRatings[track.id]
          const isSkipped = skipped[track.id]
          return (
            <div key={track.id} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 12px',
              background: isSkipped ? '#FAFAFA' : 'white',
              borderRadius:10, marginBottom:4,
              border:'1px solid var(--gray-200)',
              opacity: isSkipped ? 0.5 : 1,
              transition:'all 0.15s',
            }}>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--gray-400)', width:22, textAlign:'center', flexShrink:0 }}>
                {track.track_number}
              </span>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:0 }}>
                  {track.name}
                  {track.is_banger && <span style={{ color:'var(--pink)', marginLeft:4 }}>🔥</span>}
                </p>
                <p style={{ fontSize:11, color:'var(--gray-400)', margin:0 }}>
                  {msToTime(track.duration_ms)}
                  {track.total_ratings > 0 && ` · Avg: ${track.avg_rating}/7 · ${track.total_ratings} ratings`}
                </p>
              </div>
 
              {user && !isSkipped && (
                <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                  {[1,2,3,4,5,6,7].map(n => (
                    <button key={n} onClick={() => rate(track.id, n)} style={{
                      width:32, height:32, borderRadius:8, border:"none", cursor:"pointer",
                      fontSize:12, fontWeight:700,
                      background: myScore===n ? 'var(--pink)' : myScore&&myScore>n ? 'rgba(255,0,102,0.12)' : 'var(--gray-100)',
                      color:      myScore===n ? 'white'       : myScore&&myScore>n ? 'var(--pink)'           : 'var(--gray-400)',
                      transition:'all 0.1s',
                    }}>{n}</button>
                  ))}
                </div>
              )}
 
              {user && (
                <button onClick={() => isSkipped ? rate(track.id, 5) : skip(track.id)} style={{
                  padding:'6px 10px', borderRadius:7, border:'1px solid var(--gray-200)',
                  background: isSkipped ? 'rgba(255,0,102,0.06)' : 'white',
                  color:      isSkipped ? 'var(--pink)'          : 'var(--gray-400)',
                  fontSize:10, fontWeight:600, cursor:"pointer", flexShrink:0,
                }}>
                  {isSkipped ? 'Undo' : 'Skip'}
                </button>
              )}
            </div>
          )
        })}
 
        {/* ── Sticky submit bar ── */}
        {user && (
          <div style={{
            position:'fixed', bottom:0, left:0, right:0, padding:'16px 24px',
            background:'rgba(255,255,255,0.96)', backdropFilter:'blur(20px)',
            borderTop:'1px solid var(--gray-200)',
            display:'flex', justifyContent:'center', alignItems:'center', gap:16,
          }}>
            {saved && (
              <span style={{ color:'var(--green)', fontSize:13, fontWeight:600 }}>
                ✅ Ratings saved! Banger Ratio updated.
              </span>
            )}
            <button onClick={submitAll} disabled={saving || !dirty} style={{
              padding:'12px 32px', borderRadius:10, border:'none',
              fontSize:14, fontWeight:700, cursor: dirty ? "pointer" : "default",
              background: dirty ? 'var(--pink)' : 'var(--gray-200)',
              color:      dirty ? 'white'       : 'var(--gray-400)',
              transition:'all 0.2s',
            }}>
              {saving ? 'Saving...' : dirty ? `Submit ${myCount} Rating${myCount!==1?'s':''}` : 'All Saved'}
            </button>
          </div>
        )}
 
      </main>
    </div>
  )
}
