export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '24px',
      textAlign: 'center',
      marginTop: 'auto',
    }}>
      <p style={{ color: 'var(--gray-text)', fontSize: 12 }}>
        Banger Ratios™ 2026
        {'  ·  '}
        <a href="/about" style={{ color: 'var(--pink)' }}>About</a>
        {'  ·  '}
        <a href="/terms" style={{ color: 'var(--pink)' }}>Terms</a>
        {'  ·  '}
        <a href="/settings" style={{ color: 'var(--pink)' }}>Settings</a>
      </p>
    </footer>
  )
}
