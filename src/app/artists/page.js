// FILE: src/app/artists/page.js
// Cmd+A → Delete → Paste
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
 
export default function ArtistsPage() {
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { load() }, [])
 
  async function load() {
    const { data } = await supabase
      .from('albums')
      .select('artist_name, artwork_url, banger_ratio, total_ratings, name, id')
      .gt('total_ratings', 0)
      .order('banger_ratio', { ascending: false })
    if (!data) { setLoading(false); return }
    const byArtist = {}
    data.forEach(album => {
      const key = album.artist_name
      if (!byArtist[key]) {
        byArtist[key] = { name: key, topArtwork: album.artwork_url, albums: [] }
      }
      byArtist[key].albums.push(album)
    })
    const sorted = Object.values(byArtist)
      .sort((a,b) => b.albums[0].banger_ratio - a.albums[0].banger_ratio)
    setArtists(sorted)
    setLoading(false)
  }
 
  if (loading) return (
    <div style={{ maxWidth:900,margin:'60px auto',padding:'0 24px',textAlign:'center' }}>
      <p style={{ color:'var(--gray-text)' }}>Loading artists...</p>
    </div>
  )
 
  return (
    <div style={{ maxWidth:900,margin:'0 auto',padding:'32px 24px 80px' }}>
      <h1 style={{ fontSize:28,fontWeight:700,marginBottom:6 }}>Artists</h1>
      <p style={{ color:'var(--gray-text)',fontSize:14,marginBottom:28 }}>
        Ranked by top album's Banger Ratio
      </p>
      <div style={{ display:'grid',gap:12 }}>
        {artists.map((artist, i) => (
          <div key={artist.name} style={{
            display:'flex',alignItems:'center',gap:16,
            background:'white',borderRadius:14,border:'1px solid var(--border)',
            padding:'14px 18px'
          }}>
            <span style={{ fontSize:13,fontWeight:700,color:'var(--gray-text)',width:24,textAlign:'right',flexShrink:0 }}>
              {i+1}
            </span>
            <img
              src={artist.topArtwork?.replace('600x600','300x300') || artist.topArtwork}
              alt={artist.name}
              style={{ width:52,height:52,borderRadius:'50%',objectFit:'cover',border:'2px solid var(--pink)',flexShrink:0 }}
            />
            <div style={{ flex:1,minWidth:0 }}>
              <p style={{ fontWeight:700,fontSize:15,marginBottom:2 }}>{artist.name}</p>
              <p style={{ fontSize:12,color:'var(--gray-text)' }}>
                {artist.albums.length} album{artist.albums.length!==1?'s':''} rated
              </p>
            </div>
            <span style={{ fontSize:20,fontWeight:800,color:'var(--pink)',flexShrink:0 }}>
              {artist.albums[0].banger_ratio}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
