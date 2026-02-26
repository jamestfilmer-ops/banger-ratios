'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const [user,      setUser]      = useState(null)
  const [profile,   setProfile]   = useState(null)
  const [myAlbums,  setMyAlbums]  = useState([])
  const [editing,   setEditing]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [form, setForm] = useState({
    display_name: '', bio: '', location: '', spotify_url: '', apple_music_url: ''
  })
  const avatarRef = useRef(null)
  const bannerRef = useRef(null)

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { window.location.href = '/auth'; return }
      setUser(u)

      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
      setProfile(p)
      if (p) setForm({
        display_name:    p.display_name    || '',
        bio:             p.bio             || '',
        location:        p.location        || '',
        spotify_url:     p.spotify_url     || '',
        apple_music_url: p.apple_music_url || '',
      })

      const { data: rats } = await supabase
        .from('ratings').select('album_id').eq('user_id', u.id)
      const ids = [...new Set((rats || []).map(r => r.album_id))]
      if (ids.length > 0) {
        const { data: albums } = await supabase
          .from('albums').select('*').in('id', ids).order('banger_ratio', { ascending: false })
        setMyAlbums(albums || [])
      }
    }
    load()
  }, [])

  async function uploadAvatar(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setAvatarUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
    }
    setAvatarUploading(false)
  }

  async function uploadBanner(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setBannerUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/banner.${ext}`
    const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path)
      await supabase.from('profiles').update({ banner_url: publicUrl }).eq('id', user.id)
      setProfile(prev => ({ ...prev, banner_url: publicUrl }))
    }
    setBannerUploading(false)
  }

  async function saveProfile() {
    setSaving(true)
    await supabase.from('profiles').update(form).eq('id', user.id)
    setProfile({ ...profile, ...form })
    setEditing(false)
    setSaving(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!user) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading...</div>

  const inp = {
    width: '100%', padding: '10px 14px', background: 'var(--gray-100)',
    border: '1px solid var(--gray-200)', borderRadius: 8, fontSize: 14,
    outline: 'none', color: 'var(--black)', fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  const initials = (profile?.display_name || profile?.username || '?')[0].toUpperCase()

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 80px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>My Profile</h1>
        <button onClick={signOut} style={{
          padding: '7px 16px', borderRadius: 8,
          border: '1px solid var(--gray-200)', background: 'white',
          color: 'var(--gray-400)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Sign Out</button>
      </div>

      {/* Profile card */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--gray-200)', overflow: 'hidden', marginBottom: 24 }}>

        {/* Banner */}
        <div
          onClick={() => bannerRef.current?.click()}
          style={{
            height: 120,
            background: profile?.banner_url
              ? `url(${profile.banner_url}) center/cover no-repeat`
              : 'linear-gradient(135deg, #FF0066 0%, #CC0052 100%)',
            cursor: 'pointer',
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {!profile?.banner_url && (
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500 }}>
              {bannerUploading ? 'Uploading...' : 'Click to upload banner'}
            </span>
          )}
          {profile?.banner_url && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.2s',
            }}
              onMouseOver={e => e.currentTarget.style.opacity = 1}
              onMouseOut={e => e.currentTarget.style.opacity = 0}
            >
              <span style={{
                background: 'rgba(0,0,0,0.5)', color: 'white',
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              }}>
                {bannerUploading ? 'Uploading...' : 'Change banner'}
              </span>
            </div>
          )}
          <input ref={bannerRef} type="file" accept="image/*" onChange={uploadBanner}
            style={{ display: 'none' }} />
        </div>

        <div style={{ padding: 24 }}>
          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16, marginTop: -36 }}>
            <div
              onClick={() => avatarRef.current?.click()}
              style={{
                width: 72, height: 72, borderRadius: 16,
                border: '3px solid white',
                background: profile?.avatar_url ? `url(${profile.avatar_url}) center/cover no-repeat` : 'rgba(255,0,102,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 700, color: 'var(--pink)',
                cursor: 'pointer', flexShrink: 0, position: 'relative', overflow: 'hidden',
              }}
            >
              {!profile?.avatar_url && initials}
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s',
                borderRadius: 13,
              }}
                onMouseOver={e => e.currentTarget.style.opacity = 1}
                onMouseOut={e => e.currentTarget.style.opacity = 0}
              >
                <span style={{ fontSize: 18 }}>📷</span>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" onChange={uploadAvatar}
                style={{ display: 'none' }} />
            </div>
            <div style={{ paddingBottom: 4 }}>
              {avatarUploading && (
                <p style={{ fontSize: 11, color: 'var(--gray-400)' }}>Uploading...</p>
              )}
            </div>
          </div>

          {!editing ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                  {profile?.display_name || profile?.username}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                  @{profile?.username}{profile?.location ? ' · ' + profile.location : ''}
                </p>
              </div>
              {profile?.bio && (
                <p style={{ fontSize: 14, color: '#555', marginBottom: 12, lineHeight: 1.5 }}>
                  {profile.bio}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {profile?.spotify_url && (
                  <a href={profile.spotify_url} target="_blank" style={{
                    padding: '5px 12px', borderRadius: 6, background: '#1DB954',
                    color: 'white', fontSize: 11, fontWeight: 600,
                  }}>🎵 Spotify</a>
                )}
                {profile?.apple_music_url && (
                  <a href={profile.apple_music_url} target="_blank" style={{
                    padding: '5px 12px', borderRadius: 6, background: '#FA243C',
                    color: 'white', fontSize: 11, fontWeight: 600,
                  }}>🎵 Apple Music</a>
                )}
              </div>
              <button onClick={() => setEditing(true)} style={{
                padding: '8px 18px', borderRadius: 8, border: '1px solid var(--gray-200)',
                background: 'white', color: 'var(--gray-600)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Edit Profile</button>
            </>
          ) : (
            <div>
              {[
                ['Display Name',       'display_name',    'Your name',                         false],
                ['Bio',                'bio',             'Tell the world about your taste...', true ],
                ['Location',           'location',        'Nashville, TN',                     false],
                ['Spotify Link',       'spotify_url',     'https://open.spotify.com/...',      false],
                ['Apple Music Link',   'apple_music_url', 'https://music.apple.com/...',       false],
              ].map(([label, key, ph, isTA]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    {label}
                  </label>
                  {isTA
                    ? <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }}
                        value={form[key]} placeholder={ph}
                        onChange={e => setForm({ ...form, [key]: e.target.value })} />
                    : <input style={inp} value={form[key]} placeholder={ph}
                        onChange={e => setForm({ ...form, [key]: e.target.value })} />
                  }
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveProfile} style={{
                  padding: '9px 22px', borderRadius: 8, border: 'none',
                  background: 'var(--pink)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>{saving ? 'Saving...' : 'Save'}</button>
                <button onClick={() => setEditing(false)} style={{
                  padding: '9px 22px', borderRadius: 8, border: '1px solid var(--gray-200)',
                  background: 'white', color: 'var(--gray-600)', fontSize: 13, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Albums Rated', value: myAlbums.length },
          { label: 'Total Ratings', value: myAlbums.reduce((s, a) => s + (a.total_ratings || 0), 0) },
          { label: 'Avg Ratio', value: myAlbums.length
              ? (myAlbums.reduce((s, a) => s + parseFloat(a.banger_ratio || 0), 0) / myAlbums.length).toFixed(0) + '%'
              : '--'
          },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--gray-100)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--pink)' }}>{s.value}</p>
            <p style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Albums rated */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Albums I've Rated</h2>
      {myAlbums.length === 0 && (
        <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>
          No albums rated yet.{' '}
          <a href="/" style={{ color: 'var(--pink)' }}>Start rating!</a>
        </p>
      )}
      {myAlbums.map(a => (
        <a key={a.id} href={`/album/${a.itunes_collection_id}`}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, marginBottom: 2, transition: 'background 0.15s' }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--gray-100)'}
          onMouseOut={e => e.currentTarget.style.background = ''}
        >
          {a.artwork_url && (
            <img src={a.artwork_url.replace('600x600', '80x80')} alt=""
              style={{ width: 40, height: 40, borderRadius: 6 }} />
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</p>
            <p style={{ fontSize: 11, color: 'var(--gray-400)' }}>{a.artist_name}</p>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--pink)' }}>{a.banger_ratio}%</span>
        </a>
      ))}

    </div>
  )
}