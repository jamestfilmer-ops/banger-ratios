'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function FriendsPage() {
  const [user, setUser] = useState(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [following, setFollowing] = useState([])
  const [followers, setFollowers] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [tab, setTab] = useState('following') // 'following' | 'followers' | 'find'

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user)
        loadFollowing(data.user.id)
        loadFollowers(data.user.id)
      }
    })
  }, [])

  async function loadFollowing(userId) {
    const { data } = await supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, username, avatar_url, bio)')
      .eq('follower_id', userId)
    setFollowing(data?.map(d => d.profiles).filter(Boolean) || [])
  }

  async function loadFollowers(userId) {
    const { data } = await supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(id, username, avatar_url, bio)')
      .eq('following_id', userId)
    setFollowers(data?.map(d => d.profiles).filter(Boolean) || [])
  }

  async function searchUsers(e) {
    e.preventDefault()
    if (!search.trim()) return
    setSearchLoading(true)
    setSearchResults([])
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .ilike('username', `%${search.trim()}%`)
      .neq('id', user?.id || '')
      .limit(20)
    setSearchResults(data || [])
    setSearchLoading(false)
  }

  async function follow(profileId) {
    if (!user) { window.location.href = '/auth'; return }
    await supabase.from('follows').insert({ follower_id: user.id, following_id: profileId })
    loadFollowing(user.id)
    // Update search results to reflect new follow state
    setSearchResults(prev => prev.map(p => p.id === profileId ? { ...p, isFollowing: true } : p))
  }

  async function unfollow(profileId) {
    await supabase.from('follows').delete()
      .eq('follower_id', user.id)
      .eq('following_id', profileId)
    loadFollowing(user.id)
    setSearchResults(prev => prev.map(p => p.id === profileId ? { ...p, isFollowing: false } : p))
  }

  function isFollowing(profileId) {
    return following.some(f => f.id === profileId)
  }

  function getInitials(username) {
    return (username || '?').slice(0, 2).toUpperCase()
  }

  function Avatar({ profile, size = 44 }) {
    return profile?.avatar_url ? (
      <img src={profile.avatar_url} alt=""
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    ) : (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'var(--pink)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontWeight: 700, fontSize: size * 0.35,
        color: 'white', letterSpacing: 0.5,
      }}>
        {getInitials(profile?.username)}
      </div>
    )
  }

  function UserCard({ profile, showUnfollow = false }) {
    const alreadyFollowing = isFollowing(profile.id)
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 10,
        border: '1px solid var(--gray-200)',
        background: 'white', marginBottom: 8,
      }}>
        <Avatar profile={profile} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--black)' }}>
            @{profile.username}
          </p>
          {profile.bio && (
            <p style={{ fontSize: 12, color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.bio}
            </p>
          )}
        </div>
        {user && (
          alreadyFollowing || (showUnfollow && isFollowing(profile.id)) ? (
            <button onClick={() => unfollow(profile.id)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'var(--gray-100)', border: '1px solid var(--gray-200)',
              color: 'var(--gray-600)', cursor: 'pointer', flexShrink: 0,
            }}>Following</button>
          ) : (
            <button onClick={() => follow(profile.id)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'var(--pink)', border: 'none',
              color: 'white', cursor: 'pointer', flexShrink: 0,
            }}>Follow</button>
          )
        )}
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>👥</p>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Sign in to see your friends</h2>
          <p style={{ color: 'var(--gray-400)', fontSize: 14, marginBottom: 24 }}>
            Follow people and see what they're rating.
          </p>
          <a href="/auth" style={{
            display: 'inline-block', padding: '10px 28px', borderRadius: 10,
            background: 'var(--pink)', color: 'white', fontWeight: 600, fontSize: 14,
          }}>Sign In</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px' }}>

        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 6 }}>Friends</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14, marginBottom: 28 }}>
          Follow people to see what they're rating.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--gray-200)', paddingBottom: 0 }}>
          {[
            { key: 'following', label: `Following (${following.length})` },
            { key: 'followers', label: `Followers (${followers.length})` },
            { key: 'find',      label: 'Find People' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 16px', borderRadius: '8px 8px 0 0', fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t.key ? 'var(--pink)' : 'var(--gray-600)',
              borderBottom: tab === t.key ? '2px solid var(--pink)' : '2px solid transparent',
              marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Following tab */}
        {tab === 'following' && (
          <div>
            {following.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>🎵</p>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>You're not following anyone yet</p>
                <p style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 20 }}>
                  Find people with great taste and follow them.
                </p>
                <button onClick={() => setTab('find')} style={{
                  padding: '9px 22px', borderRadius: 10, background: 'var(--pink)',
                  border: 'none', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}>Find People</button>
              </div>
            ) : (
              following.map(p => <UserCard key={p.id} profile={p} showUnfollow />)
            )}
          </div>
        )}

        {/* Followers tab */}
        {tab === 'followers' && (
          <div>
            {followers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>👤</p>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>No followers yet</p>
                <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                  Share your profile to get people following you.
                </p>
              </div>
            ) : (
              followers.map(p => <UserCard key={p.id} profile={p} />)
            )}
          </div>
        )}

        {/* Find People tab */}
        {tab === 'find' && (
          <div>
            <form onSubmit={searchUsers} style={{
              display: 'flex', gap: 8, marginBottom: 20,
            }}>
              <input
                type="text"
                placeholder="Search by username..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: 10,
                  border: '1px solid var(--gray-200)', fontSize: 14,
                  outline: 'none', color: 'var(--black)',
                }}
              />
              <button type="submit" style={{
                padding: '11px 20px', borderRadius: 10, background: 'var(--pink)',
                border: 'none', color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>
                {searchLoading ? '...' : 'Search'}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div>
                {searchResults.map(p => <UserCard key={p.id} profile={p} />)}
              </div>
            )}

            {searchResults.length === 0 && search && !searchLoading && (
              <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>
                No users found for "{search}"
              </p>
            )}

            {!search && (
              <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>
                Search for a username to find people to follow.
              </p>
            )}
          </div>
        )}

      </main>
    </div>
  )
}