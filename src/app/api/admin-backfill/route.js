import { createClient } from '@supabase/supabase-js'

// Admin backfill: fixes null artwork_url and 0-track albums
// Also handles albums with dead iTunes IDs by mapping them to correct current IDs
// Call via: GET /api/admin-backfill?secret=br_backfill_2026
// Diagnostic only: GET /api/admin-backfill?secret=br_backfill_2026&diagnose=1

// Known dead iTunes IDs -> correct current IDs
// These are classic albums Apple re-released under new collection IDs
const DEAD_ID_MAP = {
  1422675504: 1254572564,  // Flower Boy - Tyler, the Creator
  1463940183: 1463409338,  // IGOR - Tyler, the Creator
  1440768986: 269572838,   // Thriller - Michael Jackson
  1579962131: 1579962125,  // Happier Than Ever - Billie Eilish (standard version)
  1440768990: 1440642493,  // Take Care - Drake (deluxe)
  1440934270: 1440858811,  // Reasonable Doubt - JAY-Z
  1440831459: 1474815798,  // Is This It - The Strokes
  1440768916: 1440646570,  // Late Registration - Kanye West
}

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

  const { data: albums, error: fetchErr } = await supabase
    .from('albums')
    .select('id, itunes_collection_id, artwork_url, track_count, name, artist_name')

  if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 500 })

  if (diagnoseOnly) {
    const broken = albums.filter(a =>
      !a.artwork_url || a.artwork_url.includes('100x100') || !a.track_count || a.track_count === 0
    ).map(a => ({
      name: a.name,
      artist: a.artist_name,
      itunes_id: a.itunes_collection_id,
      correct_id: DEAD_ID_MAP[a.itunes_collection_id] || null,
      artwork_url: a.artwork_url,
      track_count: a.track_count,
    }))
    return Response.json({ total: albums.length, broken: broken.length, broken_list: broken })
  }

  const results = { artworkFixed: 0, tracksFixed: 0, idRemapped: 0, skipped: 0, errors: [] }

  for (const album of albums) {
    const needsArtwork = !album.artwork_url || album.artwork_url.includes('100x100')
    const needsTracks = !album.track_count || album.track_count === 0

    if (!needsArtwork && !needsTracks) { results.skipped++; continue }
    if (!album.itunes_collection_id) {
      results.errors.push({ album: album.name, error: 'no iTunes ID' })
      continue
    }

    // Use corrected ID if this is a known dead ID
    const correctId = DEAD_ID_MAP[album.itunes_collection_id] || album.itunes_collection_id

    try {
      await new Promise(r => setTimeout(r, 300))

      const res = await fetch(
        `https://itunes.apple.com/lookup?id=${correctId}&entity=song`
      )
      const data = await res.json()
      const iTunesAlbum = data.results?.find(r => r.wrapperType === 'collection')
      const iTunesTracks = data.results?.filter(r => r.wrapperType === 'track') || []

      if (!iTunesAlbum) {
        results.errors.push({ album: album.name, error: `not found on iTunes (tried id ${correctId})` })
        continue
      }

      // If we used a remapped ID, update the stored iTunes ID too so future loads work
      const updates = {}
      if (correctId !== album.itunes_collection_id) {
        updates.itunes_collection_id = correctId
        results.idRemapped++
      }

      if (needsArtwork && iTunesAlbum.artworkUrl100) {
        updates.artwork_url = fixArtwork(iTunesAlbum.artworkUrl100)
        results.artworkFixed++
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('albums').update(updates).eq('id', album.id)
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
