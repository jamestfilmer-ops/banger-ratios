// FILE: src/app/leaderboards/page.js
// Cmd+A → Delete → Paste
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ArtistPanel from '@/app/components/ArtistPanel'
 
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
 
export default function LeaderboardsPage() {
  const [albums, setAlbums]         = useState([])
  const [filter, setFilter]         = useState('all')
  const [loading, setLoading]       = useState(true)
  const [selectedArtist, setSelectedArtist] = useState(null)
  useEffect(() => { load() }, [])
 
  async function load() {
    const { data } = await supabase
      .from('albums')
      .select('*')
      .gt('total_ratings', 0)
      .order('banger_ratio', { ascending: false })
    setAlbums(data || [])
    setLoading(false)
  }
 
  const filtered = filter === 'all' ? albums
    : albums.filter(a => {
        const badge = getBadge(a.banger_ratio)
        return badge.label.toLowerCase().includes(filter)
      })
 
  if (loading) return <div style={{ padding:60,textAlign:'center',color:'var(--gray-text)' }}>Loading...</div>
 
  return (
    <div style={{ maxWidth:900,margin:'0 auto',padding:'32px 24px 80px' }}>
      <h1 style={{ fontSize:28,fontWeight:700,marginBottom:6 }}>🏆 Leaderboard</h1>
      <p style={{ color:'var(--gray-text)',fontSize:14,marginBottom:24 }}>
        Albums ranked by Banger Ratio. Click an artist to see more.
      </p>
 
      {/* Filter pills */}
      <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginBottom:24 }}>
        {['all','banger','gold','hits','mixed','skip'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'6px 14px',borderRadius:20,border:'1px solid var(--border)',
            background: filter===f ? 'var(--pink)' : 'white',
            color: filter===f ? 'white' : 'var(--gray-text)',
            fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'inherit',
            textTransform:'capitalize'
          }}>{f === 'all' ? 'All' : f}</button>
        ))}
      </div>
 
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        {filtered.map((a, i) => {
          const badge = getBadge(a.banger_ratio || 0)
          return (
            <div key={a.id} style={{
              display:'flex',alignItems:'center',gap:14,
              background:'white',borderRadius:14,border:'1px solid var(--border)',
              padding:'12px 16px',
            }}>
              <span style={{ fontSize:12,fontWeight:700,color:'var(--gray-text)',width:24,textAlign:'right',flexShrink:0 }}>
                {i+1}
              </span>
              <img
                src={a.artwork_url?.replace('600x600','80x80')}
                alt={a.name}
                style={{ width:48,height:48,borderRadius:8,objectFit:'cover',flexShrink:0 }}
              />
              <div style={{ flex:1,minWidth:0 }}>
                <a href={`/album/${a.itunes_collection_id}`} style={{ fontWeight:700,fontSize:14,color:'var(--black)',textDecoration:'none' }}>
                  {a.name}
                </a>
                <p style={{ fontSize:12,marginTop:2 }}>
                  <span
                    onClick={e => { e.preventDefault(); setSelectedArtist(a.artist_name) }}
                    style={{
                      cursor:'pointer',color:'var(--gray-text)',
                      textDecoration:'underline',textDecorationStyle:'dotted'
                    }}
                  >
                    {a.artist_name}
                  </span>
                  <span style={{ color:'var(--gray-text)',marginLeft:6 }}>· {a.total_ratings} ratings</span>
                </p>
              </div>
              <div style={{ textAlign:'right',flexShrink:0 }}>
                <p style={{ fontSize:22,fontWeight:800,color:'var(--pink)',marginBottom:2 }}>
                  {Math.max(5, a.banger_ratio || 0)}%
                </p>
                <span style={{ fontSize:11,fontWeight:600,color:'var(--pink)',
                  background:'rgba(255,0,102,0.08)',padding:'2px 8px',borderRadius:6 }}>
                  {badge.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
 
      <ArtistPanel
        artist={selectedArtist}
        albums={albums}
        onClose={() => setSelectedArtist(null)}
      />
    </div>
  )
}
