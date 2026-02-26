'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function PublicProfilePage() {
  const { username } = useParams()
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [albums, setAlbums] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (!p) { setNotFound(true); return }
      setProfile(p)

      const { data: rats } = await supabase
        .from('ratings').select('album_id').eq('user_id', p.id)
      const ids = [...new Set((rats || []).map(r => r.album_id))]
      if (ids.length > 0) {
        const { data: albs } = await supabase
          .from('albums').select('*').in('id', ids)
          .order('banger_ratio', { ascending: false })
        setAlbums(albs || [])
      }

      if (user) {
        const { data: f } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', p.id)
          .single()
        setIsFollowing(!!f)
      }
    }
    load()
  }, [username])

  async function toggleFollow() {
    if (!currentUser) { window.location.href = '/auth'; return }
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', profile.id)
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({
        follower_id: currentUser.id,
        following_id: profile.id,
      })
      setIsFollowing(true)
    }
    setFollowLoading(false)
  }

  const initials = (profile?.display_name || profile?.username || '?')[0].toUpperCase()
  const isOwnProfile = currentUser?.id === profile?.id

  if (notFound) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 40 }}>🎵</p>
      <h2 style={{ fontSize: 22, fontWeight: 700 }}>User not found</h2>
      <p style={{ color: '#94A3B8', fontSize: 14 }}>No one goes by @{username}</p>
      <a href="/" style={{ color: '#FF0066', fontSize: 14, fontWeight: 600 }}>Go home</a>
    </div>
  )

  if (!profile) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>
  )

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 80px' }}>

      {/* Banner */}
      <div style={{
        height: 140, borderRadius: '0 0 20px 20px', marginBottom: 0,
        background: profile.banner_url
          ? `url(${profile.banner_url}) center/cover no-repeat`
          : 'linear-gradient(135deg, #FF0066 0%, #CC0052 100%)',
      }} />

      {/* Avatar + name row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -36, marginBottom: 20, padding: '0 4px' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 16,
          border: '3px solid white',
          background: profile.avatar_url
            ? `url(${profile.avatar_url}) center/cover no-repeat`
            : 'rgba(255,0,102,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 700, color: '#FF0066', flexShrink: 0,
        }}>
          {!profile.avatar_url && initials}
        </div>

        {!isOwnProfile && (
          <button onClick={toggleFollow} style={{
            padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', border: isFollowing ? '1px solid #E2E8F0' : 'none',
            background: isFollowing ? 'white' : '#FF0066',
            color: isFollowing ? '#64748B' : 'white',
            transition: 'all 0.15s',
          }}>
            {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
        {isOwnProfile && (
          <a href="/profile" style={{
            padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            border: '1px solid #E2E8F0', background: 'white', color: '#64748B',
          }}>Edit Profile</a>
        )}
      </div>

      {/* Profile info */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>
          {profile.display_name || profile.username}
        </h1>
        <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 8 }}>
          @{profile.username}{profile.location ? ' · ' + profile.location : ''}
        </p>
        {profile.bio && (
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 12 }}>
            {profile.bio}
          </p>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {profile.spotify_url && (
            <a href={profile.spotify_url} target="_blank" style={{
              padding: '5px 12px', borderRadius: 6, background: '#1DB954',
              color: 'white', fontSize: 11, fontWeight: 600,
            }}>🎵 Spotify</a>
          )}
          {profile.apple_music_url && (
            <a href={profile.apple_music_url} target="_blank" style={{
              padding: '5px 12px', borderRadius: 6, background: '#FA243C',
              color: 'white', fontSize: 11, fontWeight: 600,
            }}>🎵 Apple Music</a>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Albums Rated', value: albums.length },
          { label: 'Avg Ratio', value: albums.length
              ? (albums.reduce((s, a) => s + parseFloat(a.banger_ratio || 0), 0) / albums.length).toFixed(0) + '%'
              : '--' },
          { label: 'Top Ratio', value: albums.length
              ? Math.max(...albums.map(a => parseFloat(a.banger_ratio || 0))).toFixed(0) + '%'
              : '--' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid #E2E8F0' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#FF0066' }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rated albums */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
        {isOwnProfile ? 'Albums I\'ve Rated' : `Albums @${profile.username} has rated`}
      </h2>

      {albums.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🎵</p>
          <p style={{ color: '#94A3B8', fontSize: 14 }}>No albums rated yet.</p>
        </div>
      )}

      {albums.map(a => (
        <a key={a.id} href={`/album/${a.itunes_collection_id}`}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, marginBottom: 2, transition: 'background 0.15s' }}
          onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'}
          onMouseOut={e => e.currentTarget.style.background = ''}
        >
          {a.artwork_url && (
            <img src={a.artwork_url.replace('600x600', '80x80')} alt=""
              style={{ width: 40, height: 40, borderRadius: 6, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.name}
            </p>
            <p style={{ fontSize: 11, color: '#94A3B8' }}>{a.artist_name}</p>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#FF0066', flexShrink: 0 }}>
            {a.banger_ratio}%
          </span>
        </a>
      ))}

    </div>
  )
}
