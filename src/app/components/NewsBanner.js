'use client'
import { useState, useEffect } from 'react'

const FALLBACK = [
  'Kendrick Lamar holds the top Banger Ratio on the platform ·',
  'Carolina Confessions by Marcus King Band — 100% Banger Ratio ·',
  'Thriller by Michael Jackson — 98% Banger Ratio ·',
  'Rate a new release and add your voice to the community ·',
  'Purple Rain by Prince — 97% Banger Ratio ·',
  'Frank Ocean Blonde — 94% and climbing ·',
  'Rumours by Fleetwood Mac — still 96% after all these years ·',
  'New to Banger Ratios? Search any album and start rating ·',
  'Illmatic by Nas — 95% Banger Ratio ·',
  'JAY-Z The Blueprint — 93% Banger Ratio ·',
]

export default function NewsBanner() {
  const [headlines, setHeadlines] = useState(FALLBACK)

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_LASTFM_KEY
    if (!key) return
    fetch(`https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${key}&format=json&limit=30`)
      .then(r => r.json())
      .then(d => {
        const items = d?.tracks?.track
        if (!items?.length) return
        const seen = new Set()
        const deduped = []
        for (const t of items) {
          const artistKey = t.artist.name.toLowerCase()
          if (seen.has(artistKey)) continue
          seen.add(artistKey)
          deduped.push(`${t.name} by ${t.artist.name} is trending ·`)
          if (deduped.length >= 10) break
        }
        if (deduped.length) setHeadlines(deduped)
      })
      .catch(() => {})
  }, [])

  const doubled = [...headlines, ...headlines]

  return (
    <div style={{
      background: 'var(--pink)', color: 'white', overflow: 'hidden',
      whiteSpace: 'nowrap', padding: '8px 0', fontSize: 12, fontWeight: 500,
    }}>
      <div style={{
        display: 'inline-block',
        animation: 'scroll-left 90s linear infinite',
      }}>
        {doubled.map((h, i) => (
          <span key={i} style={{ marginRight: 48 }}>{h}</span>
        ))}
      </div>
    </div>
  )
}
