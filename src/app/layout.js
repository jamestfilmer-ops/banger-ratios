import './globals.css'
import Nav from './components/Nav'
 
export const metadata = {
  title: 'Banger Ratios — The Real Measure of Musical Consistency',
  description: 'Rate every track 1-7. See the Banger Ratio. Settle the debate.',
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
        <Nav />
        {children}
      </body>
    </html>
  )
}
