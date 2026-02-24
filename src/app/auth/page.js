'use client'
 
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
 
// Password requirements
const PW_RULES = [
  { test: p => p.length >= 8,                            label: 'At least 8 characters' },
  { test: p => /[A-Z]/.test(p),                          label: 'One uppercase letter' },
  { test: p => /[a-z]/.test(p),                          label: 'One lowercase letter' },
  { test: p => /[0-9]/.test(p),                          label: 'One number' },
  { test: p => /[!@#$%^&*()_+\-={}|;:,.<>?]/.test(p), label: 'One special character' },
]
 
export default function AuthPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [msg,      setMsg]      = useState('')
  const [msgType,  setMsgType]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [consent,  setConsent]  = useState(false)
 
  const pwValid    = PW_RULES.every(r => r.test(password))
  const showPwRules = isSignUp && password.length > 0
 
  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setMsg('')
 
    if (isSignUp && !pwValid) {
      setMsg('Password does not meet requirements.'); setMsgType('error'); setLoading(false); return
    }
    if (isSignUp && !consent) {
      setMsg('Please agree to the terms to continue.'); setMsgType('error'); setLoading(false); return
    }
 
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { username, display_name: username, marketing_consent: consent } }
      })
      if (error) { setMsg(error.message); setMsgType('error') }
      else { setMsg('Check your email for a confirmation link!'); setMsgType('success') }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setMsg(error.message); setMsgType('error') }
      else { window.location.href = '/' }
    }
    setLoading(false)
  }
 
  const inp = {
    width: '100%', padding: '12px 16px', background: 'var(--gray-100)',
    border: '1px solid var(--gray-200)', borderRadius: 10, color: 'var(--black)',
    fontSize: 15, outline: 'none', fontFamily: 'inherit',
  }
 
  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <a href="/">
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: 'var(--pink)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 18, color: 'white', marginBottom: 12,
            }}>BR</div>
          </a>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>
            {isSignUp ? 'Create Your Account' : 'Welcome Back'}
          </h1>
        </div>
 
        <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid var(--gray-200)' }}>
 
          {isSignUp && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--gray-400)', display: 'block', marginBottom: 4, fontWeight: 500 }}>Username</label>
              <input style={inp} value={username} onChange={e => setUsername(e.target.value)} placeholder="your_username" required />
            </div>
          )}
 
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--gray-400)', display: 'block', marginBottom: 4, fontWeight: 500 }}>Email</label>
            <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
 
          <div style={{ marginBottom: showPwRules ? 8 : 14 }}>
            <label style={{ fontSize: 12, color: 'var(--gray-400)', display: 'block', marginBottom: 4, fontWeight: 500 }}>Password</label>
            <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={isSignUp ? 'Min 8 chars, uppercase, number, symbol' : 'Your password'} required />
          </div>
 
          {showPwRules && (
            <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--gray-100)', borderRadius: 8 }}>
              {PW_RULES.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, color: r.test(password) ? 'var(--green)' : 'var(--gray-200)' }}>
                    {r.test(password) ? '✓' : '✗'}
                  </span>
                  <span style={{ fontSize: 11, color: r.test(password) ? 'var(--green)' : 'var(--gray-400)' }}>
                    {r.label}
                  </span>
                </div>
              ))}
            </div>
          )}
 
          {isSignUp && (
            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
              <span style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.4 }}>
                I agree to the{' '}
                <a href="/about" style={{ color: 'var(--pink)' }}>Terms & Privacy Policy</a>
                {' '}and consent to receive Banger Ratios updates.
              </span>
            </label>
          )}
 
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 13, borderRadius: 10, border: 'none',
            background: 'var(--pink)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Log In'}
          </button>
 
          {msg && (
            <p style={{ fontSize: 13, marginTop: 12, textAlign: 'center',
              color: msgType === 'success' ? 'var(--green)' : 'var(--red)' }}>{msg}</p>
          )}
 
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--gray-400)' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setMsg('') }}
              style={{ background: 'none', border: 'none', color: 'var(--pink)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
