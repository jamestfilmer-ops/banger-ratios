// ============================================================
// FILE: src/app/layout.js
// WHAT: Root layout — adds ToastProvider so all pages can use toasts
// HOW: Cmd+A → Delete → Paste → Save → git add/commit/push
// ============================================================

import './globals.css'
import Nav from './components/Nav'
import NewsBanner from './components/NewsBanner'
import Footer from './components/Footer'
import { ToastProvider } from './components/Toast'

export const metadata = {
  title: 'Banger Ratios — The Real Measure of Musical Consistency',
  description: 'Rate every track 1-7. See the Banger Ratio. Settle the debate.',
  openGraph: {
    title: 'Banger Ratios',
    description: 'Rate every track 1-7. See the Banger Ratio.',
    url: 'https://www.bangerratios.com',
    siteName: 'Banger Ratios',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>
          <NewsBanner />
          <Nav />
          {children}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  )
}