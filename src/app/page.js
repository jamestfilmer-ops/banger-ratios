'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from './components/ToastContext'
import { LeaderboardRowSkeleton, AlbumGridSkeleton } from './components/Skeleton'

const BADGES = {
  classic: { label: '💎 Certified Classic', min: 90 },
  gold:    { label: '🥇 Solid Gold',        min: 75 },
  hit:     { label: '🎵 Hit or Miss',       min: 60 },
  filler:  { label: '⚠️ Filler Warning',    min: 40 },
  skip:    { label: '❌ Skip It',           min: 0  },
}

function getBadge(ratio) {
  if (ratio >= 90) return BADGES.classic
  if (ratio >= 75) return BADGES.gold
  if (ratio >= 60) return BADGES.hit
  if (ratio >= 40) return BADGES.filler
  return BADGES.skip
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const INTERVIEW = {
  artist: 'Jon Bellion',
  title: 'The Architecture of an Album',
  subtitle: 'On consistency, skip buttons, and why most artists are afraid of track 7.',
  date: 'February 2026',
  qa: [
    {
      q: 'You\'ve always talked about albums as architecture. What does that mean to you practically, track by track?',
      a: 'Every track has a job. If it doesn\'t have a job, it shouldn\'t be there. The problem with most albums right now is that artists think more equals better. More songs, more features, more everything. But a twelve-track album where every track earns its place is more impressive to me than an eighteen-track album with six filler cuts. I\'d rather have a tight building than a sprawling one with rooms nobody walks into.',
    },
    {
      q: 'Banger Ratios measures exactly that — what percentage of an album\'s tracks clear a quality threshold. If you had to guess, which of your own albums rates highest?',
      a: 'Honestly? I think The Human Condition is probably the most consistent thing I\'ve made. I went back and forth on every single track. There were songs that I loved as standalone pieces that I cut because they broke the emotional arc. That\'s the discipline that nobody sees. People hear the album and think it flowed naturally. It didn\'t. It was surgery. I probably cut thirty songs to get to those fourteen.',
    },
    {
      q: 'Is there a track on that album you almost cut that you\'re glad you kept?',
      a: 'Guillotine. I thought it was too aggressive for the middle of the record. My instinct was to move it or drop it entirely. But there\'s something about that energy right in the center of an album — it resets the listener. It reminds them they\'re not just sitting in a nice room, they\'re on a journey. I think it\'s one of the reasons the back half of the album hits the way it does. You needed that reset.',
    },
    {
      q: 'The skip button has completely changed listener behavior. Does that change how you construct albums?',
      a: 'It should terrify every artist making music right now, and I mean that as a compliment to the listener. The skip button is honest. It\'s the most democratic music criticism tool ever invented. You don\'t have to write a review. You don\'t have to explain yourself. You just skip. And if people are skipping your track three seconds in, that\'s data. That\'s real. What platforms like Banger Ratios do is take that instinct and give it a number — and a number is something you can argue about, which is where music lives anyway.',
    },
    {
      q: 'What\'s your threshold for what makes a track a banger versus filler?',
      a: 'Does it make you feel something you weren\'t expecting to feel? That\'s it. Filler is safe. Filler does what you expect. A banger surprises you even on the tenth listen. It might be two minutes long. It might be an interlude. Length, tempo, genre — none of that matters. What matters is: does it justify being on this record? And more importantly, does it justify taking up four minutes of your life? Because that\'s what you\'re really asking somebody for. Their time. Their attention. The least you can do is earn it.',
    },
    {
      q: 'Last one. If you could go back and change the sequencing on any album — yours or anyone else\'s — what would it be?',
      a: 'I\'m not touching anyone else\'s work. But I will say — and I\'ve said this publicly before — I think albums should be sequenced reverse chronologically sometimes. Start with the climax. Make the listener earn the context. We\'re so trained to build to something. What if we started at the peak and let everything else be the explanation? I don\'t know if I\'ll ever do it. But I think about it.',
    },
  ],
}

export default function Home() {
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState([])
  const [topAlbums, setTopAlbums] = useState([])
  const [feed, setFeed]           = useState([])
  const [gems, setGems]           = useState([])
  const [stats, setStats]         = useState({ albums: 0, ratings: 0, users: 0 })
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [topLoading, setTopLoading] = useState(true)
  const [showBanner, setShowBanner] = useState(true)
  const [showCount, setShowCount]   = useState(20)
  const [activeTab, setActiveTab]   = useState('top') // 'top' | 'feed' | 'gems'
  const [searchError, setSearchError] = useState(null)
  const [openQ, setOpenQ] = useState(null)

  const toast = useToast()

  useEffect(() => {
    loadUser()
    loadTop()
    loadStats()
    loadGems()
  }, [])

  async function loadUser() {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u || null)
    if (u) loadFeed(u.id)
  }

  async function loadStats() {
    const [a, r, u] = await Promise.all([
      supabase.from('albums').select('id', { count: 'exact', head: true }),
      supabase.from('ratings').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ])
    setStats({
      albums:  a.count || 0,
      ratings: r.count || 0,
      users:   u.count || 0,
    })
  }

  async function loadTop() {
    setTopLoading(true)
    const { data } = await supabase
      .from('albums').select('*')
      .gt('total_ratings', 0)
      .order('banger_ratio', { ascending: false })
      .limit(50)
    setTopAlbums(data || [])
    setTopLoading(false)
  }

  async function loadFeed(userId) {
    // Get IDs of users I follow
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)

    if (!follows?.length) { setFeed([]); return }
    const ids = follows.map(f => f.following_id)

    // Get their recent ratings with album info
    const { data } = await supabase
      .from('ratings')
      .select(`
        id, score, created_at,
        user_id,
        profiles!ratings_user_id_fkey(username, avatar_url),
        tracks!ratings_track_id_fkey(
          album_id,
          albums!tracks_album_id_fkey(id, name, artist_name, artwork_url, banger_ratio, total_ratings, itunes_collection_id)
        )
      `)
      .in('user_id', ids)
      .order('created_at', { ascending: false })
      .limit(40)

    if (!data) return

    // Deduplicate: one entry per user+album combo, most recent
    const seen = new Set()
    const deduped = []
    for (const row of data) {
      const album = row.tracks?.albums
      if (!album) continue
      const key = `${row.user_id}_${album.id}`
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push({
        userId: row.user_id,
        username: row.profiles?.username,
        avatar: row.profiles?.avatar_url,
        album,
        ratedAt: row.created_at,
      })
    }
    setFeed(deduped.slice(0, 15))
  }

  async function loadGems() {
    const { data } = await supabase
      .from('albums')
      .select('*')
      .lte('total_ratings', 10)
      .gte('banger_ratio', 80)
      .order('banger_ratio', { ascending: false })
      .limit(8)
    setGems(data || [])
  }

  async function search(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResults([])
    setSearchError(null)
    try {
      const r = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=15`
      )
      const d = await r.json()
      setResults(d.results || [])
      if (!d.results?.length) toast('No albums found. Try a different search.', 'info')
    } catch {
      setSearchError('Search failed. Try again.')
      toast('Search failed. Try again.', 'error')
    }
    setLoading(false)
  }

  const cardHover = {
    onMouseOver: e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)' },
    onMouseOut:  e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' },
  }

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* Announcement banner */}
      {showBanner && (
        <div style={{
          background: 'linear-gradient(135deg, #FF0066, #CC0052)',
          padding: '12px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 16,
        }}>
          <span style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>
            🔥 <strong>Rate any album instantly</strong> — search below and start rating!
          </span>
          <button onClick={() => setShowBanner(false)} style={{
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 18,
          }}>×</button>
        </div>
      )}

      {/* Hero + Search */}
      <section style={{ padding: '52px 24px 40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 42, fontWeight: 700, color: 'var(--black)', margin: '0 0 10px', lineHeight: 1.15 }}>
          The Real Measure of<br />
          <span style={{ color: 'var(--pink)' }}>Musical Consistency</span>
        </h1>
        <p style={{ color: 'var(--gray-text)', fontSize: 16, maxWidth: 420, margin: '0 auto 28px' }}>
          Rate every track 1–7. See the Banger Ratio. Settle the debate.
        </p>

        <form onSubmit={search} style={{
          display: 'flex', maxWidth: 480, margin: '0 auto',
          borderRadius: 12, border: '2px solid var(--border)', overflow: 'hidden',
        }}>
          <input
            type="text"
            placeholder="Search for any album..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1, padding: '13px 18px', border: 'none', fontSize: 15,
              outline: 'none', background: 'white', color: 'var(--black)',
            }}
          />
          <button type="submit" style={{
            padding: '13px 22px', background: 'var(--pink)', border: 'none',
            color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            {loading ? '...' : 'Search'}
          </button>
        </form>

        {searchError && (
          <p style={{ color: '#FF0066', fontSize: 13, marginTop: 10 }}>{searchError}</p>
        )}

        {/* Live Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 40, flexWrap: 'wrap' }}>
          {[
            { n: stats.albums,  label: 'ALBUMS RATED' },
            { n: stats.ratings, label: 'TRACK RATINGS' },
            { n: stats.users,   label: 'MEMBERS' },
          ].map(({ n, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--black)' }}>
                {n > 999 ? `${(n / 1000).toFixed(1)}k` : n}
              </div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--gray-text)', textTransform: 'uppercase', marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Search Results */}
        {results.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Search Results</h2>
              <button onClick={() => setResults([])} style={{
                background: 'none', border: 'none', color: 'var(--gray-text)', cursor: 'pointer', fontSize: 13,
              }}>Clear</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
              {results.map(a => (
                <a key={a.collectionId} href={`/album/${a.collectionId}`}
                  style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', transition: 'all 0.15s', display: 'block' }}
                  {...cardHover}
                >
                  <img src={a.artworkUrl100?.replace('100x100', '300x300')} alt=""
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                  <div style={{ padding: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                      {a.collectionName}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--gray-text)' }}>{a.artistName}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-soft)', borderRadius: 10, padding: 4 }}>
          {[
            { key: 'top',  label: '🔥 Top Albums' },
            { key: 'feed', label: '👥 Friend Feed', locked: !user },
            { key: 'gems', label: '💎 Hidden Gems' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => !tab.locked && setActiveTab(tab.key)}
              title={tab.locked ? 'Sign in to see your friend feed' : ''}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8,
                border: 'none', cursor: tab.locked ? 'default' : 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                background: activeTab === tab.key ? 'white' : 'transparent',
                color: activeTab === tab.key ? 'var(--pink)' : tab.locked ? '#ccc' : 'var(--gray-text)',
                boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}{tab.locked ? ' 🔒' : ''}
            </button>
          ))}
        </div>

        {/* ── TOP ALBUMS ─────────────────────────────────────────── */}
        {activeTab === 'top' && (
          <section>
            {topLoading ? (
              <LeaderboardRowSkeleton count={8} />
            ) : topAlbums.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🎵</p>
                <p style={{ color: 'var(--gray-text)', marginBottom: 16 }}>No rated albums yet.</p>
                <button
                  onClick={() => document.querySelector('input[type=text]')?.focus()}
                  style={{
                    padding: '10px 24px', borderRadius: 10, border: 'none',
                    background: 'var(--pink)', color: 'white', fontWeight: 600, cursor: 'pointer',
                    fontSize: 14, fontFamily: 'inherit',
                  }}
                >Search an Album to Rate First →</button>
              </div>
            ) : (
              <>
                {topAlbums.slice(0, showCount).map((a, i) => {
                  const badge = getBadge(a.banger_ratio)
                  return (
                    <a key={a.id} href={`/album/${a.itunes_collection_id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 14px', borderRadius: 10, marginBottom: 2,
                        transition: 'background 0.15s', textDecoration: 'none',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-soft)'}
                      onMouseOut={e => e.currentTarget.style.background = ''}
                    >
                      <span style={{ fontSize: 16, fontWeight: 700, color: i < 3 ? 'var(--pink)' : '#ccc', width: 28, textAlign: 'center' }}>
                        {i + 1}
                      </span>
                      {a.artwork_url && (
                        <img src={a.artwork_url.replace('600x600', '100x100')} alt=""
                          style={{ width: 44, height: 44, borderRadius: 8 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.name}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--gray-text)' }}>{a.artist_name} · {a.total_ratings} ratings</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--pink)' }}>{a.banger_ratio}%</p>
                        <p style={{ fontSize: 9, color: 'var(--gray-text)', fontWeight: 600 }}>{badge.label}</p>
                      </div>
                    </a>
                  )
                })}
                {topAlbums.length > showCount && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button onClick={() => setShowCount(s => s + 20)} style={{
                      padding: '10px 28px', borderRadius: 10, border: '1px solid var(--border)',
                      background: 'white', color: 'var(--gray-text)', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>Show More</button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ── FRIEND FEED ───────────────────────────────────────── */}
        {activeTab === 'feed' && user && (
          <section>
            {feed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>👥</p>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>No activity yet</p>
                <p style={{ color: 'var(--gray-text)', fontSize: 14, marginBottom: 20 }}>
                  Follow people to see what they're rating.
                </p>
                <a href="/Friends" style={{
                  display: 'inline-block', padding: '10px 24px', borderRadius: 10,
                  background: 'var(--pink)', color: 'white', fontWeight: 600, fontSize: 14,
                }}>Find People to Follow →</a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feed.map((item, i) => (
                  <a key={i} href={`/album/${item.album.itunes_collection_id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: 'white', borderRadius: 12, border: '1px solid var(--border)',
                      padding: '12px 16px', transition: 'all 0.15s', textDecoration: 'none',
                    }}
                    {...cardHover}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: item.avatar ? `url(${item.avatar}) center/cover` : 'var(--pink)',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 13,
                    }}>
                      {!item.avatar && (item.username?.[0] || '?').toUpperCase()}
                    </div>
                    {/* Album art */}
                    {item.album.artwork_url && (
                      <img src={item.album.artwork_url.replace('600x600', '80x80')} alt=""
                        style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }} />
                    )}
                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>
                        <strong>@{item.username}</strong> rated{' '}
                        <strong>{item.album.name}</strong> by {item.album.artist_name}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--gray-text)', marginTop: 2 }}>
                        {item.album.total_ratings} ratings · {timeAgo(item.ratedAt)}
                      </p>
                    </div>
                    {/* Ratio */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--pink)' }}>
                        {item.album.banger_ratio}%
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── HIDDEN GEMS ───────────────────────────────────────── */}
        {activeTab === 'gems' && (
          <section>
            <p style={{ color: 'var(--gray-text)', fontSize: 13, marginBottom: 16 }}>
              Albums with fewer than 10 ratings but a Banger Ratio above 80%. Buried treasures.
            </p>
            {gems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>💎</p>
                <p style={{ color: 'var(--gray-text)' }}>No hidden gems yet. Rate more obscure albums!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
                {gems.map(a => (
                  <a key={a.id} href={`/album/${a.itunes_collection_id}`}
                    style={{
                      borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)',
                      transition: 'all 0.15s', display: 'block', background: 'white',
                    }}
                    {...cardHover}
                  >
                    {a.artwork_url && (
                      <img src={a.artwork_url.replace('600x600', '300x300')} alt=""
                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                    )}
                    <div style={{ padding: 10 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                        {a.name}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--gray-text)', marginBottom: 4 }}>{a.artist_name}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--pink)' }}>{a.banger_ratio}% 🔥</p>
                      <p style={{ fontSize: 10, color: 'var(--gray-text)' }}>{a.total_ratings} rating{a.total_ratings !== 1 ? 's' : ''}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── FEATURED ARTIST INTERVIEW ─────────────────────────── */}
        <section style={{ marginTop: 72, borderTop: '1px solid var(--border)', paddingTop: 56 }}>

          {/* Section label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 2.5,
              color: 'var(--pink)', textTransform: 'uppercase',
            }}>Featured Artist</span>
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', marginBottom: 44, flexWrap: 'wrap' }}>
            {/* Monogram block — placeholder since we don't have a licensed photo */}
            <div style={{
              width: 110, height: 110, borderRadius: 6, flexShrink: 0,
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
            }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--pink)', fontStyle: 'italic' }}>JB</span>
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
                color: 'var(--gray-text)', marginBottom: 8,
              }}>{INTERVIEW.date}</p>
              <h2 style={{
                fontSize: 30, fontWeight: 800, lineHeight: 1.1,
                color: 'var(--black)', marginBottom: 8, letterSpacing: -0.5,
              }}>{INTERVIEW.artist}</h2>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--black)', marginBottom: 6, lineHeight: 1.4 }}>
                {INTERVIEW.title}
              </p>
              <p style={{ fontSize: 14, color: 'var(--gray-text)', lineHeight: 1.55, maxWidth: 400, fontStyle: 'italic' }}>
                {INTERVIEW.subtitle}
              </p>
            </div>
          </div>

          {/* Q&A accordion */}
          <div>
            {INTERVIEW.qa.map((item, i) => (
              <div key={i} style={{ borderTop: '1px solid var(--border)', padding: '22px 0' }}>
                <button
                  onClick={() => setOpenQ(openQ === i ? null : i)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    width: '100%', background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0, gap: 16, textAlign: 'left',
                  }}
                >
                  <p style={{
                    fontSize: 15, fontWeight: 700, color: 'var(--black)',
                    lineHeight: 1.45, flex: 1, fontFamily: 'inherit', margin: 0,
                  }}>
                    <span style={{ color: 'var(--pink)', marginRight: 8, fontWeight: 800 }}>Q.</span>
                    {item.q}
                  </p>
                  <span style={{
                    fontSize: 22, color: 'var(--gray-text)', flexShrink: 0, marginTop: 1,
                    display: 'inline-block', transition: 'transform 0.2s',
                    transform: openQ === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}>+</span>
                </button>

                {openQ === i && (
                  <div style={{ marginTop: 16, paddingLeft: 20, borderLeft: '2px solid var(--pink)' }}>
                    <p style={{ fontSize: 15, lineHeight: 1.8, color: '#444', fontStyle: 'italic', margin: 0 }}>
                      "{item.a}"
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)' }} />
          </div>

          <p style={{ fontSize: 11, color: 'var(--gray-text)', marginTop: 20, fontStyle: 'italic' }}>
            This is a fictional editorial interview created for illustrative purposes.
          </p>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid var(--border)', marginTop: 60, paddingTop: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--gray-text)', fontSize: 12 }}>
            Banger Ratios™ 2026 · <a href="/about" style={{ color: 'var(--pink)' }}>About</a> ·{' '}
            <a href="/terms" style={{ color: 'var(--pink)' }}>Terms</a>
          </p>
        </footer>
      </main>
    </div>
  )
}