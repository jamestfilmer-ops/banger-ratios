'use client'

// Re-exports from ToastContext so both import paths work:
// import { useToast } from '../components/Toast'         ← profile/page.js uses this
// import { useToast } from '../components/ToastContext'  ← other pages use this
export { ToastProvider, useToast } from './ToastContext'