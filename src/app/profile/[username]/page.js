// FILE: src/app/profile/[username]/page.js
// Cmd+A → Delete → Paste

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '../../components/Toast'

function getBadgeLabel(ratio) {
  if (ratio >= 90) return 'Classic'
  if (ratio >= 75) return 'Gold'
  if (ratio >= 60) return 'Hit'
  if (ratio >= 40) return 'Filler'
  return 'Skip'
}

function getBadgeColor(ratio) {
  if (ratio >= 90) return '#7C3AED'
  if (ratio >= 75) return '#D97706'
  if (ratio >= 60) return '#059669'
  if (ratio >= 40) return '#6B7280'
  return '#DC2626'
}

export default function PublicProfilePage() {
  const { username } = useParams()
  const [profile, setProfile]         = useState(null)
  const [ratedAlbums, setRatedAlbums] = useState([])
  const [me, setMe]                   = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [compatibility, setCompatibility] = useState(null)
  const [taste, setTaste]             = useState(null)
  const [loading, setLoading]         = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [notFound, setNotFound]       = useState(false)
  const toast = useToast()

  useEffect(() => { init() }, [username])

  async function init() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setMe(user || null)

    const { data: prof } = await supabase
      .from('profiles').select('*').eq('username', username).single()

    if (!prof) { setNotFound(true); setLoading(false); return }
    setProfile(prof)

    await Promise.all([
      loadRatedAlbums(prof.id),
      loadTasteProfile(prof.id),
      user && loadFollowStatus(user.id, prof.id),
      user && user.id !== prof.id && loadCompatibility(user.id, prof.id),
    ])
    setLoading(false)
  }

  async function loadRatedAlbums(profileId) {
    const { data } = await supabase
      .from('ratings')
      .select(`score, created_at, tracks!ratings_track_id_fkey(albums!tracks_album_id_fkey(id, name, artist_name, artwork_url, banger_ratio, total_ratings, itunes_collection_id))`)
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })

    if (!data) return
    const seen = new Set()
    const albums = []
    for (const r of data) {
      const album = r.tracks?.albums
      if (!album || seen.has(album.id)) continue
      seen.add(album.id)
      albums.push(album)
    }
    setRatedAlbums(albums.slice(0, 24))
  }

  async function loadTasteProfile(profileId) {
    const { data } = await supabase
      .from('ratings')
      .select('score, tracks!ratings_track_id_fkey(albums!tracks_album_id_fkey(genre, artist_name))')
      .eq('user_id', profileId)

    if (!data?.length) return
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 }
    let genreCount = {}, artistCount = {}
    data.forEach(r => {
      dist[r.score] = (dist[r.score] || 0) + 1
      const album = r.tracks?.albums
      if (album?.genre) genreCount[album.genre] = (genreCount[album.genre] || 0) + 1
      if (album?.artist_name) artistCount[album.artist_name] = (artistCount[album.artist_name] || 0) + 1
    })
    const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0]
    const topArtist = Object.entries(artistCount).sort((a, b) => b[1] - a[1])[0]?.[0]
    const avg = (data.reduce((s, r) => s + r.score, 0) / data.length).toFixed(1)
    const scoreType = avg >= 5 ? 'Generous' : avg <= 3 ? 'Harsh' : 'Balanced'
    setTaste({ dist, topGenre, topArtist, avg, scoreType, total: data.length })
  }

  async function loadFollowStatus(myId, theirId) {
    const { data } = await supabase.from('follows').select('id').eq('follower_id', myId).eq('following_id', theirId).maybeSingle()
    setIsFollowing(!!data)
  }

  async function loadCompatibility(myId, theirId) {
    const [{ data: mine }, { data: theirs }] = await Promise.all([
      supabase.from('ratings').select('track_id, score').eq('user_id', myId),
      supabase.from('ratings').select('track_id, score').eq('user_id', theirId),
    ])
    if (!mine?.length || !theirs?.length) return
    const myMap = {}; mine.forEach(r => myMap[r.track_id] = r.score)
    const theirMap = {}; theirs.forEach(r => theirMap[r.track_id] = r.score)
    const shared = Object.keys(myMap).filter(id => theirMap[id])
    if (shared.length < 3) return
    const agreements = shared.map(id => 1 - Math.abs(myMap[id] - theirMap[id]) / 6)
    setCompatibility(Math.round((agreements.reduce((a, b) => a + b, 0) / agreements.length) * 100))
  }

  async function toggleFollow() {
    if (!me) { toast('Sign in to follow people.', 'info'); return }
    setFollowLoading(true)
    if (isFollowing) {
      const { error } = await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', profile.id)
      if (!error) { setIsFollowing(false); toast('Unfollowed.', 'info') }
      else toast('Failed to unfollow.', 'error')
    } else {
      const { error } = await supabase.from('follows').insert({ follower_id: me.id, following_id: profile.id })
      if (!error) { setIsFollowing(true); toast(`Following @${profile.username}`, 'success') }
      else toast('Failed to follow.', 'error')
    }
    setFollowLoading(false)
  }

  const isOwnProfile = me?.id === profile?.id

  if (loading) {
    return (
      <div style={{ maxWidth: 740, margin: '0 auto' }}>
        <div style={{ height: 160, background: 'linear-gradient(135deg, #FF0066, #CC0052)' }} />
        <div style={{ padding: '0 24px', marginTop: 16 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0f0f0', marginBottom: 16 }} />
          <div style={{ height: 22, background: '#f0f0f0', borderRadius: 6, width: 200, marginBottom: 10 }} />
          <div style={{ height: 14, background: '#f0f0f0', borderRadius: 6, width: 120 }} />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>User not found</p>
        <p style={{ color: 'var(--gray-text)', marginBottom: 24 }}>@{username} does not exist.</p>
        <a href="/" style={{ color: 'var(--pink)', fontWeight: 600 }}>Back to home</a>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', paddingBottom: 80 }}>

      {/* ── Banner ─────────────────────────────────────────────── */}
      <div style={{
        height: 160,
        background: profile.banner_url
          ? `url(${profile.banner_url}) center/cover no-repeat`
          : 'linear-gradient(135deg, #FF0066 0%, #CC0052 100%)',
      }} />

      {/* ── Avatar row — overlaps banner by 36px ──────────────── */}
      <div style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -40, marginBottom: 16 }}>

          {/* Avatar — overlaps banner */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            border: '3px solid white',
            background: profile.avatar_url
              ? `url(${profile.avatar_url}) center/cover`
              : 'var(--pink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 28,
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            flexShrink: 0,
          }}>
            {!profile.avatar_url && (profile.username?.[0] || '?').toUpperCase()}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
            {!isOwnProfile && (
              <button onClick={toggleFollow} disabled={followLoading} style={{
                padding: '9px 22px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                background: isFollowing ? 'white' : 'var(--pink)',
                color: isFollowing ? 'var(--gray-text)' : 'white',
                border: isFollowing ? '1.5px solid var(--border)' : 'none',
                opacity: followLoading ? 0.6 : 1,
              }}>
                {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            {isOwnProfile && (
              <a href="/settings" style={{
                padding: '9px 22px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: 'var(--bg-soft)', color: 'var(--black)', border: '1px solid var(--border)',
              }}>Edit Profile</a>
            )}
          </div>
        </div>

        {/* Name + username */}
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>
          {profile.display_name || profile.username}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--gray-text)', marginBottom: profile.bio ? 8 : 16 }}>
          @{profile.username}
        </p>
        {profile.bio && <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>{profile.bio}</p>}

        {/* Compatibility pill */}
        {compatibility !== null && !isOwnProfile && (
          <div style={{
            display: 'inline-block', background: 'rgba(255,0,102,0.07)',
            border: '1px solid rgba(255,0,102,0.2)', borderRadius: 20,
            padding: '4px 14px', marginBottom: 20, fontSize: 13, fontWeight: 600, color: 'var(--pink)',
          }}>
            Taste match: {compatibility}%
          </div>
        )}

        {/* Stats row */}
        {taste && (
          <div style={{ display: 'flex', gap: 28, marginBottom: 24, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {[
              { n: taste.total, label: 'Track Ratings' },
              { n: taste.avg,   label: 'Avg Score' },
              { n: taste.scoreType, label: 'Listener Type' },
              taste.topGenre  && { n: taste.topGenre,  label: 'Top Genre' },
              taste.topArtist && { n: taste.topArtist, label: 'Top Artist' },
            ].filter(Boolean).map(({ n, label }) => (
              <div key={label}>
                <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{n}</p>
                <p style={{ fontSize: 11, color: 'var(--gray-text)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Score distribution */}
        {taste && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-text)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Score Distribution</p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 56 }}>
              {[1,2,3,4,5,6,7].map(n => {
                const count = taste.dist[n] || 0
                const max = Math.max(...Object.values(taste.dist), 1)
                return (
                  <div key={n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{
                      width: '100%', height: `${Math.max((count / max) * 100, 4)}%`,
                      borderRadius: '4px 4px 0 0',
                      background: n >= 5 ? 'var(--pink)' : '#e5e7eb',
                    }} />
                    <span style={{ fontSize: 11, color: 'var(--gray-text)', fontWeight: 500 }}>{n}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Albums grid */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Albums Rated ({ratedAlbums.length})</h2>

        {ratedAlbums.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>No albums rated yet</p>
            <p style={{ color: 'var(--gray-text)', fontSize: 14 }}>
              {isOwnProfile ? 'Search for an album to get started.' : 'This user has not rated any albums yet.'}
            </p>
            {isOwnProfile && (
              <a href="/" style={{ display: 'inline-block', marginTop: 12, padding: '9px 22px', background: 'var(--pink)', color: 'white', borderRadius: 9, fontWeight: 600, fontSize: 14 }}>
                Find Albums to Rate
              </a>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {ratedAlbums.map(a => (
              <a key={a.id} href={`/album/${a.itunes_collection_id}`}
                style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', display: 'block', background: 'white', transition: 'all 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
                onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
              >
                {a.artwork_url
                  ? <img src={a.artwork_url.replace('600x600','300x300')} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', aspectRatio: '1', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'var(--gray-text)' }}>♪</div>
                }
                <div style={{ padding: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{a.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--gray-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.artist_name}</p>
                  {a.banger_ratio > 0 && (
                    <p style={{ fontSize: 12, fontWeight: 700, marginTop: 3, color: getBadgeColor(a.banger_ratio) }}>
                      {a.banger_ratio}% <span style={{ fontSize: 10, fontWeight: 600 }}>{getBadgeLabel(a.banger_ratio)}</span>
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