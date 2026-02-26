// ============================================================
// FILE: src/app/settings/page.js
// WHAT: Settings page — password change, display name, bio,
//       Spotify URL, Apple Music URL, favorite albums section
// HOW:
//   1. Create file at src/app/settings/page.js
//   2. Cmd+A → Delete → Paste → Save → git push
//   3. Add Settings link to Nav.js tabs array:
//      { href: '/settings', label: 'Settings' }
// ============================================================

'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/app/components/Toast'

export default function SettingsPage() {
  const { toast } = useToast()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const [form, setForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    location: '',
    spotify_url: '',
    apple_music_url: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { window.location.href = '/auth'; return }
    setUser(u)

    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
    if (p) {
      setForm({
        display_name:    p.display_name    || '',
        username:        p.username        || '',
        bio:             p.bio             || '',
        location:        p.location        || '',
        spotify_url:     p.spotify_url     || '',
        apple_music_url: p.apple_music_url || '',
      })
    }
    setLoading(false)
  }

  function setField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function saveProfile() {
    setSaving(true)
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
    if (error) {
      toast(error.message || 'Failed to save. Try again.', 'error')
    } else {
      toast('Profile updated!', 'success')
    }
    setSaving(false)
  }

  async function changePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast('Passwords do not match.', 'error')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast('Password must be at least 6 characters.', 'error')
      return
    }
    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword })
    if (error) {
      toast(error.message || 'Failed to change password.', 'error')
    } else {
      toast('Password changed successfully!', 'success')
      setPasswordForm({ newPassword: '', confirmPassword: '' })
    }
    setChangingPassword(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--gray-400)' }}>Loading...</div>

  const inp = {
    width: '100%', padding: '10px 14px',
    background: 'white', border: '1.5px solid var(--gray-200)',
    borderRadius: 10, fontSize: 14, outline: 'none',
    color: 'var(--black)', fontFamily: 'inherit',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  const label = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  }

  const section = {
    background: 'white', borderRadius: 16, border: '1px solid var(--gray-200)',
    padding: '28px', marginBottom: 20,
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '36px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
      <p style={{ color: 'var(--gray-400)', fontSize: 14, marginBottom: 32 }}>
        Signed in as {user?.email}
      </p>

      {/* Profile info */}
      <div style={section}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Profile</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={label}>Display Name</label>
            <input style={inp} value={form.display_name} onChange={e => setField('display_name', e.target.value)}
              onFocus={e => e.target.style.borderColor = 'var(--pink)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
              placeholder="Your Name" />
          </div>
          <div>
            <label style={label}>Username</label>
            <input style={inp} value={form.username} onChange={e => setField('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              onFocus={e => e.target.style.borderColor = 'var(--pink)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
              placeholder="username" />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={label}>Bio</label>
          <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }}
            value={form.bio} onChange={e => setField('bio', e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--pink)'}
            onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
            placeholder="Tell people about your taste in music..." />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={label}>Location</label>
          <input style={inp} value={form.location} onChange={e => setField('location', e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--pink)'}
            onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
            placeholder="Nashville, TN" />
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Music Profiles
        </h3>
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Spotify Profile URL</label>
          <input style={inp} value={form.spotify_url} onChange={e => setField('spotify_url', e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--pink)'}
            onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
            placeholder="https://open.spotify.com/user/..." />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={label}>Apple Music Profile URL</label>
          <input style={inp} value={form.apple_music_url} onChange={e => setField('apple_music_url', e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--pink)'}
            onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
            placeholder="https://music.apple.com/profile/..." />
        </div>

        <button onClick={saveProfile} disabled={saving} style={{
          width: '100%', padding: '12px', borderRadius: 10, border: 'none',
          background: 'var(--pink)', color: 'white', fontWeight: 700,
          fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          opacity: saving ? 0.7 : 1,
        }}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Password change */}
      <div style={section}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Change Password</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={label}>New Password</label>
          <input type="password" style={inp}
            value={passwordForm.newPassword}
            onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            onFocus={e => e.target.style.borderColor = 'var(--pink)'}
            onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
            placeholder="At least 6 characters" />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={label}>Confirm New Password</label>
          <input type="password" style={inp}
            value={passwordForm.confirmPassword}
            onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            onFocus={e => e.target.style.borderColor = 'var(--pink)'}
            onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
            placeholder="Same as above" />
        </div>

        <button onClick={changePassword} disabled={changingPassword || !passwordForm.newPassword} style={{
          width: '100%', padding: '12px', borderRadius: 10, border: 'none',
          background: passwordForm.newPassword ? 'var(--black)' : 'var(--gray-200)',
          color: passwordForm.newPassword ? 'white' : 'var(--gray-400)',
          fontWeight: 700, fontSize: 14, cursor: passwordForm.newPassword ? 'pointer' : 'default',
          fontFamily: 'inherit',
        }}>
          {changingPassword ? 'Changing...' : 'Change Password'}
        </button>
      </div>

      {/* Account */}
      <div style={section}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Account</h2>
        <p style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 20 }}>
          Email: <strong>{user?.email}</strong>
        </p>
        <button onClick={signOut} style={{
          padding: '10px 24px', borderRadius: 10, border: '1.5px solid var(--gray-200)',
          background: 'white', color: 'var(--gray-600)', fontWeight: 600,
          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}