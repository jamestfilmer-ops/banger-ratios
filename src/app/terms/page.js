// FILE: src/app/terms/page.js
// Cmd+A → Delete → Paste

export default function TermsPage() {
  const sections = [
    ['1. Acceptance of Terms',
     'By accessing or using Banger Ratios ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, you may not access or use the Service. These Terms apply to all visitors, users, and others who access or use the Service.'],

    ['2. Eligibility',
     'You must be at least 13 years of age to use this Service. By using the Service, you represent and warrant that you meet this age requirement. Users under 18 should review these Terms with a parent or guardian.'],

    ['3. Description of Service',
     'Banger Ratios is a community platform that allows users to rate music albums on a track-by-track basis using a 1 to 7 scale and generate a "Banger Ratio" score. The Service is provided for entertainment and informational purposes only.'],

    ['4. User Accounts',
     'When you create an account, you must provide accurate, complete, and current information. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately at hello@bangerratios.com of any unauthorized use of your account.'],

    ['5. User-Generated Content',
     'By submitting ratings, comments, or other content ("User Content"), you grant Banger Ratios a non-exclusive, royalty-free, worldwide, perpetual license to use, display, reproduce, and distribute such content in connection with the Service. You represent that you have the right to submit such content and that it does not violate any third-party rights.'],

    ['6. Music and Intellectual Property',
     'Album artwork, track names, artist names, and related metadata displayed on Banger Ratios are sourced from the Apple iTunes API and are the property of their respective rights holders. Banger Ratios uses this data solely for identification and rating purposes and does not claim ownership of any such content. All trademarks, service marks, and trade names belong to their respective owners.'],

    ['7. Prohibited Conduct',
     'You agree not to: (a) use the Service for any unlawful purpose; (b) harass, threaten, or intimidate other users; (c) use automated bots or scripts to submit ratings or access the Service; (d) attempt to gain unauthorized access to any portion of the Service; (e) submit false, misleading, or manipulative ratings; (f) impersonate any person or entity; (g) collect or harvest any personally identifiable information from the Service; or (h) engage in any conduct that restricts or inhibits any other user from using the Service.'],

    ['8. Privacy Policy',
     'Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of information as described therein. We collect email addresses and usage data to provide and improve the Service. We do not sell your personal information to third parties. We may use third-party services including Supabase for database storage and authentication, and Apple iTunes API for music data. These services have their own privacy policies.'],

    ['9. Disclaimer of Warranties',
     'THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. Banger Ratios does not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. Music ratings and Banger Ratios scores represent community opinions only and should not be taken as professional critical assessments.'],

    ['10. Limitation of Liability',
     'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, BANGER RATIOS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE SERVICE.'],

    ['11. Indemnification',
     'You agree to indemnify, defend, and hold harmless Banger Ratios and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or in any way connected with your access to or use of the Service, your User Content, or your violation of these Terms.'],

    ['12. Third-Party Links and Services',
     'The Service may contain links to third-party websites or services, including concert ticket providers and music streaming platforms. Banger Ratios has no control over and assumes no responsibility for the content, privacy policies, or practices of any third-party websites or services. We encourage you to review the terms and privacy policies of any third-party services you use.'],

    ['13. Modifications to Terms',
     'Banger Ratios reserves the right to modify these Terms at any time. We will notify users of material changes by updating the date at the top of this page. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.'],

    ['14. Termination',
     'Banger Ratios reserves the right to suspend or terminate your account and access to the Service at any time, with or without cause, with or without notice. Upon termination, your right to use the Service will immediately cease.'],

    ['15. Governing Law',
     'These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in the United States.'],

    ['16. Contact',
     'If you have any questions about these Terms, please contact us at hello@bangerratios.com.'],
  ]

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Terms & Conditions</h1>
      <p style={{ color: 'var(--gray-text)', fontSize: 13, marginBottom: 8 }}>
        Last updated: February 2026
      </p>
      <p style={{ color: 'var(--gray-text)', fontSize: 13, marginBottom: 40, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        Please read these Terms and Conditions carefully before using Banger Ratios. By creating an account or using our service, you agree to these terms.
      </p>

      {sections.map(([title, text]) => (
        <section key={title} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--black)' }}>{title}</h2>
          <p style={{ color: '#444', lineHeight: 1.75, fontSize: 14 }}>{text}</p>
        </section>
      ))}

      <div style={{ marginTop: 48, padding: '20px 24px', background: 'var(--bg-soft)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 13, color: 'var(--gray-text)', lineHeight: 1.6 }}>
          These terms are effective as of February 2026. Banger Ratios is an independent music rating platform. 
          For questions or concerns, contact <a href="mailto:hello@bangerratios.com" style={{ color: 'var(--pink)' }}>hello@bangerratios.com</a>.
        </p>
      </div>
    </main>
  )
}