'use client'
 
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
 
function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--gray-200)',
      borderRadius: 14, padding: '24px 20px',
      textAlign: 'center', flex: '1 1 160px',
    }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--pink)', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--black)', marginTop: 6 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}
 
function getBadge(ratio) {
  if (ratio >= 90) return { label: '💎 Certified Classic', color: '#7B2FBE' }
  if (ratio >= 75) return { label: '🥇 Solid Gold',        color: '#B8860B' }
  if (ratio >= 60) return { label: '🎵 Hit or Miss',       color: '#2563EB' }
  if (ratio >= 40) return { label: '⚠️ Filler Warning',    color: '#D97706' }
  return              { label: '❌ Skip It',            color: '#DC2626' }
}
 
export default function DataPage() {
  const [stats, setStats]             = useState(null)
  const [topAlbums, setTopAlbums]     = useState([])
  const [controversial, setControversial] = useState([])
  const [loading, setLoading]         = useState(true)
 
  useEffect(() => {
    async function load() {
      const [
        { count: userCount },
        { count: albumCount },
        { count: ratingCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('albums').select('*',   { count: 'exact', head: true }),
        supabase.from('ratings').select('*',  { count: 'exact', head: true }),
      ])
      const avgPerUser = userCount > 0 ? (ratingCount / userCount).toFixed(1) : '0'
      setStats({ userCount, albumCount, ratingCount, avgPerUser })
 
      const { data: top } = await supabase
        .from('albums')
        .select('name, artist_name, artwork_url, total_ratings, banger_ratio')
        .order('total_ratings', { ascending: false })
        .gt('total_ratings', 0).limit(5)
      setTopAlbums(top || [])
 
      const { data: cont } = await supabase
        .from('albums')
        .select('name, artist_name, artwork_url, total_ratings, banger_ratio')
        .gte('banger_ratio', 40).lte('banger_ratio', 60)
        .order('total_ratings', { ascending: false })
        .gt('total_ratings', 0).limit(5)
      setControversial(cont || [])
      setLoading(false)
    }
    load()
  }, [])
 
  if (loading) return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ color: 'var(--gray-400)', fontSize: 15 }}>Loading data…</div>
    </div>
  )
 
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{
            background: 'var(--pink)', color: 'white', borderRadius: 8,
            padding: '4px 10px', fontSize: 11, fontWeight: 700, letterSpacing: 1,
          }}>LIVE DATA</div>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>
          Banger Ratios by the Numbers
        </h1>
        <p style={{ color: 'var(--gray-600)', fontSize: 15, maxWidth: 560, lineHeight: 1.6 }}>
          Track-by-track community quality data. The only platform that measures
          album consistency with granular ratings — not streams, not editorial picks.
        </p>
      </div>
 
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 48 }}>
        <StatCard label='Registered Users'  value={stats.userCount?.toLocaleString()}  sub='and growing' />
        <StatCard label='Albums in Database' value={stats.albumCount?.toLocaleString()} sub='from iTunes API' />
        <StatCard label='Total Ratings'      value={stats.ratingCount?.toLocaleString()} sub='individual track scores' />
        <StatCard label='Avg Ratings / User' value={stats.avgPerUser} sub='engagement depth' />
      </div>
 
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 16 }}>🔥 Most Rated Albums</h2>
        {topAlbums.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>No rated albums yet. Be the first!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topAlbums.map((album, i) => {
              const badge = getBadge(album.banger_ratio)
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'white', border: '1px solid var(--gray-200)',
                  borderRadius: 12, padding: '12px 16px',
                }}>
                  <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--gray-400)', width: 24 }}>{i+1}</span>
                  {album.artwork_url ? (
                    <img src={album.artwork_url.replace('100x100','60x60')} alt={album.name}
                      width={48} height={48} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--gray-100)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎵</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{album.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{album.artist_name}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--pink)' }}>{album.banger_ratio}%</div>
                    <div style={{ fontSize: 10, color: badge.color, fontWeight: 600, marginTop: 2 }}>{badge.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 1 }}>{album.total_ratings} ratings</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
 
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>⚡ Most Controversial Albums</h2>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 16 }}>
          Banger Ratio between 40–60% — the community is genuinely split.
        </p>
        {controversial.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>No controversial albums yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {controversial.map((album, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: '#FFFBF0', border: '1px solid #F5E6C0',
                borderRadius: 12, padding: '12px 16px',
              }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--gray-400)', width: 24 }}>{i+1}</span>
                {album.artwork_url ? (
                  <img src={album.artwork_url.replace('100x100','60x60')} alt={album.name}
                    width={48} height={48} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--gray-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎵</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{album.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{album.artist_name}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#D97706' }}>{album.banger_ratio}%</div>
                  <div style={{ fontSize: 10, color: '#D97706', fontWeight: 600, marginTop: 2 }}>⚠️ Divisive</div>
                  <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 1 }}>{album.total_ratings} ratings</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
 
      <div style={{ background: 'var(--gray-100)', borderRadius: 14, padding: '20px 24px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>How Banger Ratio is Calculated</h3>
        <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
          Users rate every track 1–7. Any track with a community average of 5.0+ is a 'banger.'
          Banger Ratio = (banger tracks ÷ total tracks) × 100. Data updates in real time.
        </p>
      </div>
    </div>
  )
}
