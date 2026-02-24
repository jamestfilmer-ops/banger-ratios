'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ArtistsPage() {
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('albums')
        .select('artist_name, banger_ratio')
        .gt('total_ratings', 0)

      if (!data?.length) {
        setLoading(false)
        return
      }

      const map = {}
      data.forEach(a => {
        if (!map[a.artist_name]) map[a.artist_name] = { total: 0, count: 0 }
        map[a.artist_name].total += parseFloat(a.banger_ratio || 0)
        map[a.artist_name].count++
      })

      const ranked = Object.entries(map)
        .map(([name, stats]) => ({
          name,
          avgRatio: (stats.total / stats.count).toFixed(1),
          albumCount: stats.count
        }))
        .sort((a, b) => parseFloat(b.avgRatio) - parseFloat(a.avgRatio))

      setArtists(ranked)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p style={{ textAlign: 'center', padding: '100px 20px' }}>Loading trending artists...</p>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Trending Artists</h1>
      <p style={{ color: 'var(--gray-400)', fontSize: 14, marginBottom: 32 }}>
        Ranked by average Banger Ratio across rated albums
      </p>

      {artists.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--gray-200)', padding: 40 }}>
          No rated albums yet — start rating to see who's trending!
        </p>
      ) : (
        artists.map((a, i) => (
          <div key={a.name} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px', borderRadius: 10, marginBottom: 2,
            background: i % 2 === 0 ? 'var(--gray-100)' : 'white'
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: i < 3 ? 'var(--pink)' : 'var(--gray-200)', width: 26, textAlign: 'center' }}>
              {i + 1}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</p>
              <p style={{ fontSize: 11, color: 'var(--gray-400)' }}>{a.albumCount} album{a.albumCount !== 1 ? 's' : ''}</p>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--pink)' }}>
              {a.avgRatio}%
            </span>
          </div>
        ))
      )}
    </div>
  )
}