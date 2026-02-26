// FILE: src/app/components/TermsBanner.js
// Cmd+A → Delete → Paste
// This is a new file. Create it first:
//   touch ~/Desktop/banger-ratios/src/app/components/TermsBanner.js
//
// Then add it to layout.js — see deployment guide Step 2.

'use client'

import { useState, useEffect } from 'react'

export default function TermsBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if user has already accepted
    const accepted = localStorage.getItem('br_terms_accepted')
    if (!accepted) setShow(true)
  }, [])

  function accept() {
    localStorage.setItem('br_terms_accepted', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'white', borderTop: '1px solid var(--border)',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
      padding: '16px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 20, zIndex: 500, flexWrap: 'wrap',
    }}>
      <p style={{ fontSize: 13, color: 'var(--gray-text)', lineHeight: 1.5, flex: 1, minWidth: 220 }}>
        By using Banger Ratios you agree to our{' '}
        <a href="/terms" style={{ color: 'var(--pink)', fontWeight: 600 }}>Terms & Conditions</a>
        {' '}and acknowledge that ratings represent community opinions only.
        We use cookies and store your ratings to provide the service.
      </p>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <a href="/terms" style={{
          padding: '9px 18px', borderRadius: 8, border: '1.5px solid var(--border)',
          background: 'white', color: 'var(--gray-text)', fontWeight: 500,
          fontSize: 13, textDecoration: 'none',
        }}>
          Read Terms
        </a>
        <button onClick={accept} style={{
          padding: '9px 22px', borderRadius: 8, border: 'none',
          background: 'var(--pink)', color: 'white',
          fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          I Accept
        </button>
      </div>
    </div>
  )
}