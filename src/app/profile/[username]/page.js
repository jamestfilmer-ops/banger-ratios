// ============================================================
// FILE: src/app/profile/[username]/page.js
// WHAT: Public profile page — viewable by anyone at /profile/jamestfilmer
// HOW:
//   1. In Terminal: mkdir -p ~/Desktop/banger-ratios/src/app/profile/\[username\]
//   2. Create file: src/app/profile/[username]/page.js
//   3. Cmd+A → Delete → Paste this → Save → git push
// FEATURES:
//   • Shows avatar, display name, bio, location
//   • Lists albums they've rated with Banger Ratios
//   • Follow / Unfollow button
//   • Taste Compatibility Score with logged-in user
// ============================================================

'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function PublicProfilePage() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [albums, setAlbums] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [compatibility, setCompatibility] = useState(null)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => { load() }, [username])

  async function load() {
    setLoading(true)

    // Get current logged-in user
    const { data: { user: me } } = await supabase.auth.getUser()
    setCurrentUser(me || null)

    // Find the profile by username
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (!p) { setNotFound(true); setLoading(false); return }
    setProfile(p)

    // Get their rated albums
    const { data: rats } = await supabase
      .from('ratings')
      .select('album_id')
      .eq('user_id', p.id)
    const ids = [...new Set((rats || []).map(r => r.album_id))]
    if (ids.length > 0) {
      const { data: albumData } = await supabase
        .from('albums').select('*').in('id', ids).order('banger_ratio', { ascending: false })
      setAlbums(albumData || [])
    }

    // Follower / following counts
    const [{ count: fc }, { count: fwc }] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', p.id),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', p.id),
    ])
    setFollowerCount(fc || 0)
    setFollowingCount(fwc || 0)

    // Is current user following this profile?
    if (me) {
      const { data: fol } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', me.id)
        .eq('following_id', p.id)
        .single()
      setIsFollowing(!!fol)

      // Taste compatibility score
      if (me.id !== p.id) {
        const compat = await calcCompatibility(me.id, p.id)
        setCompatibility(compat)
      }
    }

    setLoading(false)
  }

  async function calcCompatibility(userA, userB) {
    // Get all ratings from both users
    const [{ data: ratA }, { data: ratB }] = await Promise.all([
      supabase.from('ratings').select('track_id, score').eq('user_id', userA),
      supabase.from('ratings').select('track_id, score').eq('user_id', userB),
    ])
    if (!ratA?.length || !ratB?.length) return null

    const mapA = {}; ratA.forEach(r => mapA[r.track_id] = r.score)
    const mapB = {}; ratB.forEach(r => mapB[r.track_id] = r.score)

    // Find shared tracks
    const shared = Object.keys(mapA).filter(id => mapB[id] !== undefined)
    if (shared.length < 3) return null // Need at least 3 shared to be meaningful

    const avgDiff = shared.reduce((sum, id) => sum + Math.abs(mapA[id] - mapB[id]), 0) / shared.length
    const score = Math.round((1 - avgDiff / 6) * 100)
    return { score, sharedAlbums: shared.length }
  }

  async function handleFollow() {
    if (!currentUser) { window.location.href = '/auth'; return }
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', profile.id)
      setIsFollowing(false)
      setFollowerCount(c => c - 1)
    } else {
      await supabase.from('follows').insert({
        follower_id: currentUser.id,
        following_id: profile.id,
      })
      setIsFollowing(true)
      setFollowerCount(c => c + 1)
    }
    setFollowLoading(false)
  }

  if (loading) return (
    <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--gray-400)' }}>
      Loading profile...
    </div>
  )

  if (notFound) return (
    <div style={{ padding: '80px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 48, marginBottom: 12 }}>🤷</p>
      <p style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Profile not found</p>
      <p style={{ color: 'var(--gray-400)', marginBottom: 24 }}>@{username} doesn't exist yet.</p>
      <a href="/" style={{ color: 'var(--pink)', fontWeight: 600 }}>← Back to home</a>
    </div>
  )

  const initials = (profile.display_name || profile.username || '?')[0].toUpperCase()
  const isOwnProfile = currentUser?.id === profile.id

  function compatColor(score) {
    if (score >= 80) return '#16A34A'
    if (score >= 60) return 'var(--pink)'
    return 'var(--gray-400)'
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>

      {/* Banner */}
      {profile.banner_url && (
        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: -50, height: 140 }}>
          <img src={profile.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Avatar + header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, paddingTop: profile.banner_url ? 0 : 0 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: profile.avatar_url ? 'transparent' : 'var(--pink)',
          border: '3px solid white', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ color: 'white', fontSize: 28, fontWeight: 700 }}>{initials}</span>
          }
        </div>

        {!isOwnProfile && currentUser && (
          <button onClick={handleFollow} disabled={followLoading} style={{
            padding: '9px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
            background: isFollowing ? 'var(--gray-200)' : 'var(--pink)',
            color: isFollowing ? 'var(--gray-600)' : 'white',
            transition: 'all 0.15s',
          }}>
            {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
          </button>
        )}

        {isOwnProfile && (
          <a href="/profile" style={{
            padding: '9px 22px', borderRadius: 10, border: '1px solid var(--gray-200)',
            fontSize: 13, fontWeight: 600, color: 'var(--gray-600)',
          }}>Edit Profile</a>
        )}
      </div>

      {/* Name & bio */}
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 2px' }}>
        {profile.display_name || profile.username}
      </h1>
      <p style={{ color: 'var(--gray-400)', fontSize: 14, marginBottom: 6 }}>@{profile.username}</p>
      {profile.bio && (
        <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 8 }}>{profile.bio}</p>
      )}
      {profile.location && (
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 16 }}>📍 {profile.location}</p>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>{albums.length}</span>
          <span style={{ color: 'var(--gray-400)', fontSize: 12, marginLeft: 4 }}>albums rated</span>
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>{followerCount}</span>
          <span style={{ color: 'var(--gray-400)', fontSize: 12, marginLeft: 4 }}>followers</span>
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>{followingCount}</span>
          <span style={{ color: 'var(--gray-400)', fontSize: 12, marginLeft: 4 }}>following</span>
        </div>
      </div>

      {/* Taste compatibility — only shown when viewing someone else's profile */}
      {compatibility && !isOwnProfile && (
        <div style={{
          background: 'rgba(255,0,102,0.05)', border: '1px solid rgba(255,0,102,0.15)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: compatColor(compatibility.score) }}>
            {compatibility.score}%
          </span>
          <div>
            <p style={{ fontWeight: 600, fontSize: 13 }}>Taste Compatibility</p>
            <p style={{ color: 'var(--gray-400)', fontSize: 12 }}>
              Based on {compatibility.sharedAlbums} shared album{compatibility.sharedAlbums !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Their rated albums */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        🎵 Albums Rated
      </h2>

      {albums.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray-400)' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🎵</p>
          <p>@{profile.username} hasn't rated any albums yet.</p>
        </div>
      ) : (
        albums.map(a => (
          <a key={a.id} href={`/album/${a.itunes_collection_id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px', borderRadius: 10, marginBottom: 4,
              transition: 'background 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--gray-100)'}
            onMouseOut={e => e.currentTarget.style.background = ''}
          >
            {a.artwork_url && (
              <img src={a.artwork_url.replace('600x600','100x100')} alt=""
                style={{ width: 44, height: 44, borderRadius: 8 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.name}
              </p>
              <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>{a.artist_name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--pink)' }}>{a.banger_ratio}%</p>
            </div>
          </a>
        ))
      )}
    </div>
  )
}