'use client'
 
import { createContext, useContext, useReducer, useCallback } from 'react'
 
const ToastContext = createContext(null)
 
function reducer(state, action) {
  switch (action.type) {
    case 'ADD':    return [...state, action.toast]
    case 'REMOVE': return state.filter(t => t.id !== action.id)
    default:       return state
  }
}
 
const COLORS = {
  success: { bg: '#00B84D', text: 'white' },
  error:   { bg: '#FF2D55', text: 'white' },
  info:    { bg: 'var(--pink)', text: 'white' },
}
 
export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(reducer, [])
 
  const toast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random()
    dispatch({ type: 'ADD', toast: { id, message, type } })
    if (type !== 'error') setTimeout(() => dispatch({ type: 'REMOVE', id }), duration)
  }, [])
 
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.info
          return (
            <div key={t.id} style={{
              background: c.bg, color: c.text, padding: '12px 18px',
              borderRadius: 10, fontSize: 14, fontWeight: 600,
              boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
              display: 'flex', alignItems: 'center', gap: 10,
              minWidth: 220, maxWidth: 340, pointerEvents: 'all',
              animation: 'toastIn 0.25s ease',
            }}>
              <span style={{ flex: 1 }}>{t.message}</span>
              {t.type === 'error' && (
                <button onClick={() => dispatch({ type: 'REMOVE', id: t.id })} style={{
                  background: 'rgba(255,255,255,0.3)', border: 'none', color: 'white',
                  borderRadius: 6, width: 22, height: 22, cursor: 'pointer',
                  fontSize: 14, fontWeight: 700, lineHeight: 1, flexShrink: 0,
                }}>✕</button>
              )}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
 
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
