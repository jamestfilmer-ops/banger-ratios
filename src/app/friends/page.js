'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function artFix(url) {
  if (!url) return null
  return url.replace('100x100bb', '300x300bb').replace('600x600bb', '300x300bb')
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function LoggedOutPreview() {
  const [topRaters, setTopRaters] = useState([])
  const [hotAlbums, setHotAlbums] = useState([])

  useEffect(() => {
    supabase.from('profiles').select('id, username, display_name, avatar_url').limit(12)
      .then(async ({ data }) => {
        if (!data?.length) return
        const withCounts = await Promise.all(data.map(async p => {
          const { count } = await supabase.from('ratings').select('id', { count: 'exact', head: true }).eq('user_id', p.id)
          return { ...p, ratingCount: count || 0 }
        }))
        setTopRaters(withCounts.filter(p => p.ratingCount > 0).sort((a, b) => b.ratingCount - a.ratingCount))
      })
    supabase.from('albums').select('id, name, artist_name, artwork_url, banger_ratio, itunes_collection_id, total_ratings')
      .gt('total_ratings', 0).order('total_ratings', { ascending: false }).limit(6)
      .then(({ data }) => setHotAlbums(data || []))
  }, [])

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Community</h1>
        <p style={{ color: 'var(--gray-text)', fontSize: 16, maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.6 }}>
          See what other listeners are rating. Follow people whose taste matches yours.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Link href="/auth" style={{
            display: 'inline-block', background: 'var(--pink)', color: 'white',
            padding: '11px 24px', borderRadius: 12, fontWeight: 600, fontSize: 14,
          }}>Join to follow people</Link>
          <Link href="/auth" style={{
            display: 'inline-block', border: '1.5px solid var(--border)',
            padding: '11px 24px', borderRadius: 12, fontWeight: 500, fontSize: 14, color: 'var(--black)',
          }}>Sign in</Link>
        </div>
      </div>

      {topRaters.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Active community members</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {topRaters.map(person => (
              <div key={person.id} style={{
                background: 'white', border: '1px solid var(--border)', borderRadius: 14,
                padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
                  background: 'rgba(255,0,102,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: 'var(--pink)', flexShrink: 0,
                }}>
                  {person.avatar_url
                    ? <img src={person.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials(person.display_name || person.username)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{person.display_name || person.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>{person.ratingCount} ratings</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {hotAlbums.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Most discussed albums</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hotAlbums.map(album => (
              <Link key={album.id} href={'/album/' + album.itunes_collection_id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'white', border: '1px solid var(--border)',
                borderRadius: 12, padding: '12px 16px', textDecoration: 'none', color: 'inherit',
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-soft)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {artFix(album.artwork_url)
                    ? <img src={artFix(album.artwork_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                    : '♪'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>{album.artist_name}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--pink)' }}>{album.banger_ratio}%</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>{album.total_ratings} ratings</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div style={{
        background: 'rgba(255,0,102,0.04)', border: '1px solid rgba(255,0,102,0.12)',
        borderRadius: 16, padding: '28px', textAlign: 'center',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Join the conversation</h3>
        <p style={{ color: 'var(--gray-text)', fontSize: 14, marginBottom: 18, lineHeight: 1.6 }}>
          Create a free account to follow other raters, see their activity, and add your ratings.
        </p>
        <Link href="/auth" style={{
          display: 'inline-block', background: 'var(--pink)', color: 'white',
          padding: '11px 28px', borderRadius: 12, fontWeight: 600, fontSize: 14,
        }}>Create free account</Link>
      </div>
    </main>
  )
}

function LoggedInFriends({ user }) {
  const [following, setFollowing] = useState([])
  const [feed, setFeed] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadFriends() }, [])

  async function loadFriends() {
    setLoading(true)
    const { data: follows } = await supabase.from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, username, display_name, avatar_url)')
      .eq('follower_id', user.id)
    const followingList = follows?.map(f => f.profiles).filter(Boolean) || []
    setFollowing(followingList)

    if (followingList.length > 0) {
      const ids = followingList.map(p => p.id)
      const { data: ratings } = await supabase.from('ratings')
        .select('user_id, profiles!ratings_user_id_fkey(username, display_name, avatar_url), tracks!ratings_track_id_fkey(albums!tracks_album_id_fkey(id, name, artist_name, artwork_url, banger_ratio, itunes_collection_id)), created_at')
        .in('user_id', ids).order('created_at', { ascending: false }).limit(40)

      const seen = new Set()
      const deduped = []
      for (const row of (ratings || [])) {
        const album = row.tracks?.albums
        if (!album) continue
        const key = row.user_id + '_' + album.id
        if (seen.has(key)) continue
        seen.add(key)
        deduped.push({ userId: row.user_id, username: row.profiles?.display_name || row.profiles?.username, avatar: row.profiles?.avatar_url, album, ratedAt: row.created_at })
      }
      setFeed(deduped.slice(0, 20))
    }
    setLoading(false)
  }

  async function searchPeople(q) {
    if (!q.trim()) { setSearchResults([]); return }
    const { data } = await supabase.from('profiles').select('id, username, display_name, avatar_url')
      .ilike('username', '%' + q + '%').neq('id', user.id).limit(8)
    setSearchResults(data || [])
  }

  async function follow(id) {
    await supabase.from('follows').upsert({ follower_id: user.id, following_id: id }, { onConflict: 'follower_id,following_id' })
    loadFriends(); setSearchResults([]); setSearchQuery('')
  }

  async function unfollow(id) {
    await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', id)
    loadFriends()
  }

  const isFollowing = (id) => following.some(f => f.id === id)

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Friends</h1>
      <p style={{ color: 'var(--gray-text)', marginBottom: 28 }}>Follow people and see what they are rating.</p>

      <div style={{ position: 'relative', marginBottom: 32 }}>
        <input className="search-input" style={{ width: '100%' }}
          placeholder="Search by username..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); searchPeople(e.target.value) }}
        />
        {searchResults.length > 0 && (
          <div style={{
            position: 'absolute', top: '110%', left: 0, right: 0,
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden',
          }}>
            {searchResults.map(person => (
              <div key={person.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,0,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--pink)', flexShrink: 0 }}>
                  {initials(person.display_name || person.username)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{person.display_name || person.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>@{person.username}</div>
                </div>
                <button onClick={() => isFollowing(person.id) ? unfollow(person.id) : follow(person.id)} style={{
                  padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  background: isFollowing(person.id) ? 'var(--bg-soft)' : 'var(--pink)',
                  color: isFollowing(person.id) ? 'var(--gray-text)' : 'white',
                  border: '1px solid ' + (isFollowing(person.id) ? 'var(--border)' : 'var(--pink)'),
                }}>{isFollowing(person.id) ? 'Following' : 'Follow'}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p style={{ color: 'var(--gray-text)', textAlign: 'center' }}>Loading...</p>
      ) : following.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--gray-text)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>👋</div>
          <p>You are not following anyone yet. Search above to find people.</p>
        </div>
      ) : (
        <>
          {feed.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Recent activity</h2>
              {feed.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,0,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--pink)', flexShrink: 0, overflow: 'hidden' }}>
                    {item.avatar ? <img src={item.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(item.username)}
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-soft)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {artFix(item.album.artwork_url) ? <img src={artFix(item.album.artwork_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} /> : '♪'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: 'var(--pink)', fontWeight: 700 }}>{item.username}</span>{' rated '}
                      <span style={{ fontWeight: 600 }}>{item.album.name}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>{item.album.artist_name}</div>
                  </div>
                  {item.album.banger_ratio != null && (
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pink)', flexShrink: 0 }}>{item.album.banger_ratio}%</div>
                  )}
                </div>
              ))}
            </section>
          )}
          <section>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Following ({following.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {following.map(person => (
                <div key={person.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,0,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--pink)', flexShrink: 0 }}>
                    {initials(person.display_name || person.username)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.display_name || person.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>@{person.username}</div>
                  </div>
                  <button onClick={() => unfollow(person.id)} style={{ fontSize: 11, color: 'var(--gray-text)', background: 'none', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Unfollow
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default function FriendsPage() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data?.user || null); setChecking(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user || null))
    return () => subscription.unsubscribe()
  }, [])

  if (checking) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-text)' }}>Loading...</div>
  if (!user) return <LoggedOutPreview />
  return <LoggedInFriends user={user} />
}
