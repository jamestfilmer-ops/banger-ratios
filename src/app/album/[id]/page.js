// FILE: src/app/album/[id]/page.js
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

const SCORE_LABELS = {
  7: 'Perfect',
  6: 'Great',
  5: 'Good',
  4: 'Decent',
  3: 'Filler',
  2: 'Weak',
  1: 'Not for me',
}

export default function AlbumPage() {
  const params = useParams()
  const [album, setAlbum]             = useState(null)
  const [tracks, setTracks]           = useState([])
  const [userRatings, setUserRatings] = useState({})
  const [user, setUser]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState({})
  const [notFound, setNotFound]       = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    const id = params.id

    const { data: alb } = await supabase
      .from('albums')
      .select('*')
      .eq('itunes_collection_id', id)
      .maybeSingle()

    if (alb) {
      setAlbum(alb)
      const { data: tr } = await supabase
        .from('tracks')
        .select('*')
        .eq('album_id', alb.id)
        .order('track_number', { ascending: true })
      setTracks(tr || [])
      if (u) {
        const { data: ratings } = await supabase
          .from('ratings')
          .select('track_id, score')
          .eq('user_id', u.id)
          .in('track_id', (tr || []).map(t => t.id))
        const map = {}
        ;(ratings || []).forEach(r => map[r.track_id] = r.score)
        setUserRatings(map)
      }
      setLoading(false)
      return
    }

    try {
      const itunesRes  = await fetch(
        `https://itunes.apple.com/lookup?id=${id}&entity=song`
      )
      const itunesData = await itunesRes.json()

      if (!itunesData.results || itunesData.results.length === 0) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const collection = itunesData.results.find(r => r.wrapperType === 'collection')
        || itunesData.results[0]

      if (!collection?.collectionId && !collection?.collectionName) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setAlbum({
        id: id,
        name: collection.collectionName || collection.trackName || 'Unknown Album',
        artist_name: collection.artistName || 'Unknown Artist',
        artwork_url: (collection.artworkUrl100 || collection.artworkUrl60 || '')
          .replace('100x100bb', '600x600bb'),
        itunes_collection_id: id,
        genre: collection.primaryGenreName || null,
        release_date: collection.releaseDate || null,
        banger_ratio: null,
        total_ratings: 0,
      })

      setTracks(
        itunesData.results
          .filter(r => r.wrapperType === 'track')
          .map(t => ({
            id: t.trackId,
            name: t.trackName,
            track_number: t.trackNumber,
            duration_ms: t.trackTimeMillis,
            album_id: id,
          }))
      )
    } catch (e) {
      setNotFound(true)
    }

    setLoading(false)
  }

  async function rateTrack(trackId, score) {
    if (!user) { window.location.href = '/auth'; return }
    setSaving(prev => ({ ...prev, [trackId]: true }))
    await supabase.from('ratings').upsert({
      user_id: user.id, track_id: trackId, score,
      album_id: album.id
    }, { onConflict: 'user_id,track_id' })
    setUserRatings(prev => ({ ...prev, [trackId]: score }))
    setSaving(prev => ({ ...prev, [trackId]: false }))
  }

  async function handleShare() {
    const shareData = {
      title: `${album.name} — Banger Ratios`,
      text: `${album.name} by ${album.artist_name} has a ${album.banger_ratio ?? '?'}% Banger Ratio on Banger Ratios`,
      url: window.location.href,
    }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch (e) {}
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copied!')
    }
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>

  if (notFound || !album) return (
    <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Album Not Found</h1>
      <p style={{ color: 'var(--gray-text)', marginBottom: 20 }}>
        This album is not in our database and could not be found on iTunes.
        The link may be outdated.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="/albums" style={{
          background: 'var(--pink)', color: 'white',
          padding: '10px 24px', borderRadius: 10, fontWeight: 700,
          fontSize: 14, textDecoration: 'none',
        }}>
          Search for an Album
        </a>
        <a href="/leaderboards" style={{
          border: '1px solid var(--border)', color: 'var(--black)',
          padding: '10px 24px', borderRadius: 10, fontWeight: 600,
          fontSize: 14, textDecoration: 'none',
        }}>
          Back to Leaderboard
        </a>
      </div>
    </main>
  )

  const displayRatio = Math.max(5, album.banger_ratio || 0)
  const badge = getBadge(album.banger_ratio || 0)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>

      <div style={{ display: 'flex', gap: 20, marginBottom: 32, alignItems: 'flex-start' }}>
        <img
          src={album.artwork_url?.replace('600x600bb', '300x300bb') || album.artwork_url?.replace('600x600', '300x300')}
          alt={album.name}
          style={{ width: 120, height: 120, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
        />
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{album.name}</h1>
          <p style={{ color: 'var(--gray-text)', marginBottom: 12 }}>{album.artist_name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--pink)' }}>
              {displayRatio}%
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pink)',
              background: 'rgba(255,0,102,0.08)', padding: '4px 10px', borderRadius: 8 }}>
              {badge.label}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--gray-text)', marginTop: 6 }}>
            {album.total_ratings || 0} ratings
          </p>
          <button
            onClick={handleShare}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 20,
              border: '1px solid var(--gray-200)', background: 'white',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: 'var(--black)', marginTop: 12,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-100)'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tracks.map(track => {
          const userScore = userRatings[track.id]
          return (
            <div key={track.id} style={{ background: 'white', borderRadius: 12,
              border: '1px solid var(--border)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>
                    {track.track_number}. {track.name}
                  </p>
                  {track.avg_score > 0 && (
                    <p style={{ fontSize: 12, color: 'var(--gray-text)', marginTop: 2 }}>
                      Community avg: {track.avg_score?.toFixed(1)}
                    </p>
                  )}
                </div>
                {userScore && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pink)',
                    background: 'rgba(255,0,102,0.08)', padding: '3px 10px', borderRadius: 20 }}>
                    {SCORE_LABELS[userScore]} ({userScore})
                  </span>
                )}
              </div>

              {!userScore && (
                <p style={{ fontSize: 11, color: 'var(--gray-text)', textAlign: 'center',
                  marginBottom: 8, fontStyle: 'italic' }}>
                  Rate honestly. 1-4 means it did not hit the banger threshold - that data matters just as much.
                </p>
              )}

              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5, 6, 7].map(score => (
                  <button
                    key={score}
                    onClick={() => rateTrack(track.id, score)}
                    disabled={saving[track.id]}
                    style={{
                      width: 38, height: 38, borderRadius: 8, border: 'none',
                      background: userScore === score
                        ? 'var(--pink)'
                        : score >= 5
                          ? 'rgba(255,0,102,0.08)'
                          : '#F1F5F9',
                      color: userScore === score
                        ? 'white'
                        : score >= 5
                          ? 'var(--pink)'
                          : '#64748B',
                      fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.1s',
                    }}
                    title={SCORE_LABELS[score]}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {user && (
        <button style={{
          padding: '10px 20px', borderRadius: 10, marginTop: 16,
          border: '1px solid var(--border)', background: 'white',
          color: 'var(--gray-text)', fontWeight: 600, fontSize: 13,
          cursor: 'pointer', width: '100%', fontFamily: 'inherit'
        }}
          onClick={() => alert('Lists feature coming soon!')}
        >
          + Save to List
        </button>
      )}
    </div>
  )
}