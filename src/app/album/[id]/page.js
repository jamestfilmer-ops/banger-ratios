'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/app/components/ToastContext'

const SCALE = { 1:'Awful', 2:'Bad', 3:'Meh', 4:'OK', 5:'Good', 6:'Great', 7:'Perfect' }

function getBadge(ratio) {
  if (ratio >= 90) return '💎 Certified Classic'
  if (ratio >= 75) return '🥇 Solid Gold'
  if (ratio >= 60) return '🎵 Hit or Miss'
  if (ratio >= 40) return '⚠️ Filler Warning'
  return '❌ Skip It'
}

const timeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ])

export default function AlbumPage() {
  const { id: albumId } = useParams()

  const [album, setAlbum] = useState(null)
  const [tracks, setTracks] = useState([])
  const [myRatings, setMyRatings] = useState({})
  const [skipped, setSkipped] = useState({})
  const [user, setUser] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    if (albumId) loadAlbum()
  }, [albumId])

  async function loadAlbum() {
    try {
      setError(null)

      const res = await timeout(
        fetch(`https://itunes.apple.com/lookup?id=${albumId}&entity=song`),
        8000
      )
      if (!res.ok) throw new Error(`iTunes API error: ${res.status}`)

      const data = await res.json()
      const results = data.results || []

      const albumData = results.find(r => r.wrapperType === 'collection')
      const trackData = results.filter(r => r.wrapperType === 'track')

      if (!albumData) throw new Error('No album found')

      const { data: dbAlbum, error: upsertErr } = await supabase
        .from('albums')
        .upsert({
          itunes_collection_id: albumData.collectionId,
          name: albumData.collectionName,
          artist_name: albumData.artistName,
          artwork_url: albumData.artworkUrl100?.replace('100x100', '600x600'),
          release_date: albumData.releaseDate?.split('T')[0],
          genre: albumData.primaryGenreName,
          track_count: trackData.length,
        }, { onConflict: 'itunes_collection_id' })
        .select()
        .single()

      if (upsertErr) throw upsertErr

      setAlbum(dbAlbum)

      const trackRows = trackData.map(t => ({
        album_id: dbAlbum.id,
        itunes_track_id: t.trackId,
        name: t.trackName,
        track_number: t.trackNumber,
        duration_ms: t.trackTimeMillis,
        preview_url: t.previewUrl,
      }))

      await supabase
        .from('tracks')
        .upsert(trackRows, { onConflict: 'itunes_track_id' })

      const { data: dbTracks } = await supabase
        .from('tracks')
        .select('*')
        .eq('album_id', dbAlbum.id)
        .order('track_number', { ascending: true })

      setTracks(dbTracks || [])

      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u || null)

      if (u) {
        const { data: existing } = await supabase
          .from('ratings')
          .select('track_id, score')
          .eq('user_id', u.id)
          .eq('album_id', dbAlbum.id)

        const map = {}
        ;(existing || []).forEach(r => map[r.track_id] = r.score)
        setMyRatings(map)
      }

      setLoaded(true)

    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load album')
      setLoaded(true)
    }
  }

  function rate(trackId, score) {
    if (!user) return
    setMyRatings(prev => ({ ...prev, [trackId]: score }))
    setSkipped(prev => {
      const copy = { ...prev }
      delete copy[trackId]
      return copy
    })
    setDirty(true)
    setSaved(false)
  }

  function skip(trackId) {
    setSkipped(prev => ({ ...prev, [trackId]: true }))
    setMyRatings(prev => {
      const copy = { ...prev }
      delete copy[trackId]
      return copy
    })
    setDirty(true)
    setSaved(false)
  }

  function computeOptimisticRatio(currentRatings, trackList) {
    if (!trackList.length) return 0
    const bangerCount = trackList.filter(
      t => (currentRatings[t.id] || 0) >= 5
    ).length
    return Math.round((bangerCount / trackList.length) * 100 * 10) / 10
  }

  async function submitAll() {
    if (!user) return alert('Sign in to rate tracks')

    const ratingEntries = Object.entries(myRatings)
    if (!ratingEntries.length)
      return alert('Rate at least one track')

    const optimisticRatio = computeOptimisticRatio(myRatings, tracks)
    setAlbum(prev => prev ? { ...prev, banger_ratio: optimisticRatio } : prev)

    setSaving(true)

    try {
      const inserts = ratingEntries.map(([trackId, score]) => ({
        user_id: user.id,
        track_id: parseInt(trackId),
        album_id: album.id,
        score,
      }))

      const { error } = await supabase
        .from('ratings')
        .upsert(inserts, { onConflict: 'user_id,track_id' })

      if (error) throw error

      await supabase.rpc('recalculate_banger_ratio', {
        p_album_id: album.id,
      })

      const { data: refreshed } = await supabase
        .from('albums')
        .select('banger_ratio, total_ratings')
        .eq('id', album.id)
        .single()

      if (refreshed)
        setAlbum(prev => prev ? { ...prev, ...refreshed } : prev)

      setSaved(true)
      setDirty(false)

      if (toast)
        toast('Ratings saved! Your Banger Ratio is live.', 'success')

    } catch (err) {
      console.error(err)

      if (toast)
        toast('Something went wrong. Try again.', 'error')
      else alert('Error saving ratings.')

    } finally {
      setSaving(false)
    }
  }

  function msToTime(ms) {
    if (!ms) return ''
    return `${Math.floor(ms/60000)}:${Math.floor((ms%60000)/1000)
      .toString()
      .padStart(2,'0')}`
  }

  if (!loaded)
    return <div style={{ padding: 40 }}>Loading album...</div>

  if (error)
    return <div style={{ padding: 40, color: 'red' }}>{error}</div>

  const myCount = Object.keys(myRatings).length
  const skipCount = Object.keys(skipped).length
  const progress = tracks.length
    ? ((myCount + skipCount) / tracks.length * 100).toFixed(0)
    : 0

  return (
    <div style={{ padding: 40 }}>
      <h1>{album?.name}</h1>
      <p>{album?.artist_name}</p>
      <h2>{album?.banger_ratio || 0}%</h2>

      {tracks.map(track => (
        <div key={track.id} style={{ marginBottom: 10 }}>
          {track.track_number}. {track.name}
          {user && (
            <>
              {[1,2,3,4,5,6,7].map(n => (
                <button
                  key={n}
                  onClick={() => rate(track.id, n)}
                  style={{ marginLeft: 4 }}
                >
                  {n}
                </button>
              ))}
              <button onClick={() => skip(track.id)}>
                Skip
              </button>
            </>
          )}
        </div>
      ))}

      {user && (
        <button
          onClick={submitAll}
          disabled={saving || !dirty}
          style={{ marginTop: 20 }}
        >
          {saving ? 'Saving...' : 'Submit Ratings'}
        </button>
      )}

      <p>{progress}% complete</p>
    </div>
  )
}