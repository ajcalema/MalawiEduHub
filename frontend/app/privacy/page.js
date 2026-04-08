'use client'

import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <>
      <style jsx global>{`
        :root {
          --green: #0d7a55;
          --green-light: #1aab78;
          --green-pale: #e6f7f1;
          --dark: #0e1a14;
          --text: #1a2e22;
          --text-muted: #5a7a66;
          --border: #d0e8db;
          --surface: #f5faf7;
        }
        .legal-page {
          min-height: 100vh;
          background: var(--surface);
          padding-top: 100px;
        }
        .legal-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 5% 80px;
        }
        .legal-header {
          margin-bottom: 40px;
        }
        .legal-header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(32px, 4vw, 48px);
          color: var(--dark);
          margin-bottom: 12px;
        }
        .legal-header p {
          font-size: 14px;
          color: var(--text-muted);
        }
        .legal-content {
          background: white;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 40px;
        }
        .legal-content h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 22px;
          color: var(--dark);
          margin-top: 32px;
          margin-bottom: 16px;
        }
        .legal-content h2:first-child {
          margin-top: 0;
        }
        .legal-content p {
          font-size: 15px;
          line-height: 1.8;
          color: var(--text-muted);
          margin-bottom: 16px;
        }
        .legal-content ul {
          margin: 0 0 16px 24px;
          padding: 0;
        }
        .legal-content li {
          font-size: 15px;
          line-height: 1.8;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--green);
          text-decoration: none;
          margin-bottom: 24px;
        }
        .back-link:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="legal-page">
        <div className="legal-container">
          <Link href="/" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to home
          </Link>

          <div className="legal-header">
            <h1>Privacy Policy</h1>
            <p>Last updated: January 2025</p>
          </div>

          <div className="legal-content">
            <h2>1. Introduction</h2>
            <p>
              MalawiEduHub ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our educational document platform.
            </p>

            <h2>2. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul>
              <li><strong>Account Information:</strong> Full name, email address, phone number, and password when you register.</li>
              <li><strong>Document Uploads:</strong> Files you upload, including metadata such as titles, subjects, and descriptions.</li>
              <li><strong>Payment Information:</strong> Transaction records for subscriptions and downloads (processed securely via Airtel Money or TNM Mpamba).</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our platform, including documents viewed, downloaded, and search queries.</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our educational services.</li>
              <li>Process payments and manage subscriptions.</li>
              <li>Detect and prevent duplicate document uploads.</li>
              <li>Send you important updates about your account and our services.</li>
              <li>Respond to your comments, questions, and support requests.</li>
              <li>Monitor and analyze usage patterns to improve user experience.</li>
            </ul>

            <h2>4. Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul>
              <li><strong>With your consent:</strong> When you have given us permission to share your information.</li>
              <li><strong>Service providers:</strong> With third-party vendors who perform services on our behalf (e.g., cloud storage, payment processing).</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights and the safety of our users.</li>
            </ul>

            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
            </p>

            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and update your personal information through your account settings.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Opt out of receiving promotional communications from us.</li>
              <li>Request a copy of the personal data we hold about you.</li>
            </ul>

            <h2>7. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to improve your experience on our platform. Cookies help us keep you signed in, remember your preferences, and understand how you use our services.
            </p>

            <h2>8. Children's Privacy</h2>
            <p>
              MalawiEduHub is intended for users of all ages, including students. We do not knowingly collect personal information from children under 13 without parental consent. If you believe we have collected information from a child under 13, please contact us.
            </p>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <ul>
              <li>Email: adamkalema90@gmail.com</li>
              <li>Phone: +265 888 227 462</li>
              <li>Address: Lilongwe, Malawi</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
