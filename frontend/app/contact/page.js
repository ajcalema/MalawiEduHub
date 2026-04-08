'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Implement actual form submission to backend
    setSubmitted(true)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

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
        .contact-page {
          min-height: 100vh;
          background: var(--surface);
          padding-top: 100px;
        }
        .contact-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 5% 80px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
        }
        .contact-info h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(32px, 4vw, 48px);
          color: var(--dark);
          margin-bottom: 20px;
        }
        .contact-info p {
          font-size: 16px;
          line-height: 1.7;
          color: var(--text-muted);
          margin-bottom: 32px;
        }
        .contact-methods {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .contact-method {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .contact-method-icon {
          width: 48px;
          height: 48px;
          background: var(--green-pale);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .contact-method-icon svg {
          width: 22px;
          height: 22px;
          color: var(--green);
        }
        .contact-method-label {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .contact-method-value {
          font-size: 16px;
          font-weight: 500;
          color: var(--text);
        }
        .contact-form-wrapper {
          background: white;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 36px;
        }
        .contact-form-wrapper h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          color: var(--dark);
          margin-bottom: 24px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
          margin-bottom: 8px;
        }
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          font-size: 15px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          background: white;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(13, 122, 85, 0.1);
        }
        .form-group textarea {
          min-height: 140px;
          resize: vertical;
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
          color: white;
          background: var(--green);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .submit-btn:hover {
          background: var(--green-light);
          transform: translateY(-1px);
        }
        .success-message {
          text-align: center;
          padding: 40px 20px;
        }
        .success-icon {
          width: 64px;
          height: 64px;
          background: var(--green-pale);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .success-icon svg {
          width: 32px;
          height: 32px;
          color: var(--green);
        }
        .success-message h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          color: var(--dark);
          margin-bottom: 12px;
        }
        .success-message p {
          color: var(--text-muted);
          margin-bottom: 24px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--green);
          text-decoration: none;
        }
        .back-link:hover {
          text-decoration: underline;
        }
        @media (max-width: 768px) {
          .contact-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="contact-page">
        <div className="contact-container">
          <div className="contact-info">
            <h1>Get in touch</h1>
            <p>
              Have questions about MalawiEduHub? Need help with your account, subscriptions, or document uploads? 
              We're here to help. Reach out to us using the form or through the contact methods below.
            </p>

            <div className="contact-methods">
              <div className="contact-method">
                <div className="contact-method-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="contact-method-label">Email</div>
                  <div className="contact-method-value">adamkalema90@gmail.com</div>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-method-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="contact-method-label">Phone</div>
                  <div className="contact-method-value">+265 888 227 462</div>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-method-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="contact-method-label">Location</div>
                  <div className="contact-method-value">Lilongwe, Malawi</div>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-method-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="contact-method-label">Response Time</div>
                  <div className="contact-method-value">Within 24 hours</div>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form-wrapper">
            {submitted ? (
              <div className="success-message">
                <div className="success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2>Message sent!</h2>
                <p>Thank you for reaching out. We'll get back to you within 24 hours.</p>
                <Link href="/" className="back-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back to home
                </Link>
              </div>
            ) : (
              <>
                <h2>Send us a message</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this about?"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more about your inquiry..."
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn">
                    Send Message
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
