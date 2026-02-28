// FILE: src/app/leaderboards/page.js
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ArtistPanel from '@/app/components/ArtistPanel'

const GENRES = ['All', 'Hip-Hop/Rap', 'Pop', 'R&B/Soul', 'Rock', 'Alternative', 'Electronic', 'Country', 'Jazz', 'Metal']

const BADGES = {
  untouchable: { label: '💎 Untouchable',          min: 95 },
  banger:      { label: '🔥 Certified Banger',      min: 80 },
  gold:        { label: '🥇 Solid Gold',            min: 65 },
  hits:        { label: '🎵 More Hits Than Misses', min: 50 },
  mixed:       { label: '🎲 Hit or Miss',           min: 35 },
  filler:      { label: '⚠️ Filler Heavy',          min: 20 },
  skip:        { label: '❌ Skip It',               min: 0  },
}

function getBadge(ratio) {
  if (ratio >= 95) return BADGES.untouchable
  if (ratio >= 80) return BADGES.banger
  if (ratio >= 65) return BADGES.gold
  if (ratio >= 50) return BADGES.hits
  if (ratio >= 35) return BADGES.mixed
  if (ratio >= 20) return BADGES.filler
  return BADGES.skip
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/\s*[\(\[].*(deluxe|edition|anniversary|remastered|version|reissue|expanded|bonus).*[\)\]]/gi, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
}

function deduplicateAlbums(albums) {
  const seen   = new Map()
  const result = []
  for (const album of albums) {
    const key = `${album.artist_name?.toLowerCase()}__${normalizeTitle(album.name || '')}`
    if (seen.has(key)) {
      const existingIdx = seen.get(key)
      if ((album.total_ratings || 0) > (result[existingIdx].total_ratings || 0)) {
        result[existingIdx] = album
      }
    } else {
      seen.set(key, result.length)
      result.push(album)
    }
  }
  return result
}

function BattleSection() {
  const [battles,  setBattles]  = useState([])
  const [votes,    setVotes]    = useState({})
  const [user,     setUser]     = useState(null)
  const [myVotes,  setMyVotes]  = useState({})
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
    loadBattles()
  }, [])

  async function loadBattles() {
    const { data: battleData } = await supabase
      .from('battles')
      .select('*')
      .order('week_of', { ascending: false })
      .limit(8)
    if (battleData) {
      setBattles(battleData)
      const counts = {}
      for (const b of battleData) {
        const { data: voteData } = await supabase
          .from('battle_votes')
          .select('vote')
          .eq('battle_id', b.id)
        const aVotes = voteData?.filter(v => v.vote === 'a').length || 0
        const bVotes = voteData?.filter(v => v.vote === 'b').length || 0
        counts[b.id] = { a: aVotes, b: bVotes }
      }
      setVotes(counts)
    }
    setLoading(false)
  }

  async function castVote(battleId, side) {
    if (!user) { window.location.href = '/auth'; return }
    if (myVotes[battleId]) return
    const { error } = await supabase.from('battle_votes').insert({
      battle_id: battleId, user_id: user.id, vote: side,
    })
    if (!error) {
      setMyVotes(prev => ({ ...prev, [battleId]: side }))
      setVotes(prev => ({
        ...prev,
        [battleId]: { ...prev[battleId], [side]: (prev[battleId]?.[side] || 0) + 1 },
      }))
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-text)' }}>
      Loading battles...
    </div>
  )

  if (battles.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--gray-text)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚔️</div>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>
        No battles yet
      </p>
      <p style={{ fontSize: 13 }}>Check back Monday — new matchup every week.</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <p style={{ textAlign: 'center', color: 'var(--gray-text)', fontSize: 14, marginBottom: 28 }}>
        Vote on the matchup. No algorithms. Pure opinion.
      </p>
      {battles.map(battle => {
        const v        = votes[battle.id] || { a: 0, b: 0 }
        const total    = v.a + v.b
        const pctA     = total > 0 ? Math.round((v.a / total) * 100) : 50
        const pctB     = total > 0 ? Math.round((v.b / total) * 100) : 50
        const voted    = myVotes[battle.id]
        const isActive = battle.is_active
        return (
          <div key={battle.id} style={{
            background: 'white', borderRadius: 16,
            border: `1px solid ${isActive ? 'var(--pink)' : 'var(--gray-200)'}`,
            padding: '20px 16px', marginBottom: 16, opacity: isActive ? 1 : 0.7,
          }}>
            {isActive && (
              <div style={{
                display: 'inline-block', background: 'var(--pink)', color: 'white',
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                marginBottom: 12, letterSpacing: 0.5,
              }}>LIVE THIS WEEK</div>
            )}
            {battle.context && (
              <p style={{ fontSize: 13, color: 'var(--gray-text)', marginBottom: 16, fontStyle: 'italic' }}>
                "{battle.context}"
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', marginBottom: 14 }}>
              {[
                { side: 'a', name: battle.album_a_name, artist: battle.album_a_artist, artwork: battle.album_a_art },
                { side: 'b', name: battle.album_b_name, artist: battle.album_b_artist, artwork: battle.album_b_art },
              ].map(({ side, name, artist, artwork }) => (
                <button key={side}
                  onClick={() => isActive && castVote(battle.id, side)}
                  disabled={!isActive || !!voted}
                  style={{
                    flex: 1, padding: '14px 10px', borderRadius: 12, textAlign: 'center',
                    border: voted === side ? '2px solid var(--pink)' : '1px solid var(--gray-200)',
                    background: voted === side ? 'rgba(255,0,102,0.05)' : 'white',
                    cursor: isActive && !voted ? 'pointer' : 'default',
                    transition: 'all 0.15s', fontFamily: 'inherit',
                  }}
                >
                  {artwork && (
                    <img src={artwork} alt={name}
                      style={{ width: 60, height: 60, borderRadius: 8, marginBottom: 8, objectFit: 'cover' }} />
                  )}
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>{artist}</div>
                </button>
              ))}
            </div>
            {(voted || !isActive) && total > 0 && (
              <div>
                <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 28, marginBottom: 8 }}>
                  <div style={{
                    width: `${pctA}%`, background: 'var(--pink)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'white', transition: 'width 0.5s ease',
                  }}>{pctA}%</div>
                  <div style={{
                    width: `${pctB}%`, background: '#1a1a1a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'white', transition: 'width 0.5s ease',
                  }}>{pctB}%</div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--gray-text)', textAlign: 'center' }}>
                  {total.toLocaleString()} vote{total !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            {isActive && !voted && (
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray-text)', marginTop: 8 }}>
                Vote to see results
              </p>
            )}
          </div>
        )
      })}
      <div style={{
        textAlign: 'center', padding: '20px 16px', background: 'var(--gray-100)',
        borderRadius: 12, marginTop: 8,
      }}>
        <p style={{ fontSize: 13, color: 'var(--gray-text)' }}>
          New matchup every Monday.
        </p>
      </div>
    </div>
  )
}


export default function LeaderboardsPage() {
  const [albums,         setAlbums]         = useState([])
  const [filter,         setFilter]         = useState('all')
  const [loading,        setLoading]        = useState(true)
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [activeGenre,    setActiveGenre]    = useState('All')
  const [tab,            setTab]            = useState('rankings')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('albums')
      .select('*')
      .gt('total_ratings', 0)
      .order('banger_ratio', { ascending: false })
    const deduped = deduplicateAlbums(data || [])
    setAlbums(deduped)
    setLoading(false)
  }

  const byGenre = activeGenre === 'All'
    ? albums
    : albums.filter(a => a.genre?.toLowerCase().includes(activeGenre.toLowerCase()))

  const displayedAlbums = filter === 'all'
    ? byGenre
    : byGenre.filter(a => getBadge(a.banger_ratio).label.toLowerCase().includes(filter))

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-text)' }}>Loading...</div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 100px' }}>

      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>🏆 Leaderboard</h1>
      <p style={{ color: 'var(--gray-text)', fontSize: 14, marginBottom: 20 }}>
        Albums ranked by Banger Ratio. Click an artist to see more.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'rankings', label: 'Rankings' },
          { key: 'battles',  label: '⚔️ Head-to-Head' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 18px', borderRadius: '8px 8px 0 0', border: 'none',
            background: tab === t.key ? 'var(--pink)' : 'transparent',
            color: tab === t.key ? 'white' : 'var(--gray-text)',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'battles' && <BattleSection />}

      {tab === 'rankings' && (
        <>
          {/* Badge filter pills */}
          <div style={{
            display: 'flex', gap: 6, flexWrap: 'nowrap',
            overflowX: 'auto', paddingBottom: 4,
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none', scrollbarWidth: 'none',
            marginBottom: 10,
          }}>
            {[
              { key: 'all',    label: 'All Tiers' },
              { key: 'banger', label: '🔥 Banger+' },
              { key: 'gold',   label: '🥇 Gold+' },
              { key: 'hits',   label: '🎵 Hits+' },
              { key: 'mixed',  label: '🎲 Mixed' },
              { key: 'skip',   label: '❌ Skip' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                background: filter === f.key ? 'var(--pink)' : 'var(--gray-100)',
                color: filter === f.key ? 'white' : 'var(--gray-600)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                flexShrink: 0, transition: 'all 0.15s',
              }}>{f.label}</button>
            ))}
          </div>

          {/* Genre pills */}
          <div style={{
            display: 'flex', gap: 6, flexWrap: 'nowrap',
            overflowX: 'auto', paddingBottom: 4,
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none', scrollbarWidth: 'none',
            marginBottom: 20,
          }}>
            {GENRES.map(g => (
              <button key={g} onClick={() => setActiveGenre(g)} style={{
                padding: '5px 14px', borderRadius: 20,
                border: activeGenre === g ? 'none' : '1px solid var(--gray-200)',
                background: activeGenre === g ? '#1a1a1a' : 'white',
                color: activeGenre === g ? 'white' : 'var(--gray-600)',
                fontWeight: activeGenre === g ? 700 : 400, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                transition: 'all 0.15s',
              }}>{g}</button>
            ))}
          </div>

          {/* Empty state */}
          {displayedAlbums.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--gray-text)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>
                No albums match this filter
              </p>
              <p style={{ fontSize: 13 }}>Try a different tier or genre.</p>
            </div>
          )}

          {/* Album list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayedAlbums.map((a, i) => {
              const badge = getBadge(a.banger_ratio || 0)
              return (
                <a
                  key={a.id}
                  href={`/album/${a.itunes_collection_id}`}
                  className="lb-card"
                  onClick={e => {
                    if (e.target.dataset.artist) { e.preventDefault(); return }
                    e.currentTarget.classList.remove('lb-card-flash')
                    void e.currentTarget.offsetWidth
                    e.currentTarget.classList.add('lb-card-flash')
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    textDecoration: 'none', color: 'inherit',
                  }}
                >
                  {/* Rank — top 3 in pink */}
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: i < 3 ? 'var(--pink)' : 'var(--gray-text)',
                    width: 22, textAlign: 'right', flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>

                  {/* Artwork */}
                  <img
                    src={a.artwork_url?.replace('600x600', '80x80') || a.artwork_url}
                    alt={a.name}
                    style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                  />

                  {/* Title + artist */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 700, fontSize: 14, color: 'var(--black)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginBottom: 2,
                    }}>
                      {a.name}
                    </p>
                    <p style={{ fontSize: 12, marginTop: 2, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span
                        data-artist="true"
                        onClick={e => { e.preventDefault(); setSelectedArtist(a.artist_name) }}
                        style={{ cursor: 'pointer', color: 'var(--gray-text)',
                          textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                      >
                        {a.artist_name}
                      </span>
                      <span style={{ color: 'var(--gray-text)', marginLeft: 6 }}>
                        · {a.total_ratings} rating{a.total_ratings !== 1 ? 's' : ''}
                      </span>
                    </p>
                  </div>

                  {/* Score + grade card + badge */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--pink)',
                      marginBottom: 2, lineHeight: 1 }}>
                      {Math.round(a.banger_ratio || 0)}%
                    </p>
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: 'var(--pink)',
                      background: 'rgba(255,0,102,0.08)',
                      padding: '2px 7px', borderRadius: 6, whiteSpace: 'nowrap',
                    }}>
                      {badge.label}
                    </span>
                  </div>
                </a>
              )
            })}
          </div>

          <ArtistPanel
            artist={selectedArtist}
            albums={albums}
            onClose={() => setSelectedArtist(null)}
          />
        </>
      )}

      <style>{`
        div::-webkit-scrollbar { display: none; }
        .lb-card {
          border-radius: 14px;
          border: 2px solid transparent;
          background: white;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .lb-card:hover {
          border-color: rgba(255, 0, 127, 0.35);
          box-shadow: 0 4px 20px rgba(255, 0, 127, 0.10);
        }
        .lb-card:active {
          border-color: var(--pink);
          box-shadow: 0 0 0 3px rgba(255, 0, 102, 0.20);
        }
        @keyframes pinkFlash {
          0%   { border-color: var(--pink); box-shadow: 0 0 0 4px rgba(255,0,102,0.28); }
          100% { border-color: transparent; box-shadow: none; }
        }
        .lb-card-flash {
          animation: pinkFlash 0.45s ease-out forwards;
        }
      `}</style>
    </div>
  )
}