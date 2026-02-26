// FILE: src/app/leaderboards/page.js
// Cmd+A → Delete → Paste

'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const GENRES = ['All','Hip-Hop/Rap','Pop','Rock','R&B/Soul','Alternative','Country','Electronic','Jazz','Metal','Latin']
const DECADES = ['All','2020s','2010s','2000s','1990s','1980s','1970s','1960s']

const RIVALRIES = [
  { a: 'Kendrick Lamar', b: 'Drake',          context: '2024 — The biggest rap beef in a generation. Kendrick\'s "Not Like Us" vs Drake\'s "Family Matters".' },
  { a: 'Tupac',          b: 'Biggie',          context: '1994-1997 — East Coast vs West Coast. The rivalry that defined an era.' },
  { a: 'Jay-Z',          b: 'Nas',             context: '2001 — "Takeover" vs "Ether". Still debated as the greatest diss battle ever.' },
  { a: 'Eminem',         b: 'Ja Rule',         context: '2001-2003 — Eminem and 50 Cent dismantled Ja Rule\'s entire career.' },
  { a: 'Ice Cube',       b: 'N.W.A',           context: '1990 — Cube left the group and fired back with "No Vaseline".' },
  { a: 'Common',         b: 'Ice Cube',        context: '1994 — "The Bitch in Yoo" vs "Westside Slaughterhouse". Chicago vs LA.' },
  { a: 'Jay-Z',          b: 'Cam\'ron',        context: '2004 — Cam\'ron\'s "Killa Cam" era challenged Jay\'s dominance.' },
  { a: 'Meek Mill',      b: 'Drake',           context: '2015 — Meek accused Drake of ghostwriting. Drake\'s "Back to Back" won a Grammy.' },
  { a: 'Nicki Minaj',    b: 'Cardi B',         context: '2018-present — The defining female rap rivalry of the streaming era.' },
  { a: 'Kanye West',     b: '50 Cent',         context: '2007 — Sales battle. Kanye\'s "Graduation" vs 50\'s "Curtis". Kanye won decisively.' },
  { a: 'Lil Wayne',      b: 'Jay-Z',           context: '2009 — Wayne declared himself best rapper alive. Jay responded with "D.O.A.".' },
  { a: 'Tyler the Creator', b: 'Earl Sweatshirt', context: '2013 — OFWGKTA internal creative tension that shaped alternative rap.' },
  { a: 'Pusha T',        b: 'Drake',           context: '2018 — "The Story of Adidon" exposed Drake\'s secret son. Widely seen as Pusha\'s win.' },
  { a: 'LL Cool J',      b: 'Canibus',         context: '1997 — Canibus started it on "2nd Round K.O.", LL finished it on "The Ripper Strikes Back".' },
  { a: 'Roxanne Shante', b: 'UTFO',            context: '1984 — The original rap beef. Sparked the "Roxanne Wars" with dozens of response records.' },
  { a: 'KRS-One',        b: 'MC Shan',         context: '1987 — The Bridge Wars. Bronx vs Queens. KRS-One\'s "South Bronx" is a landmark track.' },
  { a: 'Lil Kim',        b: 'Nicki Minaj',     context: '2010 — The veteran vs the heir. Kim felt Nicki appropriated her style.' },
  { a: 'Future',         b: 'Ciara',           context: '2015-2016 — Public breakup turned into lyrical shots on both sides.' },
  { a: 'Lil Wayne',      b: 'Birdman',         context: '2015-2016 — Wayne sued his own label Cash Money for $51M. The business side of beef.' },
  { a: 'Big L',          b: 'Jay-Z',           context: '1995 — Harlem freestyle battle legend. Big L\'s technical skill vs Jay\'s commercial rise.' },
]

function getBadge(r) {
  if (r >= 90) return { label: 'Classic', color: '#7C3AED' }
  if (r >= 75) return { label: 'Gold',    color: '#D97706' }
  if (r >= 60) return { label: 'Hit',     color: '#059669' }
  if (r >= 40) return { label: 'Filler',  color: '#6B7280' }
  return       { label: 'Skip',           color: '#DC2626' }
}

// ── Dropdown component ─────────────────────────────────────────────────────
function Dropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isFiltered = value !== 'All'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 16px', borderRadius: 9,
          border: `1.5px solid ${isFiltered ? 'var(--pink)' : 'var(--border)'}`,
          background: isFiltered ? 'rgba(255,0,102,0.05)' : 'white',
          color: isFiltered ? 'var(--pink)' : 'var(--black)',
          fontWeight: isFiltered ? 600 : 500,
          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{label}{isFiltered ? `: ${value}` : ''}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.15s' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: 'white', border: '1px solid var(--border)', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100,
          minWidth: 160, maxHeight: 260, overflowY: 'auto',
        }}>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 14px', border: 'none', background: 'none',
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                color: opt === value ? 'var(--pink)' : 'var(--black)',
                fontWeight: opt === value ? 600 : 400,
                borderBottom: '1px solid var(--border)',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-soft)'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Artist popup modal ─────────────────────────────────────────────────────
function ArtistModal({ artist, onClose }) {
  const [data, setData] = useState(null)
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Last.fm artist info
      const key = process.env.NEXT_PUBLIC_LASTFM_KEY
      if (key) {
        try {
          const r = await fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artist)}&api_key=${key}&format=json`)
          const d = await r.json()
          if (d.artist) setData(d.artist)
        } catch {}
      }
      // Albums from Supabase
      const { data: dbAlbums } = await supabase
        .from('albums').select('*')
        .ilike('artist_name', `%${artist}%`)
        .gt('total_ratings', 0)
        .order('banger_ratio', { ascending: false })
        .limit(8)
      setAlbums(dbAlbums || [])
      setLoading(false)
    }
    load()
  }, [artist])

  const bio = data?.bio?.summary?.replace(/<a[^>]*>.*?<\/a>/g, '').replace(/<[^>]+>/g, '').trim()
  const imgUrl = data?.image?.find(i => i.size === 'extralarge')?.['#text']

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>{artist}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--gray-text)', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '16px 24px 24px' }}>
          {loading ? (
            <p style={{ color: 'var(--gray-text)', textAlign: 'center', padding: '40px 0' }}>Loading...</p>
          ) : (
            <>
              {/* Artist photo + bio */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                {imgUrl && (
                  <img src={imgUrl} alt={artist} style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                )}
                {bio && (
                  <p style={{ fontSize: 13, color: 'var(--gray-text)', lineHeight: 1.6 }}>
                    {bio.length > 300 ? bio.slice(0, 300) + '...' : bio}
                  </p>
                )}
              </div>

              {/* Rated albums on Banger Ratios */}
              {albums.length > 0 && (
                <>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--gray-text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Rated on Banger Ratios
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {albums.map(a => {
                      const badge = getBadge(a.banger_ratio)
                      return (
                        <a key={a.id} href={`/album/${a.itunes_collection_id}`} onClick={onClose}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border)', transition: 'background 0.12s' }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-soft)'}
                          onMouseOut={e => e.currentTarget.style.background = ''}
                        >
                          {a.artwork_url && <img src={a.artwork_url.replace('600x600','80x80')} alt="" style={{ width: 36, height: 36, borderRadius: 6 }} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                            <p style={{ fontSize: 11, color: 'var(--gray-text)' }}>{a.total_ratings} ratings</p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: badge.color }}>{a.banger_ratio}%</span>
                        </a>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Concert tickets link */}
              <a
                href={`https://www.songkick.com/search?query=${encodeURIComponent(artist)}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px', borderRadius: 9, background: 'var(--pink)', color: 'white',
                  fontWeight: 600, fontSize: 14, textDecoration: 'none',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                Find Concert Tickets
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function LeaderboardsPage() {
  const [albums, setAlbums]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [genre, setGenre]         = useState('All')
  const [decade, setDecade]       = useState('All')
  const [tab, setTab]             = useState('top') // 'top' | 'rivalry'
  const [modalArtist, setModalArtist] = useState(null)

  useEffect(() => { load() }, [genre, decade])

  async function load() {
    setLoading(true)
    let q = supabase.from('albums').select('*').gt('total_ratings', 0).order('banger_ratio', { ascending: false }).limit(100)
    if (genre !== 'All') q = q.eq('genre', genre)
    if (decade !== 'All') {
      const start = parseInt(decade)
      q = q.gte('release_date', `${start}-01-01`).lte('release_date', `${start + 9}-12-31`)
    }
    const { data } = await q
    setAlbums(data || [])
    setLoading(false)
  }

  const isFiltered = genre !== 'All' || decade !== 'All'

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px 80px' }}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, marginBottom: 4 }}>Leaderboards</h1>
        <p style={{ color: 'var(--gray-text)', fontSize: 14 }}>Community-ranked albums by Banger Ratio</p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-soft)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[['top', 'Top Albums'], ['rivalry', 'Rap Rivalries']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            background: tab === key ? 'white' : 'transparent',
            color: tab === key ? 'var(--pink)' : 'var(--gray-text)',
            boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* ── TOP ALBUMS TAB ──────────────────────────────────────────────── */}
      {tab === 'top' && (
        <>
          {/* Filters row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <Dropdown label="Genre"  value={genre}  options={GENRES}  onChange={setGenre} />
            <Dropdown label="Decade" value={decade} options={DECADES} onChange={setDecade} />
            {isFiltered && (
              <button onClick={() => { setGenre('All'); setDecade('All') }} style={{
                padding: '9px 14px', borderRadius: 9, border: '1px solid var(--border)',
                background: 'white', color: 'var(--gray-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Clear filters
              </button>
            )}
            <span style={{ fontSize: 12, color: 'var(--gray-text)', marginLeft: 'auto' }}>
              {loading ? 'Loading...' : `${albums.length} albums`}
            </span>
          </div>

          {/* Album list */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ height: 64, borderRadius: 10, background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.4s ease infinite' }} />
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>—</p>
              <p style={{ color: 'var(--gray-text)' }}>No albums match these filters. Try a different combination.</p>
              <button onClick={() => { setGenre('All'); setDecade('All') }} style={{ marginTop: 16, padding: '10px 24px', background: 'var(--pink)', color: 'white', border: 'none', borderRadius: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {albums.map((a, i) => {
                const badge = getBadge(a.banger_ratio)
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 10, transition: 'background 0.12s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-soft)'}
                    onMouseOut={e => e.currentTarget.style.background = ''}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700, color: i < 3 ? 'var(--pink)' : '#ccc', width: 28, textAlign: 'center', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <a href={`/album/${a.itunes_collection_id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, textDecoration: 'none' }}>
                      {a.artwork_url && (
                        <img src={a.artwork_url.replace('600x600','80x80')} alt="" style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }} />
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--black)' }}>{a.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--gray-text)' }}>{a.artist_name} · {a.total_ratings} ratings</p>
                      </div>
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.color + '15', padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5 }}>{badge.label}</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--pink)', width: 56, textAlign: 'right' }}>{a.banger_ratio}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── RIVALRY TAB ────────────────────────────────────────────────── */}
      {tab === 'rivalry' && (
        <>
          <p style={{ color: 'var(--gray-text)', fontSize: 14, marginBottom: 24 }}>
            The 20 most iconic rap beefs. Click an artist to see their Banger Ratios discography.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {RIVALRIES.map((r, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pink)', width: 24, flexShrink: 0 }}>#{i + 1}</span>
                  <button onClick={() => setModalArtist(r.a)} style={{
                    padding: '6px 14px', borderRadius: 7, border: '1.5px solid var(--pink)',
                    background: 'rgba(255,0,102,0.04)', color: 'var(--pink)',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{r.a}</button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-text)' }}>vs</span>
                  <button onClick={() => setModalArtist(r.b)} style={{
                    padding: '6px 14px', borderRadius: 7, border: '1.5px solid var(--pink)',
                    background: 'rgba(255,0,102,0.04)', color: 'var(--pink)',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{r.b}</button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--gray-text)', lineHeight: 1.5, paddingLeft: 36 }}>{r.context}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Artist modal */}
      {modalArtist && <ArtistModal artist={modalArtist} onClose={() => setModalArtist(null)} />}
    </div>
  )
}