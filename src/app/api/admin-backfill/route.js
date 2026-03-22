import { createClient } from '@supabase/supabase-js'

// Admin backfill: fixes null artwork_url and 0-track albums
// Also returns a diagnostic list of still-broken albums
// Call via: GET /api/admin-backfill?secret=br_backfill_2026
// Diagnostic only: GET /api/admin-backfill?secret=br_backfill_2026&diagnose=1
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const diagnoseOnly = searchParams.get('diagnose') === '1'

  if (secret !== 'br_backfill_2026') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  function fixArtwork(url) {
    if (!url) return null
    return url
      .replace('100x100bb', '600x600bb')
      .replace('100x100bb.jpg', '600x600bb.jpg')
      .replace('/100x100/', '/600x600/')
      .replace('100x100', '600x600')
  }

  // Get all albums
  const { data: albums, error: fetchErr } = await supabase
    .from('albums')
    .select('id, itunes_collection_id, artwork_url, track_count, name, artist_name')

  if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 500 })

  // If diagnose mode, just report what's broken
  if (diagnoseOnly) {
    const broken = albums.filter(a =>
      !a.artwork_url || a.artwork_url.includes('100x100') || !a.track_count || a.track_count === 0
    ).map(a => ({
      name: a.name,
      artist: a.artist_name,
      itunes_id: a.itunes_collection_id,
      artwork_url: a.artwork_url,
      track_count: a.track_count,
    }))
    return Response.json({ total: albums.length, broken: broken.length, broken_list: broken })
  }

  const results = { artworkFixed: 0, tracksFixed: 0, skipped: 0, errors: [] }

  for (const album of albums) {
    const needsArtwork = !album.artwork_url || album.artwork_url.includes('100x100')
    const needsTracks = !album.track_count || album.track_count === 0

    if (!needsArtwork && !needsTracks) { results.skipped++; continue }
    if (!album.itunes_collection_id) {
      results.errors.push({ album: album.name, error: 'no iTunes ID' })
      continue
    }

    try {
      await new Promise(r => setTimeout(r, 300))

      const res = await fetch(
        `https://itunes.apple.com/lookup?id=${album.itunes_collection_id}&entity=song`
      )
      const data = await res.json()
      const iTunesAlbum = data.results?.find(r => r.wrapperType === 'collection')
      const iTunesTracks = data.results?.filter(r => r.wrapperType === 'track') || []

      if (!iTunesAlbum) {
        results.errors.push({ album: album.name, error: 'not found on iTunes' })
        continue
      }

      if (needsArtwork && iTunesAlbum.artworkUrl100) {
        const newArt = fixArtwork(iTunesAlbum.artworkUrl100)
        await supabase.from('albums').update({ artwork_url: newArt }).eq('id', album.id)
        results.artworkFixed++
      }

      if (needsTracks && iTunesTracks.length > 0) {
        const trackRows = iTunesTracks.map(t => ({
          album_id: album.id,
          itunes_track_id: t.trackId,
          name: t.trackName,
          track_number: t.trackNumber,
          duration_ms: t.trackTimeMillis,
          preview_url: t.previewUrl || null,
        }))
        await supabase.from('tracks').upsert(trackRows, { onConflict: 'itunes_track_id' })
        await supabase.from('albums').update({ track_count: iTunesTracks.length }).eq('id', album.id)
        results.tracksFixed++
      }
    } catch (e) {
      results.errors.push({ album: album.name, error: e.message })
    }
  }

  return Response.json({ success: true, total: albums.length, ...results })
}
