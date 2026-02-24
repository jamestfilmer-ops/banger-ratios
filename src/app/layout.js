import './globals.css'
import Nav from './components/Nav'

export const metadata = {
  title: 'Banger Ratios',
  description: 'Rate albums track by track. The Banger Ratio reveals which albums actually deliver.',
  metadataBase: new URL('https://www.bangerratios.com'),
  openGraph: {
    title: 'Banger Ratios',
    description: 'Rate albums track by track. The Banger Ratio reveals which albums actually deliver.',
    url: 'https://www.bangerratios.com',
    siteName: 'Banger Ratios',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US', type: 'website',
  },
}

const NEWS = [
  '♥ Banger Ratios — Rate every track. Find the real bangers.',
  'Kendrick Lamar leads the community leaderboard this week.',
  'New: search any album by name and rate it instantly.',
  'Frank Ocean Blonde — 96% Banger Ratio from the community.',
  'Tyler, the Creator IGOR — 93% Banger Ratio. A masterpiece?',
  'Chappell Roan rising fast — rate her albums now.',
  'What is YOUR ratio? Sign in and start rating today.',
]

export default function RootLayout({ children }) {
  const ticker = [...NEWS, ...NEWS].join('   ◆   ')
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {/* Scrolling news banner */}
        <div style={{ background:'var(--pink)', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
          <div style={{
            display: 'inline-flex',
            animation: 'scroll-left 60s linear infinite',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ color:'#fff', fontSize:'0.78rem', fontWeight:500, letterSpacing:'0.04em', paddingRight:80 }}>{ticker}</span>
            <span style={{ color:'#fff', fontSize:'0.78rem', fontWeight:500, letterSpacing:'0.04em', paddingRight:80 }}>{ticker}</span>
          </div>
        </div>
        <Nav />
        {children}
        <footer style={{
          borderTop: '1px solid var(--border)',
          marginTop: '5rem',
          padding: '2rem',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--gray-text)',
        }}>
          © 2026 Banger Ratios. All rights reserved.
          {' · '}
          <a href="/terms" style={{ color:'var(--pink)' }}>Terms</a>
          {' · '}
          <a href="/about" style={{ color:'var(--pink)' }}>About</a>
        </footer>
      </body>
    </html>
  )
}
