// FILE: src/app/settings/page.js
// Cmd+A → Delete → Paste
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [user,        setUser]        = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [username,    setUsername]    = useState('')
  const [bio,         setBio]         = useState('')
  const [spotify,     setSpotify]     = useState('')
  const [appleMusic,  setAppleMusic]  = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [msg,         setMsg]         = useState(null) // { type: 'ok'|'err', text }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) { window.location.href = '/auth'; return }
      setUser(data.user)
      supabase.from('profiles').select('*').eq('id', data.user.id).single()
        .then(({ data: p }) => {
          if (p) {
            setDisplayName(p.display_name || '')
            setUsername(p.username || '')
            setBio(p.bio || '')
            setSpotify(p.spotify_url || '')
            setAppleMusic(p.apple_music_url || '')
          }
        })
    })
  }, [])

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const updates = {
        display_name:   displayName.trim() || null,
        username:        username.trim()    || null,
        bio:             bio.trim()         || null,
        spotify_url:     spotify.trim()     || null,
        apple_music_url: appleMusic.trim()  || null,
      }
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
      if (error) throw error
      if (newPassword) {
        const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword })
        if (pwErr) throw pwErr
      }
      setMsg({ type: 'ok', text: 'Settings saved!' })
      setNewPassword('')
    } catch (e) {
      setMsg({ type: 'err', text: e.message || 'Save failed. Try again.' })
    }
    setSaving(false)
  }

  if (!user) return null

  const field = (label, value, setter, opts = {}) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--black)' }}>
        {label}
      </label>
      {opts.textarea ? (
        <textarea
          value={value}
          onChange={e => setter(e.target.value)}
          maxLength={opts.maxLength || 200}
          rows={3}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
        />
      ) : (
        <input
          type={opts.type || 'text'}
          value={value}
          onChange={e => setter(e.target.value)}
          placeholder={opts.placeholder || ''}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none' }}
        />
      )}
      {opts.hint && <p style={{ fontSize: 11, color: 'var(--gray-text)', marginTop: 4 }}>{opts.hint}</p>}
    </div>
  )

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
      <p style={{ color: 'var(--gray-text)', fontSize: 14, marginBottom: 32 }}>
        Update your profile and account details.
      </p>

      {/* Profile section */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '24px', marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--black)' }}>Profile</h2>
        {field('Display Name', displayName, setDisplayName, { placeholder: 'Your name' })}
        {field('Username', username, setUsername, { placeholder: '@username', hint: 'Used in your profile URL' })}
        {field('Bio', bio, setBio, { textarea: true, maxLength: 160, hint: `${bio.length}/160 characters` })}
      </div>

      {/* Streaming links section */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '24px', marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--black)' }}>Streaming Links</h2>
        {field('Spotify Profile URL', spotify, setSpotify, { placeholder: 'https://open.spotify.com/user/...', hint: 'Paste your full Spotify profile link' })}
        {field('Apple Music Profile URL', appleMusic, setAppleMusic, { placeholder: 'https://music.apple.com/profile/...', hint: 'Paste your full Apple Music profile link' })}
      </div>

      {/* Password section */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '24px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--black)' }}>Change Password</h2>
        {field('New Password', newPassword, setNewPassword, { type: 'password', placeholder: 'Leave blank to keep current', hint: 'Only fill this in if you want to change your password' })}
      </div>

      {/* Save button */}
      {msg && (
        <div style={{
          padding: '10px 16px', borderRadius: 10, marginBottom: 16,
          background: msg.type === 'ok' ? '#EFFFEF' : '#FFF0F0',
          color: msg.type === 'ok' ? '#006622' : '#CC0000',
          fontSize: 13, fontWeight: 600,
        }}>
          {msg.text}
        </div>
      )}
      <button
        onClick={save}
        disabled={saving}
        style={{
          width: '100%', padding: '13px', borderRadius: 12, border: 'none',
          background: saving ? 'var(--gray-200)' : 'var(--pink)',
          color: saving ? 'var(--gray-600)' : 'white',
          fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
