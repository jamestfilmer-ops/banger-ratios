'use client'
 
const MERCH = [
  { name: '"Certified Classic" Tee',       price: '$32', img: '👕', desc: 'White tee, hot pink print. 100% cotton.',          tag: 'BESTSELLER' },
  { name: '"Skip It" Tee',                 price: '$32', img: '👕', desc: 'Black tee, red print. For the brutally honest.',    tag: '' },
  { name: 'Banger Ratios Dad Hat',         price: '$28', img: '🧢', desc: 'Pink embroidered BR logo. Adjustable.',             tag: 'NEW' },
  { name: 'Hot Pink Hoodie',               price: '$55', img: '🧥', desc: 'Heavyweight hoodie. "Rate Everything" back.',       tag: '' },
  { name: 'Enamel Pin Set (3-pack)',        price: '$15', img: '📌', desc: 'Certified Classic, Solid Gold, Skip It pins.',      tag: '' },
  { name: 'Vinyl Sticker Pack (10)',        price: '$8',  img: '✨', desc: 'Die-cut hot pink stickers.',                        tag: 'POPULAR' },
  { name: 'Banger Ratio Mug',       price: '$18', img: '☕', desc: 'Ceramic mug. Pink interior. Dishwasher safe.',      tag: '' },
  { name: 'Banger Ratios Tote Bag',        price: '$22', img: '👜', desc: 'Canvas tote. "Rate Everything™" print.',            tag: '' },
  { name: 'Certified Classic Poster',      price: '$20', img: '🖼️', desc: 'Gallery-quality 18×24 print.',                     tag: 'LIMITED' },
  { name: 'BR Socks (3-pack)',             price: '$16', img: '🧦', desc: 'Hot pink, black, and white. Crew length.',          tag: '' },
  { name: 'Phone Case',                    price: '$24', img: '📱', desc: 'Slim case. Hot pink gradient. iPhone & Android.',    tag: '' },
  { name: 'Artist Collab Crewneck',        price: '$48', img: '👕', desc: 'Limited drops with Certified Classic artists.',     tag: 'COMING SOON' },
]
 
export default function MerchPage() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Merch</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>Wear your taste. Rep your ratios.</p>
      </div>
 
      <div style={{
        background: 'var(--pink-light)', borderRadius: 14, padding: '16px 20px',
        marginBottom: 32, textAlign: 'center',
      }}>
        <p style={{ color: 'var(--pink)', fontSize: 14, fontWeight: 600 }}>
          🚧 Merch store launching soon! Join the waitlist for early access + 15% off.
        </p>
        <div style={{
          display: 'flex', maxWidth: 380, margin: '12px auto 0',
          borderRadius: 10, border: '1px solid rgba(255,0,102,0.2)', overflow: 'hidden',
        }}>
          <input placeholder="your@email.com" style={{
            flex: 1, padding: '10px 14px', border: 'none', outline: 'none', fontSize: 14, background: 'white',
          }} />
          <button style={{
            padding: '10px 18px', background: 'var(--pink)', border: 'none',
            color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>Notify Me</button>
        </div>
      </div>
 
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {MERCH.map((item, i) => (
          <div key={i} style={{ borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.06)' }}
            onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
            <div style={{ background: 'var(--gray-100)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, position: 'relative' }}>
              {item.img}
              {item.tag && (
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  background: item.tag === 'COMING SOON' ? 'var(--black)' : 'var(--pink)',
                  color: 'white', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4, letterSpacing: 1,
                }}>{item.tag}</span>
              )}
            </div>
            <div style={{ padding: 14 }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{item.name}</p>
              <p style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 8 }}>{item.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--pink)' }}>{item.price}</span>
                <button style={{
                  padding: '6px 14px', borderRadius: 7, border: '1px solid var(--gray-200)',
                  background: 'white', color: 'var(--gray-600)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}>
                  {item.tag === 'COMING SOON' ? 'Notify Me' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
