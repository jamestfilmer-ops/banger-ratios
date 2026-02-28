'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '../components/ToastContext'

export default function FriendsPage() {
  const [user, setUser]             = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [following, setFollowing]   = useState([])
  const [followers, setFollowers]   = useState([])
  const [compatibility, setCompatibility] = useState({})
  const [loading, setLoading]       = useState(true)
  const [searching, setSearching]   = useState(false)
  const [followLoading, setFollowLoading] = useState({})
  const toast = useToast()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { setLoading(false); return }
    setUser(u)
    await Promise.all([loadFollowing(u.id), loadFollowers(u.id)])
    setLoading(false)
  }

  async function loadFollowing(userId) {
    const { data } = await supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, username, display_name, avatar_url, bio)')
      .eq('follower_id', userId)
    const profiles = (data || []).map(r => r.profiles).filter(Boolean)
    setFollowing(profiles)
    profiles.forEach(p => loadCompatibility(userId, p.id))
  }

  async function loadFollowers(userId) {
    const { data } = await supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(id, username, display_name, avatar_url, bio)')
      .eq('following_id', userId)
    setFollowers((data || []).map(r => r.profiles).filter(Boolean))
  }

  async function loadCompatibility(myId, theirId) {
    const { data: myRatings } = await supabase.from('ratings').select('track_id, score').eq('user_id', myId)
    const { data: theirRatings } = await supabase.from('ratings').select('track_id, score').eq('user_id', theirId)
    if (!myRatings?.length || !theirRatings?.length) {
      setCompatibility(prev => ({ ...prev, [theirId]: null })); return
    }
    const myMap = {}
    myRatings.forEach(r => myMap[r.track_id] = r.score)
    const theirMap = {}
    theirRatings.forEach(r => theirMap[r.track_id] = r.score)
    const sharedIds = Object.keys(myMap).filter(id => theirMap[id])
    if (sharedIds.length < 3) {
      setCompatibility(prev => ({ ...prev, [theirId]: null })); return
    }
    const agreements = sharedIds.map(id => 1 - Math.abs(myMap[id] - theirMap[id]) / 6)
    const score = Math.round((agreements.reduce((a, b) => a + b, 0) / agreements.length) * 100)
    setCompatibility(prev => ({ ...prev, [theirId]: score }))
  }

  async function searchUsers(e) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResults([])
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio')
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .neq('id', user?.id || '')
      .limit(10)
    if (error) { toast('Search failed. Try again.', 'error') }
    else {
      setSearchResults(data || [])
      if (!data?.length) toast('No users found.', 'info')
    }
    setSearching(false)
  }

  async function follow(profileId) {
    if (!user) { toast('Sign in to follow people.', 'info'); return }
    setFollowLoading(prev => ({ ...prev, [profileId]: true }))
    const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: profileId })
    if (error) { toast('Failed to follow. Try again.', 'error') }
    else { toast('Following!', 'success'); await loadFollowing(user.id) }
    setFollowLoading(prev => ({ ...prev, [profileId]: false }))
  }

  async function unfollow(targetId) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetId)
    if (error) {
      console.error('Unfollow error:', error)
      toast('Failed to unfollow. Try again.', 'error')
      return
    }
    await loadFollowing(user.id)
  }

  const followingIds = new Set(following.map(p => p.id))

  function compatColor(score) {
    if (score >= 80) return '#16a34a'
    if (score >= 60) return '#FF0066'
    return '#6B7280'
  }

  if (loading) return (
    <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
      <p style={{ color: 'var(--gray-text)' }}>Loading...</p>
    </div>
  )

  if (!user) return (
    <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 40, marginBottom: 16 }}>👥</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>Find Your People</h1>
      <p style={{ color: 'var(--gray-text)', marginBottom: 24 }}>Sign in to follow people and see their ratings.</p>
      <a href="/auth" style={{
        display: 'inline-block', padding: '12px 28px', background: 'var(--pink)',
        color: 'white', borderRadius: 10, fontWeight: 600,
      }}>Sign In</a>
    </div>
  )

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>👥 Friends</h1>
      <p style={{ color: 'var(--gray-text)', fontSize: 14, marginBottom: 32 }}>
        Follow people to see their ratings. Music is better with people.
      </p>

      {/* Search */}
      <form onSubmit={searchUsers} style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        <input
          type="text"
          placeholder="Search by username or name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: 1, padding: '11px 16px', borderRadius: 10,
            border: '1.5px solid var(--border)', fontSize: 14, outline: 'none',
            fontFamily: 'inherit',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--pink)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button type="submit" style={{
          padding: '11px 20px', background: 'var(--pink)', border: 'none',
          color: 'white', borderRadius: 10, fontWeight: 600, cursor: 'pointer',
          fontSize: 14, fontFamily: 'inherit',
        }}>
          {searching ? '...' : 'Search'}
        </button>
      </form>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--gray-text)' }}>SEARCH RESULTS</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {searchResults.map(p => (
              <UserCard key={p.id} profile={p} isFollowing={followingIds.has(p.id)}
                onFollow={() => follow(p.id)} onUnfollow={() => unfollow(p.id)}
                loading={followLoading[p.id]} compatibility={compatibility[p.id]} compatColor={compatColor} />
            ))}
          </div>
        </section>
      )}

      {/* Following */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--gray-text)' }}>
          FOLLOWING ({following.length})
        </h2>
        {following.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>🔍</p>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>Nobody yet</p>
            <p style={{ color: 'var(--gray-text)', fontSize: 14 }}>Search for people above to follow them.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {following.map(p => (
              <UserCard key={p.id} profile={p} isFollowing={true}
                onFollow={() => follow(p.id)} onUnfollow={() => unfollow(p.id)}
                loading={followLoading[p.id]} compatibility={compatibility[p.id]} compatColor={compatColor} />
            ))}
          </div>
        )}
      </section>

      {/* Followers */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--gray-text)' }}>
          FOLLOWERS ({followers.length})
        </h2>
        {followers.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--gray-text)', fontSize: 14 }}>No followers yet. Share your profile to get some!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {followers.map(p => (
              <UserCard key={p.id} profile={p} isFollowing={followingIds.has(p.id)}
                onFollow={() => follow(p.id)} onUnfollow={() => unfollow(p.id)}
                loading={followLoading[p.id]} compatibility={compatibility[p.id]} compatColor={compatColor} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function UserCard({ profile, isFollowing, onFollow, onUnfollow, loading, compatibility, compatColor }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'white', borderRadius: 12, border: '1px solid var(--border)',
      padding: '14px 16px',
    }}>
      <a href={`/profile/${profile.username}`}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : 'var(--pink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: 16,
        }}>
          {!profile.avatar_url && (profile.username?.[0] || '?').toUpperCase()}
        </div>
      </a>
      <div style={{ flex: 1, minWidth: 0 }}>
        <a href={`/profile/${profile.username}`} style={{ fontWeight: 600, fontSize: 15 }}>
          {profile.display_name || profile.username}
        </a>
        <p style={{ fontSize: 12, color: 'var(--gray-text)' }}>@{profile.username}</p>
        {profile.bio && (
          <p style={{ fontSize: 12, color: 'var(--gray-text)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile.bio}
          </p>
        )}
        {compatibility !== undefined && compatibility !== null && (
          <p style={{ fontSize: 11, fontWeight: 600, marginTop: 3, color: compatColor(compatibility) }}>
            🎵 You agree {compatibility}% of the time
          </p>
        )}
      </div>
      <button
        onClick={isFollowing ? onUnfollow : onFollow}
        disabled={loading}
        style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: loading ? 'default' : 'pointer',
          border: isFollowing ? '1.5px solid var(--border)' : 'none',
          background: isFollowing ? 'white' : 'var(--pink)',
          color: isFollowing ? 'var(--gray-text)' : 'white',
          fontFamily: 'inherit', flexShrink: 0, opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
      </button>
    </div>
  )
}