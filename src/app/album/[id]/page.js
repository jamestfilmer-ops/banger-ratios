// FILE: src/app/album/[id]/page.js
// Cmd+A → Delete → Paste
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
 
// 7-tier badge system
const BADGES = {
  untouchable: { label: '💎 Untouchable',          min: 95 },
  banger:      { label: '🔥 Certified Banger',      min: 80 },
  gold:        { label: '🥇 Solid Gold',            min: 65 },
  hits:        { label: '🎵 More Hits Than Misses', min: 50 },
  mixed:       { label: '🎲 Hit or Miss',           min: 35 },
  filler:      { label: '⚠️ Filler Heavy',          min: 20 },
  skip:        { label: '❌ Skip It',               min: 0  },
}
function getBadge(ratio) {
  if (ratio >= 95) return BADGES.untouchable
  if (ratio >= 80) return BADGES.banger
  if (ratio >= 65) return BADGES.gold
  if (ratio >= 50) return BADGES.hits
  if (ratio >= 35) return BADGES.mixed
  if (ratio >= 20) return BADGES.filler
  return BADGES.skip
}
 
// Honest, non-judgmental score labels
const SCORE_LABELS = {
  7: 'Perfect',
  6: 'Great',
  5: 'Good',       // banger threshold
  4: 'Decent',
  3: 'Filler',
  2: 'Weak',
  1: 'Not for me',
}
 
export default function AlbumPage({ params }) {
  const [album, setAlbum]         = useState(null)
  const [tracks, setTracks]       = useState([])
  const [userRatings, setUserRatings] = useState({})
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState({})
 
  useEffect(() => { init() }, [])
 
  async function init() {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    const id = (await params).id
    const { data: alb } = await supabase
      .from('albums')
      .select('*')
      .eq('itunes_collection_id', id)
      .single()
    if (!alb) { setLoading(false); return }
    setAlbum(alb)
    const { data: tr } = await supabase
      .from('tracks')
      .select('*')
      .eq('album_id', alb.id)
      .order('track_number', { ascending: true })
    setTracks(tr || [])
    if (u) {
      const { data: ratings } = await supabase
        .from('ratings')
        .select('track_id, score')
        .eq('user_id', u.id)
        .in('track_id', (tr||[]).map(t => t.id))
      const map = {}
      ;(ratings||[]).forEach(r => map[r.track_id] = r.score)
      setUserRatings(map)
    }
    setLoading(false)
  }
 
  async function rateTrack(trackId, score) {
    if (!user) { window.location.href = '/auth'; return }
    setSaving(prev => ({ ...prev, [trackId]: true }))
    await supabase.from('ratings').upsert({
      user_id: user.id, track_id: trackId, score,
      album_id: album.id
    }, { onConflict: 'user_id,track_id' })
    setUserRatings(prev => ({ ...prev, [trackId]: score }))
    setSaving(prev => ({ ...prev, [trackId]: false }))
  }
 
  if (loading) return <div style={{ padding:60,textAlign:'center',color:'#94A3B8' }}>Loading...</div>
  if (!album)  return <div style={{ padding:60,textAlign:'center',color:'#94A3B8' }}>Album not found.</div>
 
  const displayRatio = Math.max(5, album.banger_ratio || 0)
  const badge = getBadge(album.banger_ratio || 0)
 
  return (
    <div style={{ maxWidth:720,margin:'0 auto',padding:'32px 24px 80px' }}>
 
      {/* Album header */}
      <div style={{ display:'flex',gap:20,marginBottom:32,alignItems:'flex-start' }}>
        <img
          src={album.artwork_url?.replace('600x600','300x300')}
          alt={album.name}
          style={{ width:120,height:120,borderRadius:12,objectFit:'cover',flexShrink:0 }}
        />
        <div>
          <h1 style={{ fontSize:22,fontWeight:800,marginBottom:4 }}>{album.name}</h1>
          <p style={{ color:'var(--gray-text)',marginBottom:12 }}>{album.artist_name}</p>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <span style={{ fontSize:32,fontWeight:900,color:'var(--pink)' }}>
              {displayRatio}%
            </span>
            <span style={{ fontSize:12,fontWeight:700,color:'var(--pink)',
              background:'rgba(255,0,102,0.08)',padding:'4px 10px',borderRadius:8 }}>
              {badge.label}
            </span>
          </div>
          <p style={{ fontSize:12,color:'var(--gray-text)',marginTop:6 }}>
            {album.total_ratings || 0} ratings
          </p>
        </div>
      </div>
 
      {/* Track list */}
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        {tracks.map(track => {
          const userScore = userRatings[track.id]
          return (
            <div key={track.id} style={{ background:'white',borderRadius:12,
              border:'1px solid var(--border)',padding:'14px 16px' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }}>
                <div>
                  <p style={{ fontWeight:600,fontSize:14 }}>
                    {track.track_number}. {track.name}
                  </p>
                  {track.avg_score > 0 && (
                    <p style={{ fontSize:12,color:'var(--gray-text)',marginTop:2 }}>
                      Community avg: {track.avg_score?.toFixed(1)}
                    </p>
                  )}
                </div>
                {userScore && (
                  <span style={{ fontSize:12,fontWeight:700,color:'var(--pink)',
                    background:'rgba(255,0,102,0.08)',padding:'3px 10px',borderRadius:20 }}>
                    {SCORE_LABELS[userScore]} ({userScore})
                  </span>
                )}
              </div>
 
              {/* Honest-rating tip — shown only before rating */}
              {!userScore && (
                <p style={{ fontSize:11,color:'var(--gray-text)',textAlign:'center',
                  marginBottom:8,fontStyle:'italic' }}>
                  Rate honestly. 1–4 means it did not hit the banger threshold — that data matters just as much.
                </p>
              )}
 
              {/* Rating buttons */}
              <div style={{ display:'flex',gap:6,justifyContent:'center' }}>
                {[1,2,3,4,5,6,7].map(score => (
                  <button
                    key={score}
                    onClick={() => rateTrack(track.id, score)}
                    disabled={saving[track.id]}
                    style={{
                      width:38,height:38,borderRadius:8,border:'none',
                      background: userScore === score
                        ? 'var(--pink)'
                        : score >= 5
                          ? 'rgba(255,0,102,0.08)'
                          : '#F1F5F9',
                      color: userScore === score
                        ? 'white'
                        : score >= 5
                          ? 'var(--pink)'
                          : '#64748B',
                      fontWeight:700,fontSize:14,cursor:'pointer',
                      fontFamily:'inherit',
                      transition:'all 0.1s',
                    }}
                    title={SCORE_LABELS[score]}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
 
      {/* Save to List placeholder */}
      {user && (
        <button style={{
          padding:'10px 20px',borderRadius:10,marginTop:16,
          border:'1px solid var(--border)',background:'white',
          color:'var(--gray-text)',fontWeight:600,fontSize:13,
          cursor:'pointer',width:'100%',fontFamily:'inherit'
        }}
          onClick={() => alert('Lists feature coming soon!')}
        >
          + Save to List
        </button>
      )}
    </div>
  )
}
