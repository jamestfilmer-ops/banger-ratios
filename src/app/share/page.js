'use client'
 
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
 
function getBadge(ratio) {
  if (ratio >= 90) return { label:'💎 Certified Classic', color:'#7B2FBE' }
  if (ratio >= 75) return { label:'🥇 Solid Gold',        color:'#B8860B' }
  if (ratio >= 60) return { label:'🎵 Hit or Miss',       color:'#2563EB' }
  if (ratio >= 40) return { label:'⚠️ Filler Warning',    color:'#D97706' }
  return              { label:'❌ Skip It',            color:'#DC2626' }
}
 
export default function SharePage() {
  const [user,      setUser]      = useState(null)
  const [profile,   setProfile]   = useState(null)
  const [albums,    setAlbums]    = useState([])
  const [selected,  setSelected]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [copied,    setCopied]    = useState(false)
  const cardRef = useRef(null)
 
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data?.user
      if (!u) { setLoading(false); return }
      setUser(u)
 
      const { data: prof } = await supabase.from('profiles')
        .select('username, display_name, avatar_url')
        .eq('id', u.id).single()
      setProfile(prof)
 
      // Get albums this user has rated, with their personal avg score
      const { data: rated } = await supabase.from('ratings')
        .select(`
          album_id,
          albums ( id, name, artist_name, artwork_url, banger_ratio )
        `)
        .eq('user_id', u.id)
 
      // Deduplicate by album
      const seen = new Set()
      const unique = (rated || []).filter(r => {
        if (seen.has(r.album_id)) return false
        seen.add(r.album_id); return true
      }).map(r => r.albums).filter(Boolean)
 
      setAlbums(unique)
      if (unique.length > 0) setSelected(unique[0])
      setLoading(false)
    })
  }, [])
 
  function shareUrl() {
    if (!selected) return ""
    return `${window.location.origin}/album/${selected.id}`
  }
 
  async function handleShare() {
    const url = shareUrl()
    const badge = getBadge(selected?.banger_ratio || 0)
    const text = `I rated ${selected?.name} by ${selected?.artist_name} — ${selected?.banger_ratio}% Banger Ratio (${badge.label}) on Banger Ratios!`
 
    if (navigator.share) {
      try { await navigator.share({ title:"Banger Ratios", text, url }) }
      catch(e) {}
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }
 
  if (loading) return (
    <div style={{ maxWidth:560, margin:'0 auto', padding:'60px 24px', textAlign:'center' }}>
      <p style={{ color:'var(--gray-400)' }}>Loading...</p>
    </div>
  )
 
  if (!user) return (
    <div style={{ maxWidth:560, margin:'0 auto', padding:'60px 24px', textAlign:'center' }}>
      <h2 style={{ fontSize:22, fontWeight:700, marginBottom:12 }}>Sign in to create a share card</h2>
      <a href='/auth' style={{
        display:'inline-block', background:'var(--pink)', color:'white',
        padding:'12px 28px', borderRadius:10, fontWeight:700
      }}>Sign In</a>
    </div>
  )
 
  const badge = selected ? getBadge(selected.banger_ratio || 0) : null
  const displayName = profile?.display_name || profile?.username || "You"
 
  return (
    <div style={{ maxWidth:560, margin:'0 auto', padding:'28px 20px 60px' }}>
      <h1 style={{ fontSize:24, fontWeight:700, marginBottom:6 }}>Share Your Banger Ratio</h1>
      <p style={{ color:'var(--gray-400)', fontSize:14, marginBottom:28 }}>
        Pick an album you rated and share your result.
      </p>
 
      {/* Album picker */}
      {albums.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--gray-400)' }}>
          <p>You haven't rated any albums yet.</p>
          <a href='/albums' style={{ color:'var(--pink)', fontWeight:600 }}>Start rating →</a>
        </div>
      ) : (
        <>
          <label style={{ fontWeight:600, fontSize:13, display:'block', marginBottom:8 }}>
            Choose an album
          </label>
          <select
            value={selected?.id || ""}
            onChange={e => setSelected(albums.find(a => String(a.id) === e.target.value))}
            style={{
              width:'100%', padding:'10px 14px', borderRadius:10,
              border:'1.5px solid var(--gray-200)', fontSize:14, marginBottom:28,
              background:'white', cursor:'pointer', fontFamily:'inherit',
            }}
          >
            {albums.map(a => (
              <option key={a.id} value={a.id}>{a.name} — {a.artist_name}</option>
            ))}
          </select>
 
          {/* Share card preview */}
          {selected && (
            <div ref={cardRef} style={{
              background:'linear-gradient(135deg, #111111 0%, #1a1a2e 100%)',
              borderRadius:20, padding:32, marginBottom:24,
              border:'2px solid rgba(255,0,102,0.3)',
              boxShadow:'0 20px 60px rgba(255,0,102,0.15)',
            }}>
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{
                    width:32, height:32, borderRadius:8, background:'var(--pink)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, fontWeight:800, color:'white',
                  }}>BR</div>
                  <span style={{ color:'rgba(255,255,255,0.7)', fontSize:12, fontWeight:600 }}>
                    BANGER RATIOS
                  </span>
                </div>
                <span style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>bangerratios.com</span>
              </div>
 
              {/* Album info */}
              <div style={{ display:'flex', gap:16, alignItems:'flex-start', marginBottom:24 }}>
                {selected.artwork_url && (
                  <img src={selected.artwork_url} alt=""
                    style={{ width:80, height:80, borderRadius:10, flexShrink:0 }} />
                )}
                <div style={{ minWidth:0 }}>
                  <p style={{
                    color:'white', fontWeight:700, fontSize:17,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    marginBottom:4
                  }}>
                    {selected.name}
                  </p>
                  <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>
                    {selected.artist_name}
                  </p>
                </div>
              </div>
 
              {/* Big ratio */}
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:64, fontWeight:800, color:'var(--pink)', lineHeight:1 }}>
                  {selected.banger_ratio ?? 0}%
                </div>
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:4 }}>
                  Banger Ratio
                </div>
              </div>
 
              {/* Badge */}
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <span style={{
                  display:'inline-block',
                  background: 'rgba(255,255,255,0.08)',
                  border: `1px solid ${badge.color}`,
                  color: badge.color,
                  padding:'6px 16px', borderRadius:20, fontSize:13, fontWeight:700,
                }}>
                  {badge.label}
                </span>
              </div>
 
              {/* Rated by */}
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:16, textAlign:'center' }}>
                <span style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>
                  Rated by <strong style={{ color:"rgba(255,255,255,0.7)" }}>{displayName}</strong>
                </span>
              </div>
            </div>
          )}
 
          {/* Share button */}
          <button onClick={handleShare} style={{
            width:'100%', padding:'14px', borderRadius:12, border:'none',
            background:'var(--pink)', color:'white',
            fontSize:16, fontWeight:700, cursor:"pointer",
            boxShadow:'0 8px 24px rgba(255,0,102,0.3)',
          }}>
            {copied ? '✅ Copied to clipboard!' : '📤 Share My Banger Ratio'}
          </button>
 
          <p style={{ textAlign:'center', color:'var(--gray-400)', fontSize:12, marginTop:12 }}>
            On mobile: opens your share sheet. On desktop: copies text + link.
          </p>
        </>
      )}
    </div>
  )
}
