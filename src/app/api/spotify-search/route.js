export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const type  = searchParams.get('type') || 'album'

  if (!query) return Response.json({ error: 'No query' }, { status: 400 })

  try {
    // Get Spotify access token using client credentials
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64'),
      },
      body: 'grant_type=client_credentials',
    })

    const tokenData = await tokenRes.json()
    const token = tokenData.access_token
    if (!token) return Response.json({ error: 'Auth failed' }, { status: 500 })

    // Search Spotify
    const spotifyType = type === 'song' ? 'track' : 'album'
    const searchRes = await fetch(
      'https://api.spotify.com/v1/search?q=' + encodeURIComponent(query) +
      '&type=' + spotifyType + '&limit=20&market=US',
      { headers: { 'Authorization': 'Bearer ' + token } }
    )

    const searchData = await searchRes.json()

    if (type === 'song') {
      // Return tracks with their parent album info
      const tracks = (searchData.tracks?.items || []).map(track => ({
        trackName:        track.name,
        artistName:       track.artists[0]?.name || '',
        albumName:        track.album?.name || '',
        albumArtwork:     track.album?.images?.[0]?.url || '',
        spotifyAlbumId:   track.album?.id || '',
        spotifyTrackId:   track.id,
        releaseDate:      track.album?.release_date || '',
        // We'll use iTunes to get the collectionId for rating
        searchHint:       track.album?.name + ' ' + track.artists[0]?.name,
      }))
      return Response.json({ tracks })
    } else {
      // Return albums
      const albums = (searchData.albums?.items || []).map(album => ({
        albumName:      album.name,
        artistName:     album.artists[0]?.name || '',
        artwork:        album.images?.[0]?.url || '',
        spotifyId:      album.id,
        releaseDate:    album.release_date || '',
        totalTracks:    album.total_tracks,
        // searchHint used to find the iTunes collectionId
        searchHint:     album.name + ' ' + album.artists[0]?.name,
      }))
      return Response.json({ albums })
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
