'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [pwMsg, setPwMsg] = useState(null)

  const [form, setForm] = useState({
    display_name: '', bio: '', spotify_url: '', apple_music_url: ''
  })
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' })

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
        spotify_url:     p.spotify_url     || '',
        apple_music_url: p.apple_music_url || '',
      })
    }
    load()
  }, [])

  async function saveProfile() {
    setSaving(true)
    setMsg(null)
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
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
    if (!error) setPw({ current: '', new: '', confirm: '' })
    setPwSaving(false)
  }

  if (!user) return <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>

  const inp = {
    width: '100%', padding: '10px 14px', background: '#F8FAFC',
    border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14,
    outline: 'none', color: '#0D0D0D', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  const card = {
    background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: 24, marginBottom: 20,
  }

  const label = {
    fontSize: 11, color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  }

  function Flash({ msg }) {
    if (!msg) return null
    return (
      <div style={{
        padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 16,
        background: msg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
        color: msg.type === 'success' ? '#059669' : '#DC2626',
        border: `1px solid ${msg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
      }}>{msg.text}</div>
    )
  }

  return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Settings</h1>
      <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 32 }}>Manage your account and profile.</p>

      {/* Profile info */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Profile</h2>
        <Flash msg={msg} />
        {[
          ['Display Name', 'display_name', 'Your name', false],
          ['Bio',          'bio',          'Tell the world about your music taste...', true],
          ['Spotify URL',  'spotify_url',  'https://open.spotify.com/user/...', false],
          ['Apple Music URL', 'apple_music_url', 'https://music.apple.com/...', false],
        ].map(([lbl, key, ph, isTA]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={label}>{lbl}</label>
            {isTA
              ? <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }}
                  value={form[key]} placeholder={ph}
                  onChange={e => setForm({ ...form, [key]: e.target.value })} />
              : <input style={inp} value={form[key]} placeholder={ph}
                  onChange={e => setForm({ ...form, [key]: e.target.value })} />
            }
          </div>
        ))}
        <button onClick={saveProfile} style={{
          padding: '10px 24px', borderRadius: 8, border: 'none',
          background: '#FF0066', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>

      {/* Account info */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Account</h2>
        <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 0 }}>
          Signed in as <strong style={{ color: '#0D0D0D' }}>{user.email}</strong>
        </p>
      </div>

      {/* Password change */}
      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Change Password</h2>
        <Flash msg={pwMsg} />
        {[
          ['New Password',     'new',     'At least 6 characters'],
          ['Confirm Password', 'confirm', 'Repeat new password'],
        ].map(([lbl, key, ph]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={label}>{lbl}</label>
            <input type="password" style={inp} value={pw[key]} placeholder={ph}
              onChange={e => setPw({ ...pw, [key]: e.target.value })} />
          </div>
        ))}
        <button onClick={changePassword} style={{
          padding: '10px 24px', borderRadius: 8, border: 'none',
          background: '#0D0D0D', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>{pwSaving ? 'Updating...' : 'Update Password'}</button>
      </div>

      {/* Danger zone */}
      <div style={{ ...card, border: '1px solid #FECACA' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#DC2626' }}>Sign Out</h2>
        <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>Sign out of your account on this device.</p>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} style={{
          padding: '9px 22px', borderRadius: 8, border: '1px solid #FECACA',
          background: 'white', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>Sign Out</button>
      </div>

    </div>
  )
}
