'use client'
import { useState, useEffect } from 'react'

// Artists confirmed deceased — show Legacy link instead of concert tickets
// Add names exactly as they appear in iTunes artist_name field
const DECEASED_ARTISTS = new Set([
  'Michael Jackson', 'Prince', 'Whitney Houston', 'Amy Winehouse',
  'Tupac Shakur', 'The Notorious B.I.G.', 'Biggie Smalls',
  'Aaliyah', 'Juice WRLD', 'XXXTentacion', 'Pop Smoke', 'Nipsey Hussle',
  'Mac Miller', 'Avicii', 'Chester Bennington', 'Chris Cornell',
  'Tom Petty', 'David Bowie', 'Lou Reed', 'Leonard Cohen',
  'Freddie Mercury', 'Elvis Presley', 'John Lennon', 'Kurt Cobain',
  'Jim Morrison', 'Jimi Hendrix', 'Janis Joplin', 'Bob Marley',
  'Johnny Cash', 'Ray Charles', 'Marvin Gaye', 'Sam Cooke',
  'Otis Redding', 'Billie Holiday', 'Nina Simone', 'Frank Sinatra',
  'Miles Davis', 'John Coltrane',
])

export default function ArtistPanel({ artist, albums, onClose }) {
  const [bio, setBio] = useState(null)

  useEffect(() => {
    if (!artist) { setBio(null); return }
    const name = encodeURIComponent(artist)
    fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${name}&api_key=f6de418e7c3b44cc5f80b1a5e11e5823&format=json`)
      .then(r => r.json())
      .then(d => {
        const raw = d?.artist?.bio?.summary || ''
        // Strip the "Read more on Last.fm" link that Last.fm appends
        const clean = raw.replace(/<a[^>]*>.*?<\/a>/gi, '').replace(/\s+/g, ' ').trim()
        // Take only the first 2 sentences
        const sentences = clean.match(/[^.!?]+[.!?]+/g) || []
        setBio(sentences.slice(0, 2).join(' ').trim() || null)
      })
      .catch(() => setBio(null))
  }, [artist])

  if (!artist) return null

  const topAlbums = albums
    .filter(a => a.artist_name === artist)
    .sort((a, b) => b.banger_ratio - a.banger_ratio)
    .slice(0, 3)

  const topArtwork = topAlbums[0]?.artwork_url?.replace('600x600', '300x300')
  const isDeceased = DECEASED_ARTISTS.has(artist)

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 300, backdropFilter: 'blur(4px)',
      }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 400,
        background: 'white', borderRadius: '20px 20px 0 0',
        padding: '28px 24px 40px', maxHeight: '75vh', overflowY: 'auto',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
      }}>

        {/* Handle */}
        <div onClick={onClose} style={{
          width: 40, height: 4, background: '#DDD', borderRadius: 4,
          margin: '0 auto 24px', cursor: 'pointer',
        }} />

        {/* Artist header */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 28 }}>
          {topArtwork && (
            <img src={topArtwork} alt={artist} style={{
              width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
              border: '3px solid var(--pink)',
            }} />
          )}
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
              {artist}
              {isDeceased && (
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-text)', marginLeft: 8 }}>
                  (1940–)
                </span>
              )}
            </h2>
            {bio && (
              <p style={{
                fontSize: 13,
                color: 'var(--gray-text)',
                lineHeight: 1.6,
                marginTop: 6,
                marginBottom: 12,
                fontStyle: 'italic',
              }}>
                {bio}
              </p>
            )}
            <p style={{ fontSize: 13, color: 'var(--gray-text)' }}>
              {topAlbums.length} album{topAlbums.length !== 1 ? 's' : ''} rated on Banger Ratios
            </p>
          </div>
        </div>

        {/* Top albums */}
        {topAlbums.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-text)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Top Rated Albums
            </h3>
            {topAlbums.map((a, i) => (
              <a key={a.id} href={`/album/${a.itunes_collection_id}`} style={{
                display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0',
                borderBottom: i < topAlbums.length - 1 ? '1px solid var(--border)' : 'none',
                textDecoration: 'none', color: 'inherit',
              }}>
                <img src={a.artwork_url?.replace('600x600','80x80')} alt={a.name}
                  style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--gray-text)' }}>{a.total_ratings} ratings</p>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--pink)' }}>
                  {a.banger_ratio}%
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Action buttons — DECEASED gets Legacy link, living artist gets concerts */}
        <div style={{ display: 'flex', gap: 10 }}>
          {isDeceased ? (
            <>
              <a
                href={`https://en.wikipedia.org/wiki/${encodeURIComponent(artist)}`}
                target='_blank' rel='noreferrer'
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10,
                  background: '#1a1a1a', color: 'white',
                  fontWeight: 700, fontSize: 14, textAlign: 'center', textDecoration: 'none',
                }}
              >
                📖 Legacy & History
              </a>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(artist+' discography')}`}
                target='_blank' rel='noreferrer'
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10,
                  border: '1px solid var(--border)', color: 'var(--black)',
                  fontWeight: 700, fontSize: 14, textAlign: 'center', textDecoration: 'none',
                }}
              >
                🎵 Full Discography
              </a>
            </>
          ) : (
            <>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(artist+' concert tickets')}`}
                target='_blank' rel='noreferrer'
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10,
                  background: 'var(--pink)', color: 'white',
                  fontWeight: 700, fontSize: 14, textAlign: 'center', textDecoration: 'none',
                }}
              >
                🎟 Find Concerts
              </a>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(artist+' official website')}`}
                target='_blank' rel='noreferrer'
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10,
                  border: '1px solid var(--border)', color: 'var(--black)',
                  fontWeight: 700, fontSize: 14, textAlign: 'center', textDecoration: 'none',
                }}
              >
                🌐 Website
              </a>
            </>
          )}
        </div>
      </div>
    </>
  )
}