// FILE: src/app/profile/page.js
// Cmd+A → Delete → Paste
// This is YOUR profile (logged-in user). Public profiles are at /profile/[username]

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '../components/Toast'
import { ProfileSkeleton } from '../components/Skeleton'

function getBadge(ratio) {
  if (ratio >= 90) return '💎 Certified Classic'
  if (ratio >= 75) return '🥇 Solid Gold'
  if (ratio >= 60) return '🎵 Hit or Miss'
  if (ratio >= 40) return '⚠️ Filler Warning'
  return '❌ Skip It'
}

export default function ProfilePage() {
  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)
  const [ratedAlbums, setRatedAlbums] = useState([])
  const [stats, setStats]         = useState({ total: 0, avg: 0, topGenre: '' })
  const [loading, setLoading]     = useState(true)
  const toast = useToast()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { setLoading(false); return }
    setUser(u)

    const [prof, albums] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', u.id).single(),
      loadRatedAlbums(u.id),
    ])

    setProfile(prof.data)
    setLoading(false)
  }

  async function loadRatedAlbums(userId) {
    const { data } = await supabase
      .from('ratings')
      .select(`
        score, created_at,
        tracks!ratings_track_id_fkey(
          albums!tracks_album_id_fkey(id, name, artist_name, artwork_url, banger_ratio, total_ratings, itunes_collection_id, genre)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!data) return []

    // Deduplicate by album, compute stats
    const seen = new Set()
    const albums = []
    let totalScore = 0
    let count = 0
    const genreCount = {}

    for (const r of data) {
      const album = r.tracks?.albums
      if (!album) continue
      totalScore += r.score
      count++
      if (album.genre) genreCount[album.genre] = (genreCount[album.genre] || 0) + 1

      if (!seen.has(album.id)) {
        seen.add(album.id)
        albums.push(album)
      }
    }

    const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
    setStats({ total: count, avg: count > 0 ? (totalScore / count).toFixed(1) : 0, topGenre })
    setRatedAlbums(albums)
    return albums
  }

  if (loading) {
    return <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}><ProfileSkeleton /></div>
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🎵</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>Sign in to see your profile</h1>
        <a href="/auth" style={{
          display: 'inline-block', padding: '12px 28px', background: 'var(--pink)',
          color: 'white', borderRadius: 10, fontWeight: 600,
        }}>Sign In</a>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 0 80px' }}>

      {/* Banner */}
      <div style={{
        height: 140, borderRadius: '0 0 16px 16px',
        background: profile?.banner_url
          ? `url(${profile.banner_url}) center/cover`
          : 'linear-gradient(135deg, #FF0066 0%, #CC0052 100%)',
      }} />

      <div style={{ padding: '0 24px' }}>
        {/* Avatar + actions row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -36, marginBottom: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            border: '3px solid white',
            background: profile?.avatar_url ? `url(${profile.avatar_url}) center/cover` : 'var(--pink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 26,
          }}>
            {!profile?.avatar_url && (profile?.username?.[0] || user?.email?.[0] || '?').toUpperCase()}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`/profile/${profile?.username}`} style={{
              padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600,
              background: 'var(--bg-soft)', color: 'var(--black)', border: '1px solid var(--border)',
            }}>Public View</a>
            <a href="/settings" style={{
              padding: '9px 22px', borderRadius: 9, fontSize: 14, fontWeight: 600,
              background: 'var(--pink)', color: 'white',
            }}>Edit Profile</a>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>
          {profile?.display_name || profile?.username || 'My Profile'}
        </h1>
        {profile?.username && <p style={{ fontSize: 13, color: 'var(--gray-text)', marginBottom: 6 }}>@{profile.username}</p>}
        {profile?.bio && <p style={{ fontSize: 14, marginBottom: 16 }}>{profile.bio}</p>}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 28, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700 }}>{ratedAlbums.length}</p>
            <p style={{ fontSize: 11, color: 'var(--gray-text)', textTransform: 'uppercase', letterSpacing: 1 }}>Albums Rated</p>
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700 }}>{stats.total}</p>
            <p style={{ fontSize: 11, color: 'var(--gray-text)', textTransform: 'uppercase', letterSpacing: 1 }}>Track Ratings</p>
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700 }}>{stats.avg || '—'}</p>
            <p style={{ fontSize: 11, color: 'var(--gray-text)', textTransform: 'uppercase', letterSpacing: 1 }}>Avg Score</p>
          </div>
          {stats.topGenre && (
            <div>
              <p style={{ fontSize: 22, fontWeight: 700 }}>{stats.topGenre}</p>
              <p style={{ fontSize: 11, color: 'var(--gray-text)', textTransform: 'uppercase', letterSpacing: 1 }}>Top Genre</p>
            </div>
          )}
        </div>

        {/* Rated Albums */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Albums You've Rated</h2>

        {ratedAlbums.length === 0 ? (
          /* ─ Empty State That Converts ─ */
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            background: 'white', borderRadius: 16, border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>🎵</p>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Your taste is a mystery.</h3>
            <p style={{ color: 'var(--gray-text)', marginBottom: 24, fontSize: 14 }}>
              Rate your first album to start building your profile.
            </p>
            <a href="/" style={{
              display: 'inline-block', padding: '12px 28px',
              background: 'var(--pink)', color: 'white',
              borderRadius: 10, fontWeight: 600, fontSize: 15,
            }}>Search Albums to Rate →</a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {ratedAlbums.map(a => (
              <a key={a.id} href={`/album/${a.itunes_collection_id}`}
                style={{
                  borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)',
                  display: 'block', background: 'white', transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
                onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
              >
                {a.artwork_url ? (
                  <img src={a.artwork_url.replace('600x600', '300x300')} alt=""
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎵</div>
                )}
                <div style={{ padding: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                    {a.name}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--gray-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.artist_name}
                  </p>
                  {a.banger_ratio > 0 && (
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--pink)', marginTop: 3 }}>
                      {a.banger_ratio}%
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}