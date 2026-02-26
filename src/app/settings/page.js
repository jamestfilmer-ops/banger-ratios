// FILE: src/app/settings/page.js
// Cmd+A → Delete → Paste

'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [user, setUser]       = useState(null)
  const [saving, setSaving]   = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [msg, setMsg]         = useState(null)
  const [pwMsg, setPwMsg]     = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)

  const [form, setForm] = useState({
    display_name: '', username: '', bio: '', location: '',
    spotify_url: '', apple_music_url: '',
    avatar_url: '', banner_url: '',
  })
  const [pw, setPw] = useState({ new: '', confirm: '' })

  const avatarRef = useRef(null)
  const bannerRef = useRef(null)

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { window.location.href = '/auth'; return }
      setUser(u)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
      if (p) setForm({
        display_name:    p.display_name    || '',
        username:        p.username        || '',
        bio:             p.bio             || '',
        location:        p.location        || '',
        spotify_url:     p.spotify_url     || '',
        apple_music_url: p.apple_music_url || '',
        avatar_url:      p.avatar_url      || '',
        banner_url:      p.banner_url      || '',
      })
    }
    load()
  }, [])

  async function uploadImage(file, bucket, field, setUploading) {
    if (!file || !user) return
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Image must be under 5MB.' })
      return
    }
    setUploading(true)
    setMsg(null)
    const ext  = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (upErr) {
      setMsg({ type: 'error', text: `Upload failed: ${upErr.message}` })
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    const { error: dbErr } = await supabase.from('profiles').update({ [field]: publicUrl }).eq('id', user.id)
    if (dbErr) {
      setMsg({ type: 'error', text: `Saved image but could not update profile: ${dbErr.message}` })
    } else {
      setForm(prev => ({ ...prev, [field]: publicUrl }))
      setMsg({ type: 'success', text: field === 'avatar_url' ? 'Avatar updated!' : 'Banner updated!' })
    }
    setUploading(false)
  }

  async function saveProfile() {
    setSaving(true)
    setMsg(null)
    const clean = form.username.toLowerCase().replace(/[^a-z0-9_]/g, '')
    const payload = { ...form, username: clean }
    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id)
    setMsg(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Profile saved!' })
    setSaving(false)
  }

  async function changePassword() {
    setPwSaving(true)
    setPwMsg(null)
    if (!pw.new || pw.new.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      setPwSaving(false); return
    }
    if (pw.new !== pw.confirm) {
      setPwMsg({ type: 'error', text: 'Passwords do not match.' })
      setPwSaving(false); return
    }
    const { error } = await supabase.auth.updateUser({ password: pw.new })
    setPwMsg(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Password updated!' })
    if (!error) setPw({ new: '', confirm: '' })
    setPwSaving(false)
  }

  if (!user) return <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>

  const inp = {
    width: '100%', padding: '10px 14px', background: '#F8FAFC',
    border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14,
    outline: 'none', color: '#0D0D0D', fontFamily: 'inherit', boxSizing: 'border-box',
  }
  const card = {
    background: 'white', borderRadius: 16, border: '1px solid #E2E8F0',
    padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }
  const labelStyle = {
    fontSize: 11, color: '#94A3B8', fontWeight: 600, display: 'block',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  }

  function Flash({ msg }) {
    if (!msg) return null
    return (
      <div style={{
        padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 16,
        background: msg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
        color:      msg.type === 'success' ? '#059669' : '#DC2626',
        border:    `1px solid ${msg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
      }}>{msg.text}</div>
    )
  }

  return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Settings</h1>
      <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 32 }}>Manage your account and profile.</p>

      <Flash msg={msg} />

      {/* Photos */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Photos</h2>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Profile Banner</label>
          <div
            onClick={() => bannerRef.current?.click()}
            style={{
              width: '100%', height: 120, borderRadius: 10, overflow: 'hidden',
              border: '2px dashed #E2E8F0', cursor: 'pointer', position: 'relative',
              background: form.banner_url
                ? `url(${form.banner_url}) center/cover no-repeat`
                : 'linear-gradient(135deg, #FF0066, #CC0052)',
            }}
          >
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>
                {bannerUploading ? 'Uploading...' : 'Click to change banner'}
              </span>
            </div>
          </div>
          <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => uploadImage(e.target.files[0], 'banners', 'banner_url', setBannerUploading)} />
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Recommended: 1200x300px. Max 5MB.</p>
        </div>

        <div>
          <label style={labelStyle}>Profile Photo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              onClick={() => avatarRef.current?.click()}
              style={{
                width: 72, height: 72, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                border: '2px solid #E2E8F0', overflow: 'hidden', position: 'relative',
                background: form.avatar_url ? `url(${form.avatar_url}) center/cover` : '#FF0066',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: 22,
              }}
            >
              {!form.avatar_url && (form.username?.[0] || '?').toUpperCase()}
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
              }}>
                <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>
                  {avatarUploading ? '...' : 'Edit'}
                </span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#94A3B8' }}>Click to upload. Square images work best. Max 5MB.</p>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => uploadImage(e.target.files[0], 'avatars', 'avatar_url', setAvatarUploading)} />
        </div>
      </div>

      {/* Profile info */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Profile</h2>

        {[
          ['Display Name', 'display_name', 'Your name',                      false],
          ['Username',     'username',     'lowercase, letters/numbers only', false],
          ['Location',     'location',     'Nashville, TN',                   false],
        ].map(([lbl, key, ph]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{lbl}</label>
            <input style={inp} value={form[key]} placeholder={ph}
              onChange={e => setForm({ ...form, [key]: e.target.value })} />
            {key === 'username' && (
              <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
                Your public URL: bangerratios.com/profile/{form.username || 'username'}
              </p>
            )}
          </div>
        ))}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Bio</label>
          <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }}
            value={form.bio} placeholder="Tell the world about your music taste..."
            onChange={e => setForm({ ...form, bio: e.target.value })} />
        </div>

        {[
          ['Spotify URL',     'spotify_url',     'https://open.spotify.com/user/...'],
          ['Apple Music URL', 'apple_music_url', 'https://music.apple.com/...'],
        ].map(([lbl, key, ph]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{lbl}</label>
            <input style={inp} value={form[key]} placeholder={ph}
              onChange={e => setForm({ ...form, [key]: e.target.value })} />
          </div>
        ))}

        <button onClick={saveProfile} style={{
          padding: '10px 24px', borderRadius: 8, border: 'none',
          background: '#FF0066', color: 'white', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>{saving ? 'Saving...' : 'Save Profile'}</button>
      </div>

      {/* Account */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Account</h2>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>
          Signed in as <strong style={{ color: '#0D0D0D' }}>{user.email}</strong>
        </p>
      </div>

      {/* Password */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Change Password</h2>
        <Flash msg={pwMsg} />
        {[
          ['New Password',     'new',     'At least 6 characters'],
          ['Confirm Password', 'confirm', 'Repeat new password'],
        ].map(([lbl, key, ph]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{lbl}</label>
            <input type="password" style={inp} value={pw[key]} placeholder={ph}
              onChange={e => setPw({ ...pw, [key]: e.target.value })} />
          </div>
        ))}
        <button onClick={changePassword} style={{
          padding: '10px 24px', borderRadius: 8, border: 'none',
          background: '#0D0D0D', color: 'white', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>{pwSaving ? 'Updating...' : 'Update Password'}</button>
      </div>

      {/* Sign out */}
      <div style={{ ...card, border: '1px solid #FECACA' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#DC2626' }}>Sign Out</h2>
        <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>Sign out of your account on this device.</p>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} style={{
          padding: '9px 22px', borderRadius: 8, border: '1px solid #FECACA',
          background: 'white', color: '#DC2626', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>Sign Out</button>
      </div>
    </div>
  )
}