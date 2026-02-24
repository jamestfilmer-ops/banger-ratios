export default function TermsPage() {
  const sections = [
    ['1. Acceptance',          'By accessing bangerratios.com you agree to these Terms. If you do not agree, do not use the site.'],
    ['2. Service',             'Banger Ratios is a community platform for rating music albums on a track-by-track basis.'],
    ['3. User Accounts',       'You must provide accurate information and be at least 13 years old to create an account. You are responsible for keeping your password secure.'],
    ['4. User Content',        'By submitting ratings, you grant Banger Ratios a license to display that content. You retain ownership. Do not submit false or misleading ratings.'],
    ['5. Music Data',          'Album, track, and artwork data is sourced from the Apple iTunes API and belongs to the respective rights holders. It is used for identification and rating purposes only.'],
    ['6. Prohibited Conduct',  'Do not harass other users, attempt unauthorized access, use bots to inflate ratings, or use the service for any unlawful purpose.'],
    ['7. Disclaimers',         'The service is provided as-is. Banger Ratios is not responsible for the accuracy of user-generated ratings.'],
    ['8. Liability',           'Banger Ratios is not liable for any indirect, incidental, or consequential damages from use of the service.'],
    ['9. Privacy',             'We collect email addresses and rating data to provide the service. We do not sell personal information.'],
    ['10. Changes',            'We may update these terms at any time. Continued use constitutes acceptance of updated terms.'],
    ['11. Contact',            'For questions: hello@bangerratios.com'],
  ]
 
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Terms & Conditions</h1>
      <p style={{ color: 'var(--gray-400)', fontSize: 14, marginBottom: 32 }}>Last updated: February 2026</p>
      {sections.map(([title, text]) => (
        <section key={title} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{title}</h2>
          <p style={{ color: '#444', lineHeight: 1.75, fontSize: 14 }}>{text}</p>
        </section>
      ))}
    </main>
  )
}
