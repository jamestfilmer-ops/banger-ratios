'use client'
 
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
 
export default function TastePage() {
  const [username, setUsername] = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
 
  async function compare(e) {
    e.preventDefault()
    setError(''); setResult(null)
    if (!username.trim()) return
    setLoading(true)
 
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sign in to compare taste.'); setLoading(false); return }
 
    // Get the other user's profile
    const { data: other } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .ilike('username', username.trim())
      .single()
 
    if (!other) { setError('User not found. Check the username.'); setLoading(false); return }
    if (other.id === user.id) { setError('That is you! Try someone else.'); setLoading(false); return }
 
    // Get both users' ratings
    const [{ data: myRatings }, { data: theirRatings }] = await Promise.all([
      supabase.from('ratings').select('track_id, score, tracks(name, albums(name, artwork_url))').eq('user_id', user.id),
      supabase.from('ratings').select('track_id, score, tracks(name, albums(name, artwork_url))').eq('user_id', other.id),
    ])
 
    if (!myRatings?.length || !theirRatings?.length) {
      setError('Not enough ratings to compare. Rate more albums first.')
      setLoading(false); return
    }
 
    // Build maps
    const myMap    = {}
    const trackMeta = {}
    myRatings.forEach(r => {
      myMap[r.track_id] = r.score
      trackMeta[r.track_id] = r.tracks
    })
    const theirMap = {}
    theirRatings.forEach(r => { theirMap[r.track_id] = r.score })
 
    // Find shared tracks
    const sharedIds = Object.keys(myMap).filter(id => theirMap[id])
 
    if (sharedIds.length < 3) {
      setError(`You both need to rate at least 3 of the same tracks. You share ${sharedIds.length}.`)
      setLoading(false); return
    }
 
    // Calculate score
    const diffs = sharedIds.map(id => ({
      id,
      meta: trackMeta[id],
      mine: myMap[id],
      theirs: theirMap[id],
      diff: Math.abs(myMap[id] - theirMap[id]),
      agreement: 1 - Math.abs(myMap[id] - theirMap[id]) / 6,
    }))
 
    const score = Math.round((diffs.reduce((a, b) => a + b.agreement, 0) / diffs.length) * 100)
 
    // Top agreements and disagreements
    const sorted = [...diffs].sort((a, b) => a.diff - b.diff)
    const topAgreements   = sorted.slice(0, 5)
    const topDisagreements = sorted.slice(-5).reverse()
 
    // Get my profile
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', user.id)
      .single()
 
    setResult({ score, sharedIds, topAgreements, topDisagreements, other, myProfile })
    setLoading(false)
  }
 
  function scoreColor(s) {
    if (s >= 85) return '#16a34a'
    if (s >= 70) return '#FF0066'
    if (s >= 50) return '#D97706'
    return '#6B7280'
  }
 
  function scoreLabel(s) {
    if (s >= 90) return 'Music Twins 🎯'
    if (s >= 80) return 'Very Compatible 🔥'
    if (s >= 70) return 'Solid Match 💪'
    if (s >= 60) return 'Some Common Ground 🤝'
    if (s >= 50) return 'Different Tastes 🎭'
    return 'Polar Opposites ❄️'
  }
 
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>🎧 Taste Match</h1>
      <p style={{ color: 'var(--gray-text)', fontSize: 14, marginBottom: 28 }}>
        Compare your music taste with anyone on Banger Ratios.
      </p>
 
      {/* Search form */}
      <form onSubmit={compare} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <input
          type='text'
          placeholder='Enter their username...'
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{
            flex: 1, padding: '11px 16px', borderRadius: 10,
            border: '1.5px solid var(--border)', fontSize: 14,
            outline: 'none', fontFamily: 'inherit',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--pink)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button type='submit' style={{
          padding: '11px 22px', background: 'var(--pink)', border: 'none',
          color: 'white', borderRadius: 10, fontWeight: 600, cursor: 'pointer',
          fontSize: 14, fontFamily: 'inherit',
        }}>
          {loading ? '...' : 'Compare'}
        </button>
      </form>
 
      {error && (
        <div style={{ background: '#FFF1F1', border: '1px solid #FFD0D0', borderRadius: 10,
          padding: '12px 16px', marginBottom: 24, color: '#CC0000', fontSize: 14 }}>
          {error}
        </div>
      )}
 
      {result && (
        <div>
          {/* Big score card */}
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid var(--border)',
            padding: '32px 24px', marginBottom: 20, textAlign: 'center',
          }}>
            {/* User names */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--pink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 20, margin: '0 auto 6px' }}>
                  {(result.myProfile?.username?.[0] || '?').toUpperCase()}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {result.myProfile?.display_name || result.myProfile?.username || 'You'}
                </div>
              </div>
              <div style={{ fontSize: 24, color: 'var(--gray-400)' }}>vs</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#6B7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 20, margin: '0 auto 6px' }}>
                  {(result.other.username?.[0] || '?').toUpperCase()}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {result.other.display_name || result.other.username}
                </div>
              </div>
            </div>
 
            {/* Score */}
            <div style={{ fontSize: 72, fontWeight: 800, color: scoreColor(result.score), lineHeight: 1 }}>
              {result.score}%
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 8, marginBottom: 4 }}>
              {scoreLabel(result.score)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-text)' }}>
              Based on {result.sharedIds.length} tracks you both rated
            </div>
 
            {/* Share button */}
            <button
              onClick={() => {
                const text = `My music taste matches ${result.other.username} ${result.score}% on Banger Ratios! ${scoreLabel(result.score)} — bangerratios.com/taste`
                if (navigator.share) {
                  navigator.share({ text })
                } else {
                  navigator.clipboard.writeText(text)
                  alert('Copied to clipboard!')
                }
              }}
              style={{
                marginTop: 20, padding: '10px 24px', background: 'var(--pink)',
                border: 'none', color: 'white', borderRadius: 10,
                fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              📤 Share Result
            </button>
          </div>
 
          {/* Top agreements */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)',
            padding: '20px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#16a34a' }}>
              ✅ Biggest Agreements
            </h2>
            {result.topAgreements.map((t, i) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '8px 0',
                borderBottom: i < result.topAgreements.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{t.meta?.name || 'Track'}</div>
                  <div style={{ color: 'var(--gray-text)', fontSize: 11 }}>{t.meta?.albums?.name}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {t.mine}/7 · {t.theirs}/7
                </div>
              </div>
            ))}
          </div>
 
          {/* Top disagreements */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)',
            padding: '20px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#CC0000' }}>
              ❌ Biggest Disagreements
            </h2>
            {result.topDisagreements.map((t, i) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '8px 0',
                borderBottom: i < result.topDisagreements.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{t.meta?.name || 'Track'}</div>
                  <div style={{ color: 'var(--gray-text)', fontSize: 11 }}>{t.meta?.albums?.name}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#CC0000' }}>
                  You: {t.mine}/7 · Them: {t.theirs}/7
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
