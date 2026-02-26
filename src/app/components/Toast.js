// ============================================================
// FILE: src/app/components/Toast.js
// WHAT: Global toast notification system
// HOW TO USE:
//   1. Cmd+A → Delete → Paste this into src/app/components/Toast.js (new file)
//   2. In layout.js, wrap children with <ToastProvider>
//   3. In any page: import { useToast } from '@/app/components/Toast'
//      then: const { toast } = useToast()
//      then: toast('Ratings saved!', 'success')
// ============================================================

'use client'
import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    // Auto-dismiss after 3s (errors stay until dismissed)
    if (type !== 'error') {
      setTimeout(() => dismiss(id), 3000)
    }
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const colors = {
    success: { bg: '#16A34A', border: '#15803D' },
    error:   { bg: '#DC2626', border: '#B91C1C' },
    info:    { bg: '#FF0066', border: '#CC0052' },
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container — bottom right */}
      <div style={{
        position: 'fixed',
        bottom: 80,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 12,
            background: colors[t.type]?.bg || colors.success.bg,
            border: `1px solid ${colors[t.type]?.border || colors.success.border}`,
            color: 'white',
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            maxWidth: 340,
            pointerEvents: 'all',
            animation: 'slideInToast 0.25s ease',
          }}>
            <span style={{ flex: 1 }}>{t.message}</span>
            {/* X button — always shown on errors, optionally on others */}
            <button
              onClick={() => dismiss(t.id)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                width: 20,
                height: 20,
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >×</button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}