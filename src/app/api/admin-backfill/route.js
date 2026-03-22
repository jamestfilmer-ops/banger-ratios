import { createClient } from '@supabase/supabase-js'

// One-time admin backfill: fixes null artwork_url and 0-track albums
// Call via: GET /api/admin-backfill?secret=br_backfill_2026
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
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
    .select('id, itunes_collection_id, artwork_url, track_count, name')

  if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 500 })

  const results = { artworkFixed: 0, tracksFixed: 0, errors: [] }

  for (const album of albums) {
    const needsArtwork = !album.artwork_url || album.artwork_url.includes('100x100')
    const needsTracks = !album.track_count || album.track_count === 0

    if (!needsArtwork && !needsTracks) continue
    if (!album.itunes_collection_id) continue

    try {
      await new Promise(r => setTimeout(r, 300)) // rate limit iTunes

      const res = await fetch(
        `https://itunes.apple.com/lookup?id=${album.itunes_collection_id}&entity=song`
      )
      const data = await res.json()
      const iTunesAlbum = data.results?.find(r => r.wrapperType === 'collection')
      const iTunesTracks = data.results?.filter(r => r.wrapperType === 'track') || []

      if (!iTunesAlbum) continue

      // Fix artwork
      if (needsArtwork && iTunesAlbum.artworkUrl100) {
        const newArt = fixArtwork(iTunesAlbum.artworkUrl100)
        await supabase
          .from('albums')
          .update({ artwork_url: newArt })
          .eq('id', album.id)
        results.artworkFixed++
      }

      // Fix tracks
      if (needsTracks && iTunesTracks.length > 0) {
        const trackRows = iTunesTracks.map(t => ({
          album_id: album.id,
          itunes_track_id: t.trackId,
          name: t.trackName,
          track_number: t.trackNumber,
          duration_ms: t.trackTimeMillis,
          preview_url: t.previewUrl || null,
        }))
        await supabase
          .from('tracks')
          .upsert(trackRows, { onConflict: 'itunes_track_id' })
        await supabase
          .from('albums')
          .update({ track_count: iTunesTracks.length })
          .eq('id', album.id)
        results.tracksFixed++
      }
    } catch (e) {
      results.errors.push({ album: album.name, error: e.message })
    }
  }

  return Response.json({ success: true, ...results })
}
