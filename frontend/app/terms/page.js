'use client'

import Link from 'next/link'

export default function TermsOfUsePage() {
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
            <h1>Terms of Use</h1>
            <p>Last updated: January 2025</p>
          </div>

          <div className="legal-content">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using MalawiEduHub, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              MalawiEduHub is an educational document library that provides access to past papers, notes, textbooks, and other educational resources for students and teachers in Malawi. The platform operates on a subscription, pay-per-download, or upload-to-access model.
            </p>

            <h2>3. User Accounts</h2>
            <ul>
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>You must notify us immediately if you suspect unauthorized use of your account.</li>
            </ul>

            <h2>4. Document Uploads</h2>
            <p>When uploading documents to MalawiEduHub, you agree that:</p>
            <ul>
              <li>You have the right to share the content you upload.</li>
              <li>The content is educational and does not violate any laws.</li>
              <li>You will not upload duplicate, spam, or malicious content.</li>
              <li>Uploaded documents may be reviewed by administrators before being published.</li>
              <li>You grant MalawiEduHub a non-exclusive license to distribute the uploaded content through our platform.</li>
            </ul>

            <h2>5. Access and Payment</h2>
            <ul>
              <li><strong>Subscription Plans:</strong> Daily, weekly, and monthly plans are available for unlimited downloads during the subscription period.</li>
              <li><strong>Pay Per Download:</strong> Individual documents can be purchased for a one-time fee.</li>
              <li><strong>Upload Access:</strong> Users who upload 5–10 approved documents receive free 1-day access.</li>
              <li>All payments are processed securely via Airtel Money or TNM Mpamba.</li>
              <li>Subscription fees are non-refundable except where required by law.</li>
            </ul>

            <h2>6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the platform for any unlawful purpose.</li>
              <li>Attempt to bypass download restrictions or share download links.</li>
              <li>Copy, reproduce, or redistribute documents without permission.</li>
              <li>Interfere with the proper functioning of the platform.</li>
              <li>Attempt to gain unauthorized access to any part of the system.</li>
              <li>Upload content that infringes on intellectual property rights of others.</li>
            </ul>

            <h2>7. Intellectual Property</h2>
            <p>
              The MalawiEduHub platform, including its original content, features, and functionality, is owned by MalawiEduHub and is protected by international copyright, trademark, and other intellectual property laws. User-uploaded content remains the property of the respective uploaders.
            </p>

            <h2>8. Disclaimer</h2>
            <p>
              MalawiEduHub is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free. We are not responsible for the accuracy or quality of user-uploaded content.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              In no event shall MalawiEduHub, its directors, employees, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the platform.
            </p>

            <h2>10. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violations of these Terms of Use or for any other reason at our sole discretion. Upon termination, your right to use the platform will immediately cease.
            </p>

            <h2>11. Changes to Terms</h2>
            <p>
              We may modify these Terms of Use at any time. We will notify users of significant changes by posting a notice on our platform or by email. Your continued use of the platform after such modifications constitutes your acceptance of the new terms.
            </p>

            <h2>12. Governing Law</h2>
            <p>
              These Terms of Use shall be governed by and construed in accordance with the laws of the Republic of Malawi, without regard to its conflict of law provisions.
            </p>

            <h2>13. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Use, please contact us at:
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
