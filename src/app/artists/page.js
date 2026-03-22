// FILE: src/app/artists/page.js
// Cmd+A → Delete → Paste
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

function artFix(url) {
  if (!url) return null
  return url.replace('100x100bb','300x300bb').replace('600x600bb','300x300bb').replace('100x100','300x300')
}

function ratioColor(r) {
  if (r >= 90) return '#00B84D'
  if (r >= 75) return '#FF9500'
  return 'var(--pink)'
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('albums')
      .select('artist_name, artwork_url, banger_ratio, total_ratings, name, itunes_collection_id')
      .gt('total_ratings', 0)
      .order('banger_ratio', { ascending: false })
    if (!data) { setLoading(false); return }

    const byArtist = {}
    data.forEach(album => {
      const key = album.artist_name
      if (!byArtist[key]) {
        byArtist[key] = {
          name: key,
          topArtwork: album.artwork_url,
          topAlbumId: album.itunes_collection_id,
          albums: [],
          totalRatings: 0,
          totalRatio: 0,
        }
      }
      byArtist[key].albums.push(album)
      byArtist[key].totalRatings += (album.total_ratings || 0)
      byArtist[key].totalRatio += parseFloat(album.banger_ratio || 0)
    })

    const sorted = Object.values(byArtist)
      .map(a => ({ ...a, avgRatio: parseFloat((a.totalRatio / a.albums.length).toFixed(1)) }))
      .sort((a, b) => b.avgRatio - a.avgRatio)

    setArtists(sorted)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ maxWidth:900, margin:'60px auto', padding:'0 24px', textAlign:'center' }}>
      <p style={{ color:'var(--gray-text)' }}>Loading artists...</p>
    </div>
  )

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px 80px' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:28, fontWeight:700, marginBottom:4 }}>Artists</h1>
        <p style={{ color:'var(--gray-text)', fontSize:14 }}>
          Ranked by average Banger Ratio across all rated albums
        </p>
      </div>

      <div style={{ display:'grid', gap:8 }}>
        {artists.map((artist, i) => (
          <a
            key={artist.name}
            href={`/albums?artist=${encodeURIComponent(artist.name)}`}
            style={{
              display:'flex', alignItems:'center', gap:16,
              background:'white', borderRadius:12,
              border: i < 3 ? '1px solid rgba(255,0,102,0.15)' : '1px solid var(--border)',
              background: i < 3 ? 'rgba(255,0,102,0.02)' : 'white',
              padding:'12px 16px',
              textDecoration:'none', color:'inherit',
              transition:'transform 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateX(3px)'}
            onMouseOut={e => e.currentTarget.style.transform = ''}
          >
            {/* Rank */}
            <span style={{
              fontSize:13, fontWeight:700, color:'var(--gray-text)',
              width:24, textAlign:'right', flexShrink:0,
            }}>{i + 1}</span>

            {/* Avatar — circular album art */}
            <div style={{
              width:52, height:52, borderRadius:'50%', flexShrink:0,
              overflow:'hidden', background:'#f0f0f0',
              display:'flex', alignItems:'center', justifyContent:'center',
              border: i < 3 ? '2px solid var(--pink)' : '2px solid var(--border)',
            }}>
              {artFix(artist.topArtwork)
                ? <img
                    src={artFix(artist.topArtwork)}
                    alt={artist.name}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                : <span style={{ fontSize:'1.2rem', color:'var(--gray-text)' }}>♪</span>
              }
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{artist.name}</div>
              <div style={{ fontSize:12, color:'var(--gray-text)' }}>
                {artist.albums.length} album{artist.albums.length !== 1 ? 's' : ''} rated
                {' · '}{artist.totalRatings} total ratings
              </div>
            </div>

            {/* Ratio */}
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontWeight:800, fontSize:18, color: ratioColor(artist.avgRatio) }}>
                {artist.avgRatio}%
              </div>
              <div style={{ fontSize:11, color:'var(--gray-text)' }}>avg ratio</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
