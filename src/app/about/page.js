'use client'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>

      <div style={{ marginBottom: 40 }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,0,102,0.08)',
          border: '1px solid rgba(255,0,102,0.18)',
          borderRadius: 20, padding: '4px 14px',
          fontSize: 11, fontWeight: 600, color: 'var(--pink)',
          letterSpacing: 1, textTransform: 'uppercase',
          marginBottom: 16,
        }}>About</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>
          Banger Ratios
        </h1>
        <p style={{ fontSize: 18, color: 'var(--gray-text)', lineHeight: 1.6, margin: 0 }}>
          Streaming tells you what is popular. We tell you what is actually good.
        </p>
      </div>

      <div style={{ color: '#444', fontSize: 15, lineHeight: 1.75 }}>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--black)', marginBottom: 12 }}>The problem with streams</h2>
          <p style={{ marginBottom: 14 }}>
            A track that plays on autopilot for 31 seconds counts the same as a track someone plays
            on repeat for a week. Spotify top charts are shaped by playlist placements, label
            budgets, and skip-rate optimization — not by whether a song is actually worth your time.
          </p>
          <p style={{ marginBottom: 0 }}>
            There has never been a neutral, community-driven metric for album quality.
            That is the gap Banger Ratios fills.
          </p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--black)', marginBottom: 12 }}>What the Banger Ratio measures</h2>
          <p style={{ marginBottom: 14 }}>
            Rate every track on an album 1–7. Any track that the community averages at 5.0 or higher
            is a banger. The Banger Ratio is:
          </p>
          <div style={{
            background: 'rgba(255,0,102,0.06)', border: '1px solid rgba(255,0,102,0.15)',
            borderRadius: 12, padding: '16px 20px', margin: '16px 0',
            fontWeight: 700, fontSize: 16, color: 'var(--black)', textAlign: 'center',
          }}>
            Banger Ratio = bangers divided by total tracks times 100
          </div>
          <p style={{ marginBottom: 0 }}>
            An album with 10 tracks where 8 average 5+ has an{' '}
            <span style={{ color: 'var(--pink)', fontWeight: 700 }}>80% Banger Ratio</span>.
            Simple. Arguable. That is exactly the point.
          </p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--black)', marginBottom: 14 }}>The rating scale</h2>
          <div style={{ background: 'var(--bg-soft)', borderRadius: 14, overflow: 'hidden' }}>
            {[
              ['7', 'Perfect', 'A masterpiece. Flawless execution.', true],
              ['6', 'Great', 'Excellent. In regular rotation.', true],
              ['5', 'Good', 'Solid. This is the banger threshold.', true],
              ['4', 'OK', 'Decent but forgettable.', false],
              ['3', 'Meh', 'Filler. Would not seek it out.', false],
              ['2', 'Bad', 'Actively drags the album down.', false],
              ['1', 'Awful', 'Skip every time without exception.', false],
            ].map(([num, label, desc, isBanger], i, arr) => (
              <div key={num} style={{
                display: 'flex', gap: 16, alignItems: 'center',
                padding: '11px 18px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'white' : 'transparent',
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14,
                  background: isBanger ? 'rgba(255,0,102,0.1)' : 'var(--bg-soft)',
                  color: isBanger ? 'var(--pink)' : 'var(--gray-text)',
                }}>{num}</span>
                <span style={{ fontWeight: 600, width: 70, fontSize: 14, color: isBanger ? 'var(--black)' : 'var(--gray-text)' }}>{label}</span>
                <span style={{ fontSize: 13, color: 'var(--gray-text)' }}>{desc}</span>
                {isBanger && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                    color: 'var(--pink)', background: 'rgba(255,0,102,0.08)',
                    padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                  }}>BANGER</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--black)', marginBottom: 14 }}>Album classifications</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              ['90-100%', 'Certified Classic', '#00B84D'],
              ['75-89%',  'Solid Gold',        '#FF9500'],
              ['60-74%',  'Hit or Miss',       'var(--pink)'],
              ['40-59%',  'Filler Warning',    '#888'],
              ['0-39%',   'Skip It',           '#888'],
            ].map(([pct, label, color]) => (
              <div key={pct} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'white', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 16px',
              }}>
                <span style={{ fontWeight: 700, fontSize: 13, color, width: 80 }}>{pct}</span>
                <span style={{ fontSize: 14, color: 'var(--gray-text)' }}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--black)', marginBottom: 12 }}>Who made this</h2>
          <p style={{ marginBottom: 14 }}>
            I am Isaac — a Certified Financial Planner based in Nashville, Tennessee.
            I built Banger Ratios because I got tired of not having real data to back up
            arguments about music.
          </p>
          <p style={{ marginBottom: 0 }}>
            Nashville is the music industry backyard. The conversations here are constant.
            Everyone has opinions. Nobody has numbers. That changes here.
          </p>
        </section>

        <section style={{
          background: 'var(--bg-soft)', borderRadius: 14, padding: '20px 24px', marginBottom: 32,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--black)', marginBottom: 10 }}>Privacy</h2>
          <p style={{ fontSize: 14, margin: 0, lineHeight: 1.65 }}>
            We collect your email, username, and ratings to operate the platform.
            We do not sell your data. You can delete your account at any time.
            Questions: <a href="mailto:hello@bangerratios.com" style={{ color: 'var(--pink)' }}>hello@bangerratios.com</a>
          </p>
        </section>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/albums" style={{
            display: 'inline-block', background: 'var(--pink)', color: 'white',
            padding: '12px 24px', borderRadius: 12, fontWeight: 600, fontSize: 14,
          }}>Start Rating Albums</Link>
          <Link href="/leaderboards" style={{
            display: 'inline-block', border: '1.5px solid var(--border)',
            padding: '12px 24px', borderRadius: 12, fontWeight: 500, fontSize: 14, color: 'var(--black)',
          }}>View the Leaderboard</Link>
        </div>

      </div>
    </div>
  )
}
