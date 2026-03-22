'use client'
 
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
 
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
 
const SCORE_LABEL = { 1:"Awful", 2:"Bad", 3:"Meh", 4:"OK", 5:"Good", 6:"Great", 7:"Perfect" }
 
export default function FeedPage() {
  const [user,       setUser]       = useState(null)
  const [activities, setActivities] = useState([])
  const [loading,    setLoading]    = useState(true)
 
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user || null
      setUser(u)
      if (u) loadFeed(u.id)
      else setLoading(false)
    })
  }, [])
 
  async function loadFeed(userId) {
    const { data: follows } = await supabase.from('follows')
      .select('following_id').eq('follower_id', userId)
    const followingIds = (follows || []).map(f => f.following_id)
 
    if (followingIds.length === 0) {
      setActivities([]); setLoading(false); return
    }
 
    const { data: ratings } = await supabase.from('ratings')
      .select(`
        id, score, created_at,
        tracks ( name, track_number ),
        albums ( id, name, artist_name, artwork_url, itunes_collection_id ),
        profiles ( username, display_name, avatar_url )
      `)
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(50)
 
    setActivities(ratings || [])
    setLoading(false)
  }
 
  if (loading) return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'60px 24px', textAlign:'center' }}>
      <p style={{ color:'var(--gray-400)' }}>Loading your feed...</p>
    </div>
  )
 
  if (!user) return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'60px 24px', textAlign:'center' }}>
      <h2 style={{ fontSize:22, fontWeight:700, marginBottom:12 }}>Sign in to see your feed</h2>
      <p style={{ color:'var(--gray-400)', marginBottom:24 }}>
        Your feed shows what people you follow are rating.
      </p>
      <a href='/auth' style={{
        display:'inline-block', background:'var(--pink)', color:'white',
        padding:'12px 28px', borderRadius:10, fontWeight:700, fontSize:15,
      }}>Sign In</a>
    </div>
  )
 
  if (activities.length === 0) return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'60px 24px', textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>👥</div>
      <h2 style={{ fontSize:22, fontWeight:700, marginBottom:12 }}>Your feed is empty</h2>
      <p style={{ color:'var(--gray-400)', marginBottom:24 }}>
        Follow some users to see what they're rating.
      </p>
      <a href='/friends' style={{
        display:'inline-block', background:'var(--pink)', color:'white',
        padding:'12px 28px', borderRadius:10, fontWeight:700, fontSize:15,
      }}>Find Friends</a>
    </div>
  )
 
  return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'28px 20px 60px' }}>
      <h1 style={{ fontSize:24, fontWeight:700, marginBottom:24 }}>Your Feed</h1>
 
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {activities.map(act => {
          const scoreLbl = SCORE_LABEL[act.score]
          const scoreCol = act.score >= 5 ? 'var(--pink)' : 'var(--gray-400)'
          const album    = act.albums
          const track    = act.tracks
          const profile  = act.profiles
          if (!album || !track || !profile) return null
          // Use itunes_collection_id for the route — that's what the album page expects
          const albumHref = `/album/${album.itunes_collection_id}`
          return (
            <div key={act.id} style={{
              display:'flex', gap:12, background:'white',
              border:'1px solid var(--gray-200)', borderRadius:12, padding:'14px 16px',
              transition:'box-shadow 0.15s',
            }}>
              {/* Avatar */}
              <div style={{
                width:36, height:36, borderRadius:18, flexShrink:0,
                background: profile.avatar_url ? 'transparent' : 'var(--pink)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:14, fontWeight:700, color:'white', overflow:'hidden',
              }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} style={{ width:36, height:36, objectFit:"cover" }} />
                  : (profile.display_name || profile.username || "?")[0].toUpperCase()
                }
              </div>
 
              {/* Content */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>
                    {profile.display_name || profile.username}
                  </span>
                  <span style={{ fontSize:11, color:'var(--gray-400)' }}>
                    {timeAgo(act.created_at)}
                  </span>
                </div>
 
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  {/* Album art */}
                  <a href={albumHref} style={{ flexShrink:0 }}>
                    {album.artwork_url
                      ? <img src={album.artwork_url} alt=""
                          style={{ width:44, height:44, borderRadius:6, objectFit:'cover' }} />
                      : <div style={{ width:44, height:44, borderRadius:6, background:'var(--gray-100)' }} />
                    }
                  </a>
                  <div style={{ minWidth:0 }}>
                    <a href={albumHref}>
                      <p style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {album.name}
                      </p>
                      <p style={{ fontSize:11, color:'var(--gray-400)' }}>{album.artist_name}</p>
                    </a>
                    <p style={{ fontSize:11, marginTop:2 }}>
                      Track {track.track_number}: <em>{track.name}</em>
                      {'  '}<span style={{ fontWeight:700, color:scoreCol }}>{act.score}/7 — {scoreLbl}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
