// FILE: src/app/about/page.js
// Cmd+A → Delete → Paste
'use client'
 
export default function AboutPage() {
  const scale = [
    [7, 'Perfect',     'A flawless track. Rare.',         true ],
    [6, 'Great',       'Excellent. In regular rotation.', true ],
    [5, 'Good',        'Solid. This is the threshold.',   true ],
    [4, 'Decent',      'Fine but forgettable.',           false],
    [3, 'Filler',      'Would not seek it out.',          false],
    [2, 'Weak',        'Drags the album down.',           false],
    [1, 'Not for me',  'Skip every time.',                false],
  ]
  const tiers = [
    ['💎','95–100%','Untouchable'],
    ['🔥','80–94%', 'Certified Banger'],
    ['🥇','65–79%', 'Solid Gold'],
    ['🎵','50–64%', 'More Hits Than Misses'],
    ['🎲','35–49%', 'Hit or Miss'],
    ['⚠️','20–34%', 'Filler Heavy'],
    ['❌','0–19%',  'Skip It'],
  ]
  return (
    <div style={{ background:'var(--bg-soft)',minHeight:'100vh' }}>
      {/* Hero */}
      <section style={{ background:'var(--black)',padding:'72px 24px 64px',textAlign:'center' }}>
        <div style={{ display:'inline-block',background:'var(--pink)',borderRadius:12,
          padding:'8px 20px',fontSize:12,fontWeight:700,color:'white',
          letterSpacing:2,marginBottom:24 }}>BANGER RATIOS</div>
        <h1 style={{ fontSize:'clamp(32px,6vw,56px)',fontWeight:800,color:'white',
          lineHeight:1.1,maxWidth:700,margin:'0 auto 20px' }}>
          Rate every track.<br/>
          <span style={{ color:'var(--pink)' }}>See the math.</span><br/>
          Settle the debate.
        </h1>
        <p style={{ color:'#888',fontSize:16,maxWidth:500,margin:'0 auto' }}>
          Streaming tells you what is popular.<br/>
          Banger Ratios tells you what is actually good.
        </p>
      </section>
      <main style={{ maxWidth:800,margin:'0 auto',padding:'56px 24px 80px' }}>
        {/* How it works */}
        <section style={{ marginBottom:64 }}>
          <h2 style={{ fontSize:24,fontWeight:700,marginBottom:8 }}>How it works</h2>
          <p style={{ color:'#555',fontSize:15,lineHeight:1.75 }}>
            Rate every track on an album 1–7. Any track that averages 5.0 or above is a banger.
            Banger Ratio is bangers divided by total tracks, expressed as a percentage.
            An album with 10 tracks and 8 bangers has an{' '}
            <span style={{ color:'var(--pink)',fontWeight:700 }}>80% Banger Ratio</span>.
            Simple. Arguable. Community-powered.
          </p>
        </section>
        {/* Rating scale */}
        <section style={{ marginBottom:64 }}>
          <h2 style={{ fontSize:24,fontWeight:700,marginBottom:20 }}>The scale</h2>
          <div style={{ borderRadius:16,overflow:'hidden',border:'1px solid var(--border)' }}>
            {scale.map(([score,label,desc,isBanger],i) => (
              <div key={score} style={{
                display:'flex',alignItems:'center',gap:16,padding:'14px 20px',
                background: isBanger ? 'rgba(255,0,102,0.04)' : 'white',
                borderBottom: i<6 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize:22,fontWeight:800,color:isBanger?'var(--pink)':'#CCC',
                  width:28,textAlign:'center',flexShrink:0 }}>{score}</span>
                <div style={{ flex:1 }}>
                  <span style={{ fontWeight:700,fontSize:14,color:isBanger?'var(--black)':'#888' }}>{label}</span>
                  <span style={{ fontSize:13,color:'#AAA',marginLeft:10 }}>{desc}</span>
                </div>
                {isBanger && (
                  <span style={{ fontSize:11,fontWeight:700,color:'var(--pink)',
                    background:'rgba(255,0,102,0.1)',padding:'3px 8px',borderRadius:6 }}>
                    BANGER
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
        {/* Tiers */}
        <section style={{ marginBottom:64 }}>
          <h2 style={{ fontSize:24,fontWeight:700,marginBottom:20 }}>Album tiers</h2>
          <div style={{ display:'grid',gap:10 }}>
            {tiers.map(([icon,range,label]) => (
              <div key={label} style={{
                display:'flex',alignItems:'center',gap:14,
                padding:'12px 18px',borderRadius:12,background:'white',
                border:'1px solid var(--border)'
              }}>
                <span style={{ fontSize:24 }}>{icon}</span>
                <span style={{ fontWeight:700,color:'var(--pink)',width:80,flexShrink:0,fontSize:13 }}>{range}</span>
                <span style={{ fontWeight:600,fontSize:14 }}>{label}</span>
              </div>
            ))}
          </div>
        </section>
        {/* Who we are */}
        <section style={{ marginBottom:48 }}>
          <h2 style={{ fontSize:24,fontWeight:700,marginBottom:12 }}>Who we are</h2>
          <p style={{ color:'#555',fontSize:15,lineHeight:1.75 }}>
            Two music fans in Nashville, Tennessee who got tired of arguing without data.
            Built with real methodology — Bayesian-calibrated scoring with a prior mean of 4.0
            and a banger threshold of 5.0. The math is honest. The opinions are yours.
          </p>
        </section>
        <div style={{ textAlign:'center',padding:'32px 0',borderTop:'1px solid var(--border)' }}>
          <p style={{ color:'#888',fontSize:14 }}>
            Questions or feedback:{' '}
            <a href='mailto:hello@bangerratios.com' style={{ color:'var(--pink)',fontWeight:600 }}>
              hello@bangerratios.com
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
