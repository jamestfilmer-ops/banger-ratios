'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const GENRES  = ['All','Hip-Hop/Rap','Pop','Rock','R&B/Soul','Alternative','Country','Electronic','Jazz','Metal']
const DECADES = ['All','2020s','2010s','2000s','1990s','1980s','1970s']

function getBadge(r) {
  if (r >= 90) return '💎'
  if (r >= 75) return '🥇'
  if (r >= 60) return '🎵'
  return ''
}

export default function LeaderboardsPage() {
  const [albums, setAlbums] = useState([])
  const [genre,  setGenre]  = useState('All')
  const [decade, setDecade] = useState('All')
  const [tab,    setTab]    = useState('albums')
  const [mode,   setMode]   = useState('top')

  useEffect(() => {
    load()
  }, [genre, decade, mode])

  async function load() {
    let q = supabase
      .from('albums')
      .select('*')
      .gt('total_ratings', 0)
      .limit(50)

    if (genre !== 'All') {
      q = q.eq('genre', genre)
    }

    if (decade !== 'All') {
      const start = parseInt(decade)
      q = q
        .gte('release_date', `${start}-01-01`)
        .lte('release_date', `${start + 9}-12-31`)
    }

    if (mode === 'top') {
      q = q.order('banger_ratio', { ascending: false })
    }

    if (mode === 'most') {
      q = q.order('total_ratings', { ascending: false })
    }

    if (mode === 'gems') {
      q = q
        .lte('total_ratings', 15)
        .order('banger_ratio', { ascending: false })
    }

    const { data, error } = await q
    if (!error) setAlbums(data || [])
  }

  const pill = (label, active, onClick) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 20,
        border: '1px solid ' + (active ? 'var(--pink)' : 'var(--gray-200)'),
        background: active ? 'rgba(255,0,102,0.06)' : 'white',
        color: active ? 'var(--pink)' : 'var(--gray-600)',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
        Leaderboards
      </h1>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[
          ['top', 'Top Rated'],
          ['most', 'Most Rated'],
          ['gems', 'Hidden Gems']
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: '1px solid ' + (mode === key ? 'var(--pink)' : 'var(--gray-200)'),
              background: mode === key ? 'rgba(255,0,102,0.06)' : 'white',
              color: mode === key ? 'var(--pink)' : 'var(--gray-600)',
              fontSize: 12,
              fontWeight: mode === key ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
          {GENRES.map(g => pill(g, genre === g, () => setGenre(g)))}
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {DECADES.map(d => pill(d, decade === d, () => setDecade(d)))}
        </div>
      </div>

      {/* Albums */}
      {albums.map((a, i) => (
        <a
          key={a.id}
          href={`/album/${a.itunes_collection_id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px',
            borderRadius: 10,
            marginBottom: 4,
            textDecoration: 'none'
          }}
        >
          <span style={{ fontWeight: 700, width: 24 }}>
            {i + 1}
          </span>

          {a.artwork_url && (
            <img
              src={a.artwork_url.replace('600x600','80x80')}
              alt=""
              style={{ width: 40, height: 40, borderRadius: 6 }}
            />
          )}

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{a.name}</div>
            <div style={{ fontSize: 12, color: '#777' }}>
              {a.artist_name}
            </div>
          </div>

          <div style={{ fontWeight: 700 }}>
            {a.banger_ratio}% {getBadge(a.banger_ratio)}
          </div>
        </a>
      ))}

      {albums.length === 0 && (
        <p style={{ textAlign: 'center', padding: 40 }}>
          No albums yet.
        </p>
      )}
    </div>
  )
}