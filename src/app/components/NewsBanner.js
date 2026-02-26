// FILE: src/app/components/NewsBanner.js
// Cmd+A → Delete → Paste

'use client'

import { useState, useEffect } from 'react'

const FALLBACK = [
  { text: 'Kendrick Lamar announces Grand National Tour 2025', url: 'https://www.google.com/search?q=Kendrick+Lamar+Grand+National+Tour+2025' },
  { text: 'Taylor Swift breaks all-time streaming record', url: 'https://www.google.com/search?q=Taylor+Swift+streaming+record+2025' },
  { text: 'Frank Ocean reportedly working on new album', url: 'https://www.google.com/search?q=Frank+Ocean+new+album+2025' },
  { text: 'Billie Eilish drops surprise EP', url: 'https://www.google.com/search?q=Billie+Eilish+new+music+2025' },
  { text: 'The Weeknd announces Hurry Up Tomorrow album', url: 'https://www.google.com/search?q=The+Weeknd+Hurry+Up+Tomorrow' },
  { text: 'Sabrina Carpenter tops charts for 10th week', url: 'https://www.google.com/search?q=Sabrina+Carpenter+charts+2025' },
  { text: 'Beyonce Renaissance World Tour wrap-up', url: 'https://www.google.com/search?q=Beyonce+2025+music' },
]

export default function NewsBanner() {
  const [headlines, setHeadlines] = useState(FALLBACK)

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_LASTFM_KEY
    if (!key) return
    fetch(`https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${key}&format=json&limit=10`)
      .then(r => r.json())
      .then(d => {
        const items = d?.tracks?.track
        if (items?.length) {
          setHeadlines(items.map(t => ({
            text: `${t.name} by ${t.artist.name} is trending`,
            // Last.fm artist page — real link, no API key needed in browser
            url: `https://www.last.fm/music/${encodeURIComponent(t.artist.name)}`,
          })))
        }
      })
      .catch(() => {})
  }, [])

  // Duplicate for seamless loop
  const doubled = [...headlines, ...headlines]

  return (
    <div style={{
      background: 'var(--pink)', color: 'white', overflow: 'hidden',
      whiteSpace: 'nowrap', padding: '7px 0', fontSize: 12, fontWeight: 500,
      userSelect: 'none',
    }}>
      <div style={{
        display: 'inline-block',
        animation: 'scroll-left 90s linear infinite',
      }}>
        {doubled.map((h, i) => (
          <a
            key={i}
            href={h.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'white',
              textDecoration: 'none',
              marginRight: 48,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              opacity: 0.95,
              transition: 'opacity 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.textDecoration = 'underline' }}
            onMouseOut={e => { e.currentTarget.style.opacity = '0.95'; e.currentTarget.style.textDecoration = 'none' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="5" cy="5" r="4.5" fill="rgba(255,255,255,0.3)"/>
              <path d="M3.5 5h3M5 3.5L6.5 5 5 6.5" stroke="white" strokeWidth="0.8" strokeLinecap="round"/>
            </svg>
            {h.text}
          </a>
        ))}
      </div>
    </div>
  )
}