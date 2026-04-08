'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { documentsApi } from '@/lib/api'

export default function LandingPage() {
  const [recentDocs, setRecentDocs] = useState([])
  const [loading, setLoading] = useState(true)

  const scrollToSection = (e, id) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const fetchRecentDocs = async () => {
      try {
        const { data } = await documentsApi.browse({ sort: 'newest', limit: 3 })
        setRecentDocs(data?.documents || [])
      } catch (err) {
        console.error('Failed to fetch recent documents:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecentDocs()
  }, [])

  const getIconColor = (index) => {
    const colors = ['g', 'b', 'o']
    return colors[index % 3]
  }

  const formatDocMeta = (doc) => {
    const parts = [doc.level?.toUpperCase(), doc.doc_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())]
    if (doc.year) parts.push(doc.year)
    return parts.filter(Boolean).join(' · ')
  }

  return (
    <>
      <style jsx global>{`
        :root {
          --green: #0d7a55;
          --green-light: #1aab78;
          --green-pale: #e6f7f1;
          --green-mid: #a8dfc9;
          --gold: #d4a017;
          --gold-pale: #fdf4dc;
          --dark: #0e1a14;
          --dark-mid: #1c2e22;
          --text: #1a2e22;
          --text-muted: #5a7a66;
          --text-faint: #8fad9b;
          --white: #ffffff;
          --surface: #f5faf7;
          --border: #d0e8db;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--white);
          color: var(--text);
          overflow-x: hidden;
        }

        /* NAV */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; padding: 0 5%;
          height: 64px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          font-family: 'DM Serif Display', serif;
          font-size: 20px; color: var(--dark);
          text-decoration: none;
        }
        .nav-logo-icon {
          width: 32px; height: 32px; background: var(--green);
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
        }
        .nav-logo-icon svg { width: 18px; height: 18px; }
        .nav-links {
          display: flex; gap: 32px; margin-left: 48px; list-style: none;
        }
        .nav-links a {
          font-size: 14px; color: var(--text-muted); text-decoration: none;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--green); }
        .nav-actions { margin-left: auto; display: flex; gap: 10px; align-items: center; }
        .btn-ghost {
          font-size: 14px; font-weight: 500; padding: 8px 18px;
          border: 1.5px solid var(--border); border-radius: 8px;
          background: transparent; color: var(--text); cursor: pointer;
          text-decoration: none; transition: border-color 0.2s, color 0.2s;
        }
        .btn-ghost:hover { border-color: var(--green); color: var(--green); }
        .btn-primary {
          font-size: 14px; font-weight: 600; padding: 9px 20px;
          border: none; border-radius: 8px;
          background: var(--green); color: #fff; cursor: pointer;
          text-decoration: none; transition: background 0.2s, transform 0.15s;
        }
        .btn-primary:hover { background: var(--green-light); transform: translateY(-1px); }

        /* HERO */
        .hero {
          min-height: 100vh;
          background: var(--dark);
          position: relative; overflow: hidden;
          display: flex; align-items: center;
          padding: 100px 5% 80px;
        }
        .hero-grid {
          position: absolute; inset: 0; opacity: 0.07;
          background-image:
            linear-gradient(var(--green-light) 1px, transparent 1px),
            linear-gradient(90deg, var(--green-light) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .hero-glow {
          position: absolute; top: -120px; right: -80px;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(13,122,85,0.35) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-glow2 {
          position: absolute; bottom: -100px; left: -100px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(212,160,23,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-inner {
          position: relative; z-index: 2;
          max-width: 1100px; margin: 0 auto; width: 100%;
          display: grid; grid-template-columns: 1fr 420px; gap: 60px; align-items: center;
        }
        .hero-tag {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 600; letter-spacing: 0.08em;
          color: var(--green-light); text-transform: uppercase;
          background: rgba(26,171,120,0.12); border: 1px solid rgba(26,171,120,0.25);
          padding: 5px 14px; border-radius: 20px; margin-bottom: 24px;
        }
        .hero-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green-light); animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        .hero h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(38px, 5vw, 62px);
          line-height: 1.1; color: var(--white);
          margin-bottom: 24px;
        }
        .hero h1 em {
          font-style: italic; color: var(--green-light);
        }
        .hero-sub {
          font-size: 17px; line-height: 1.7; color: rgba(255,255,255,0.6);
          max-width: 500px; margin-bottom: 36px;
        }
        .hero-cta { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn-hero {
          font-size: 15px; font-weight: 600; padding: 14px 28px;
          border-radius: 10px; cursor: pointer; text-decoration: none;
          transition: all 0.2s; display: inline-block;
        }
        .btn-hero-green {
          background: var(--green); color: #fff; border: none;
        }
        .btn-hero-green:hover { background: var(--green-light); transform: translateY(-2px); }
        .btn-hero-outline {
          background: transparent; color: #fff;
          border: 1.5px solid rgba(255,255,255,0.25);
        }
        .btn-hero-outline:hover { border-color: rgba(255,255,255,0.6); }
        .hero-stats {
          display: flex; gap: 32px; margin-top: 48px; padding-top: 36px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .hero-stat-val {
          font-family: 'DM Serif Display', serif;
          font-size: 28px; color: var(--white);
        }
        .hero-stat-label { font-size: 13px; color: rgba(255,255,255,0.45); margin-top: 2px; }

        /* HERO CARD */
        .hero-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; padding: 24px;
          backdrop-filter: blur(10px);
          animation: floatUp 0.8s ease both 0.3s;
        }
        @keyframes floatUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        .hc-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.07em;
          color: var(--text-faint); text-transform: uppercase; margin-bottom: 12px;
        }
        .hc-doc {
          display: flex; align-items: center; gap: 12px;
          padding: 12px; border-radius: 10px;
          background: rgba(255,255,255,0.06); margin-bottom: 8px;
          border: 1px solid rgba(255,255,255,0.07);
          animation: slideIn 0.5s ease both;
        }
        .hc-doc:nth-child(2){animation-delay:0.5s}
        .hc-doc:nth-child(3){animation-delay:0.7s}
        .hc-doc:nth-child(4){animation-delay:0.9s}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .hc-doc-icon {
          width: 36px; height: 42px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .hc-doc-icon.g { background: rgba(13,122,85,0.3); }
        .hc-doc-icon.b { background: rgba(24,95,165,0.3); }
        .hc-doc-icon.o { background: rgba(212,160,23,0.3); }
        .hc-doc-name { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.85); }
        .hc-doc-meta { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }
        .hc-doc-dl {
          margin-left: auto; font-size: 11px; font-weight: 600;
          color: var(--green-light);
        }
        .hc-bar {
          margin-top: 16px; padding: 14px;
          background: rgba(13,122,85,0.15); border-radius: 10px;
          border: 1px solid rgba(13,122,85,0.25);
        }
        .hc-bar-top { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .hc-bar-label { font-size: 12px; color: rgba(255,255,255,0.6); }
        .hc-bar-count { font-size: 12px; font-weight: 600; color: var(--green-light); }
        .hc-progress { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; }
        .hc-progress-fill { height: 100%; width: 60%; background: var(--green-light); border-radius: 3px; }
        .hc-bar-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 6px; }

        /* SECTIONS COMMON */
        section { padding: 90px 5%; }
        .section-inner { max-width: 1100px; margin: 0 auto; }
        .section-tag {
          display: inline-block; font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--green); margin-bottom: 14px;
        }
        .section-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(28px, 3.5vw, 44px); line-height: 1.15;
          color: var(--dark); margin-bottom: 16px;
        }
        .section-sub {
          font-size: 16px; line-height: 1.7; color: var(--text-muted);
          max-width: 560px;
        }

        /* HOW IT WORKS */
        .how { background: var(--surface); }
        .how-grid {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; margin-top: 56px;
        }
        .how-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: 16px; padding: 28px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .how-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(13,122,85,0.1); }
        .how-num {
          font-family: 'DM Serif Display', serif;
          font-size: 42px; color: var(--green-pale); line-height: 1;
          margin-bottom: 16px; position: relative;
        }
        .how-num span {
          position: absolute; left: 2px; top: 4px;
          font-size: 38px; color: var(--green); opacity: 0.15;
        }
        .how-card h3 { font-size: 17px; font-weight: 600; color: var(--dark); margin-bottom: 10px; }
        .how-card p { font-size: 14px; line-height: 1.7; color: var(--text-muted); }
        .how-card .tag-pill {
          display: inline-block; margin-top: 14px;
          font-size: 11px; font-weight: 600; padding: 4px 12px;
          border-radius: 20px; background: var(--green-pale); color: var(--green);
        }

        /* PRICING */
        .pricing-grid {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 56px;
        }
        .price-card {
          border: 1.5px solid var(--border); border-radius: 18px; padding: 28px;
          position: relative; transition: transform 0.2s, box-shadow 0.2s;
        }
        .price-card:hover { transform: translateY(-4px); }
        .price-card.featured {
          border-color: var(--green); background: var(--dark);
          box-shadow: 0 20px 60px rgba(13,122,85,0.2);
        }
        .price-card.featured:hover { box-shadow: 0 24px 70px rgba(13,122,85,0.3); }
        .popular-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 4px 14px; border-radius: 20px;
          background: var(--gold); color: var(--dark);
        }
        .price-name { font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 10px; }
        .price-card.featured .price-name { color: rgba(255,255,255,0.5); }
        .price-amount {
          font-family: 'DM Serif Display', serif;
          font-size: 38px; color: var(--dark); line-height: 1;
        }
        .price-card.featured .price-amount { color: var(--white); }
        .price-period { font-size: 14px; color: var(--text-muted); margin-top: 4px; }
        .price-card.featured .price-period { color: rgba(255,255,255,0.45); }
        .price-divider { height: 1px; background: var(--border); margin: 20px 0; }
        .price-card.featured .price-divider { background: rgba(255,255,255,0.1); }
        .price-feature {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 14px; color: var(--text); margin-bottom: 10px; line-height: 1.5;
        }
        .price-card.featured .price-feature { color: rgba(255,255,255,0.75); }
        .price-check {
          width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; margin-top: 1px;
          background: var(--green-pale); display: flex; align-items: center; justify-content: center;
        }
        .price-card.featured .price-check { background: rgba(26,171,120,0.2); }
        .price-check svg { width: 9px; height: 9px; }
        .price-btn {
          display: block; width: 100%; text-align: center;
          margin-top: 20px; padding: 12px; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          text-decoration: none; transition: all 0.2s; border: none;
        }
        .price-btn-outline {
          background: transparent; color: var(--green);
          border: 1.5px solid var(--green);
        }
        .price-btn-outline:hover { background: var(--green-pale); }
        .price-btn-solid { background: var(--green); color: #fff; }
        .price-btn-solid:hover { background: var(--green-light); }
        .upload-free-card {
          margin-top: 20px; padding: 24px 28px;
          background: var(--gold-pale); border: 1.5px solid #e8c96a;
          border-radius: 16px; display: flex; align-items: center; gap: 20px;
        }
        .ufc-icon {
          width: 50px; height: 50px; border-radius: 12px; flex-shrink: 0;
          background: var(--gold); display: flex; align-items: center; justify-content: center;
        }
        .ufc-text h4 { font-size: 16px; font-weight: 600; color: var(--dark); margin-bottom: 4px; }
        .ufc-text p { font-size: 14px; color: #7a5c0a; line-height: 1.6; }

        /* SUBJECTS */
        .subjects { background: var(--dark); }
        .subjects .section-title { color: var(--white); }
        .subjects .section-sub { color: rgba(255,255,255,0.5); }
        .subjects-grid {
          display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-top: 48px;
        }
        .subj-card {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 20px;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
          cursor: pointer;
        }
        .subj-card:hover {
          background: rgba(13,122,85,0.15); border-color: rgba(13,122,85,0.4);
          transform: translateY(-3px);
        }
        .subj-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 12px;
          font-size: 20px;
        }
        .subj-name { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.85); }
        .subj-count { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 3px; }

        /* DOCUMENT TYPES */
        .doc-types { background: var(--white); padding: 80px 5%; }
        .doc-types .section-title { color: var(--dark); }
        .doc-types .section-sub { color: var(--text-muted); }
        .doc-types-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 24px; margin-top: 56px;
        }
        .doc-type-card {
          padding: 32px 20px; border: 1.5px solid var(--border); border-radius: 16px;
          background: var(--white); text-align: center; transition: all 0.2s;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .doc-type-card:hover {
          border-color: var(--green); transform: translateY(-4px); box-shadow: 0 8px 24px rgba(13,122,85,0.1);
        }
        .doc-type-icon {
          width: 72px; height: 96px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center;
        }
        .doc-type-name { font-size: 15px; font-weight: 600; color: var(--dark); }
        .doc-type-count { font-size: 12px; color: var(--text-muted); }

        /* FEATURES */
        .features-grid {
          display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; margin-top: 56px;
        }
        .feat-card {
          padding: 28px; border: 1px solid var(--border);
          border-radius: 16px; background: var(--white);
          display: flex; gap: 18px; transition: transform 0.2s;
        }
        .feat-card:hover { transform: translateY(-3px); }
        .feat-icon {
          width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
          background: var(--green-pale); display: flex; align-items: center; justify-content: center;
        }
        .feat-icon svg { width: 22px; height: 22px; color: var(--green); }
        .feat-body h3 { font-size: 16px; font-weight: 600; color: var(--dark); margin-bottom: 8px; }
        .feat-body p { font-size: 14px; line-height: 1.7; color: var(--text-muted); }

        /* CTA */
        .cta-section {
          background: var(--green);
          padding: 80px 5%; text-align: center;
        }
        .cta-section h2 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(30px, 4vw, 52px); color: #fff; margin-bottom: 16px;
        }
        .cta-section p { font-size: 17px; color: rgba(255,255,255,0.75); max-width: 500px; margin: 0 auto 36px; }
        .cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-white {
          font-size: 15px; font-weight: 600; padding: 14px 30px;
          border-radius: 10px; background: #fff; color: var(--green);
          border: none; cursor: pointer; text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-white:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .btn-white-outline {
          font-size: 15px; font-weight: 600; padding: 13px 28px;
          border-radius: 10px; background: transparent; color: #fff;
          border: 2px solid rgba(255,255,255,0.45); cursor: pointer; text-decoration: none;
          transition: border-color 0.2s;
        }
        .btn-white-outline:hover { border-color: #fff; }

        /* FOOTER */
        .footer {
          background: var(--dark-mid); padding: 50px 5% 30px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .footer-top {
          display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px;
        }
        .footer-brand p { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.7; margin-top: 12px; max-width: 220px; }
        .footer-col h4 { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 14px; }
        .footer-col a { display: block; font-size: 13px; color: rgba(255,255,255,0.5); text-decoration: none; margin-bottom: 8px; transition: color 0.2s; }
        .footer-col a:hover { color: rgba(255,255,255,0.85); }
        .footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.07); }
        .footer-copy { font-size: 12px; color: rgba(255,255,255,0.3); }
        .footer-payments { display: flex; gap: 10px; align-items: center; }
        .pay-badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); letter-spacing: 0.04em; }

        /* MOBILE */
        @media (max-width: 900px) {
          .hero-inner { grid-template-columns: 1fr; }
          .hero-card { display: none; }
          .how-grid, .pricing-grid, .subjects-grid, .features-grid { grid-template-columns: 1fr 1fr; }
          .footer-top { grid-template-columns: 1fr 1fr; }
          .nav-links { display: none; }
        }
        @media (max-width: 560px) {
          .how-grid, .pricing-grid, .subjects-grid, .features-grid { grid-template-columns: 1fr; }
          .footer-top { grid-template-columns: 1fr; }
          .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
        }

        /* ANIMATIONS */
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal.visible { opacity: 1; transform: none; }
      `}</style>
      
      {/* NAV */}
      <nav className="nav">
        <Link href="/" className="nav-logo">
          <div className="nav-logo-icon">
            <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M9 2v10M2 6l7 4 7-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          MalawiEduHub
        </Link>
        <ul className="nav-links">
          <li><a href="#how" onClick={(e) => scrollToSection(e, 'how')}>How it works</a></li>
          <li><a href="#subjects" onClick={(e) => scrollToSection(e, 'subjects')}>Subjects</a></li>
          <li><a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')}>Pricing</a></li>
          <li><a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a></li>
        </ul>
        <div className="nav-actions">
          <Link href="/auth/login" className="btn-ghost">Sign in</Link>
          <Link href="/auth/register" className="btn-primary">Get started free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid"></div>
        <div className="hero-glow"></div>
        <div className="hero-glow2"></div>
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-tag">
              <div className="hero-tag-dot"></div>
              Malawi&apos;s #1 Educational Library
            </div>
            <h1>Every past paper.<br/><em>Every subject.</em><br/>One place.</h1>
            <p className="hero-sub">
              MalawiEduHub gives students and teachers free access to thousands of past papers, notes, textbooks and revision materials — from Primary all the way to University.
            </p>
            <div className="hero-cta">
              <Link href="/browse" className="btn-hero btn-hero-green">Browse the library</Link>
              <a href="#how" className="btn-hero btn-hero-outline" onClick={(e) => scrollToSection(e, 'how')}>How it works</a>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-val">4,800+</div>
                <div className="hero-stat-label">Documents</div>
              </div>
              <div>
                <div className="hero-stat-val">1,300+</div>
                <div className="hero-stat-label">Active users</div>
              </div>
              <div>
                <div className="hero-stat-val">Free</div>
                <div className="hero-stat-label">Upload to access</div>
              </div>
            </div>
          </div>
          <div className="hero-card">
            <div className="hc-label">Recent uploads</div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.5)' }}>Loading...</div>
            ) : recentDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.5)' }}>No documents yet</div>
            ) : (
              recentDocs.map((doc, index) => (
                <div key={doc.id} className="hc-doc">
                  <div className={`hc-doc-icon ${getIconColor(index)}`}>
                    <svg width="16" height="20" viewBox="0 0 16 20" fill="none"><path d="M2 2h8l4 4v12a2 2 0 01-2 2H2a2 2 0 01-2-2V4a2 2 0 012-2z" stroke={getIconColor(index) === 'g' ? 'rgba(13,122,85,0.8)' : getIconColor(index) === 'b' ? 'rgba(24,95,165,0.8)' : 'rgba(212,160,23,0.8)'} strokeWidth="1.3"/><path d="M10 2v4h4" stroke={getIconColor(index) === 'g' ? 'rgba(13,122,85,0.8)' : getIconColor(index) === 'b' ? 'rgba(24,95,165,0.8)' : 'rgba(212,160,23,0.8)'} strokeWidth="1.3"/></svg>
                  </div>
                  <div>
                    <div className="hc-doc-name">{doc.title}</div>
                    <div className="hc-doc-meta">{formatDocMeta(doc)}</div>
                  </div>
                  <div className="hc-doc-dl">↓ {doc.download_count || 0}</div>
                </div>
              ))
            )}
            <div className="hc-bar">
              <div className="hc-bar-top">
                <div className="hc-bar-label">Your upload progress</div>
                <div className="hc-bar-count">3 / 5 uploads</div>
              </div>
              <div className="hc-progress"><div className="hc-progress-fill"></div></div>
              <div className="hc-bar-sub">Upload 2 more to unlock free 1-day access</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="section-inner">
          <div className="reveal">
            <div className="section-tag">How it works</div>
            <h2 className="section-title">Simple. Fair. Built for Malawi.</h2>
            <p className="section-sub">Three ways to access the library — choose what works best for you.</p>
          </div>
          <div className="how-grid">
            <div className="how-card reveal">
              <div className="how-num">01<span>01</span></div>
              <h3>Upload to unlock</h3>
              <p>Share 5–10 of your own documents — past papers, notes, anything useful. The system automatically rewards you with a free 1-day access pass. Duplicate files are detected and rejected.</p>
              <span className="tag-pill">100% Free</span>
            </div>
            <div className="how-card reveal">
              <div className="how-num">02<span>02</span></div>
              <h3>Subscribe for full access</h3>
              <p>Pay a small subscription fee for unlimited downloads. Daily, weekly, or monthly plans available — all payable via Airtel Money or TNM Mpamba, no bank account needed.</p>
              <span className="tag-pill">From MWK 300/day</span>
            </div>
            <div className="how-card reveal">
              <div className="how-num">03<span>03</span></div>
              <h3>Pay per download</h3>
              <p>Only need one or two documents? Pay for exactly what you want — no subscription required. Each download is MWK 150–300 depending on the document.</p>
              <span className="tag-pill">From MWK 150</span>
            </div>
          </div>
        </div>
      </section>

      {/* DOCUMENT TYPES */}
      <section className="doc-types">
        <div className="section-inner">
          <div className="reveal">
            <div className="section-tag">What we have</div>
            <h2 className="section-title">All the resources you need</h2>
            <p className="section-sub">From past papers to revision guides — everything to help students succeed.</p>
          </div>
          <div className="doc-types-grid">
            <div className="doc-type-card reveal">
              <div className="doc-type-icon">
                <svg width="72" height="96" viewBox="0 0 72 96" fill="none"><rect x="12" y="8" width="48" height="72" rx="4" fill="#e6f7f1" stroke="#0d7a55" strokeWidth="2"/><line x1="20" y1="24" x2="52" y2="24" stroke="#0d7a55" strokeWidth="1.5" strokeLinecap="round"/><line x1="20" y1="32" x2="52" y2="32" stroke="#0d7a55" strokeWidth="1.5" strokeLinecap="round"/><line x1="20" y1="40" x2="52" y2="40" stroke="#0d7a55" strokeWidth="1.5" strokeLinecap="round"/><line x1="20" y1="48" x2="44" y2="48" stroke="#0d7a55" strokeWidth="1.5" strokeLinecap="round"/><path d="M36 60L40 68H32Z" fill="#0d7a55"/></svg>
              </div>
              <div className="doc-type-name">Past Papers</div>
              <div className="doc-type-count">2,400+ exams</div>
            </div>
            <div className="doc-type-card reveal">
              <div className="doc-type-icon">
                <svg width="72" height="96" viewBox="0 0 72 96" fill="none"><path d="M8 12C8 8.13401 11.134 5 15 5H57C60.866 5 64 8.13401 64 12V76C64 79.866 60.866 83 57 83H15C11.134 83 8 79.866 8 76V12Z" fill="#e6f4fb" stroke="#185fa5" strokeWidth="2"/><ellipse cx="36" cy="28" rx="14" ry="10" fill="#185fa5" opacity="0.3"/><rect x="20" y="42" width="32" height="3" fill="#185fa5"/><rect x="20" y="48" width="32" height="3" fill="#185fa5"/><rect x="20" y="54" width="24" height="3" fill="#185fa5"/><rect x="20" y="65" width="28" height="2" fill="#185fa5" opacity="0.5"/></svg>
              </div>
              <div className="doc-type-name">Textbooks</div>
              <div className="doc-type-count">380+ books</div>
            </div>
            <div className="doc-type-card reveal">
              <div className="doc-type-icon">
                <svg width="72" height="96" viewBox="0 0 72 96" fill="none"><path d="M10 18C10 14.134 13.134 11 17 11H55C58.866 11 62 14.134 62 18V78C62 81.866 58.866 85 55 85H17C13.134 85 10 81.866 10 78V18Z" fill="#fdf4dc" stroke="#d4a017" strokeWidth="2"/><circle cx="21" cy="25" r="2" fill="#d4a017"/><line x1="26" y1="25" x2="56" y2="25" stroke="#d4a017" strokeWidth="1.5"/><line x1="18" y1="33" x2="56" y2="33" stroke="#d4a017" strokeWidth="1.5"/><line x1="18" y1="40" x2="56" y2="40" stroke="#d4a017" strokeWidth="1.5"/><line x1="18" y1="47" x2="48" y2="47" stroke="#d4a017" strokeWidth="1.5"/><path d="M36 65C36 61.134 38.686 58 42 58C45.314 58 48 61.134 48 65" stroke="#d4a017" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div className="doc-type-name">Notes & Guides</div>
              <div className="doc-type-count">1,200+ sets</div>
            </div>
            <div className="doc-type-card reveal">
              <div className="doc-type-icon">
                <svg width="72" height="96" viewBox="0 0 72 96" fill="none"><path d="M14 12H58C59.1046 12 60 12.8954 60 14V82C60 83.1046 59.1046 84 58 84H14C12.8954 84 12 83.1046 12 82V14C12 12.8954 12.8954 12 14 12Z" fill="#f0e5ff" stroke="#8b5cf6" strokeWidth="2"/><rect x="18" y="18" width="36" height="10" rx="1" fill="#8b5cf6" opacity="0.2"/><rect x="18" y="32" width="36" height="2" fill="#8b5cf6"/><rect x="18" y="37" width="36" height="2" fill="#8b5cf6"/><rect x="18" y="42" width="28" height="2" fill="#8b5cf6"/><line x1="22" y1="52" x2="50" y2="52" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/><circle cx="36" cy="65" r="8" fill="#8b5cf6" opacity="0.2"/></svg>
              </div>
              <div className="doc-type-name">Revision Guides</div>
              <div className="doc-type-count">450+ guides</div>
            </div>
            <div className="doc-type-card reveal">
              <div className="doc-type-icon">
                <svg width="72" height="96" viewBox="0 0 72 96" fill="none"><path d="M16 14C16 10.134 19.134 7 23 7H49C52.866 7 56 10.134 56 14V78C56 81.866 52.866 85 49 85H23C19.134 85 16 81.866 16 78V14Z" fill="#ffe6e6" stroke="#ef4444" strokeWidth="2"/><path d="M24 20L28 28L24 36H32L28 28L32 20" fill="#ef4444" opacity="0.3"/><line x1="24" y1="44" x2="48" y2="44" stroke="#ef4444" strokeWidth="1.5"/><line x1="24" y1="50" x2="48" y2="50" stroke="#ef4444" strokeWidth="1.5"/><line x1="24" y1="56" x2="40" y2="56" stroke="#ef4444" strokeWidth="1.5"/><path d="M32 68C32 64 34 62 36 62C38 62 40 64 40 68V72C40 73.1046 39.1046 74 38 74H34C32.8954 74 32 73.1046 32 72V68Z" fill="#ef4444" opacity="0.3"/></svg>
              </div>
              <div className="doc-type-name">Marking Schemes</div>
              <div className="doc-type-count">180+ schemes</div>
            </div>
            <div className="doc-type-card reveal">
              <div className="doc-type-icon">
                <svg width="72" height="96" viewBox="0 0 72 96" fill="none"><rect x="12" y="10" width="48" height="70" rx="3" fill="#e6f9f5" stroke="#10b981" strokeWidth="2"/><circle cx="36" cy="28" r="10" fill="#10b981" opacity="0.3"/><line x1="18" y1="43" x2="54" y2="43" stroke="#10b981" strokeWidth="1.5"/><line x1="18" y1="50" x2="54" y2="50" stroke="#10b981" strokeWidth="1.5"/><line x1="18" y1="57" x2="46" y2="57" stroke="#10b981" strokeWidth="1.5"/><path d="M24 68L28 72L36 64" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="doc-type-name">Assignments</div>
              <div className="doc-type-count">320+ problems</div>
            </div>
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section className="subjects" id="subjects">
        <div className="section-inner">
          <div className="reveal">
            <div className="section-tag" style={{color: 'var(--green-light)'}}>Browse by subject</div>
            <h2 className="section-title">Every subject. Every level.</h2>
            <p className="section-sub">From Primary Standard 1 to University — all Malawian curriculum subjects covered.</p>
          </div>
          <div className="subjects-grid">
            <div className="subj-card reveal">
              <div className="subj-icon" style={{background:'rgba(13,122,85,0.2)'}}>📐</div>
              <div className="subj-name">Mathematics</div>
              <div className="subj-count">840 documents</div>
            </div>
            <div className="subj-card reveal">
              <div className="subj-icon" style={{background:'rgba(24,95,165,0.2)'}}>🔬</div>
              <div className="subj-name">Biology</div>
              <div className="subj-count">620 documents</div>
            </div>
            <div className="subj-card reveal">
              <div className="subj-icon" style={{background:'rgba(212,160,23,0.2)'}}>⚗️</div>
              <div className="subj-name">Chemistry</div>
              <div className="subj-count">510 documents</div>
            </div>
            <div className="subj-card reveal">
              <div className="subj-icon" style={{background:'rgba(139,92,246,0.2)'}}>⚡</div>
              <div className="subj-name">Physics</div>
              <div className="subj-count">480 documents</div>
            </div>
            <div className="subj-card reveal">
              <div className="subj-icon" style={{background:'rgba(239,68,68,0.2)'}}>📖</div>
              <div className="subj-name">English</div>
              <div className="subj-count">710 documents</div>
            </div>
            <div className="subj-card reveal">
              <div className="subj-icon" style={{background:'rgba(16,185,129,0.2)'}}>🌿</div>
              <div className="subj-name">Agriculture</div>
              <div className="subj-count">290 documents</div>
            </div>
            <div className="subj-card reveal">
              <div className="subj-icon" style={{background:'rgba(245,158,11,0.2)'}}>🌍</div>
              <div className="subj-name">Geography</div>
              <div className="subj-count">340 documents</div>
            </div>
            <div className="subj-card reveal">
              <div className="subj-icon" style={{background:'rgba(99,102,241,0.2)'}}>📜</div>
              <div className="subj-name">History</div>
              <div className="subj-count">260 documents</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="section-inner">
          <div className="reveal" style={{textAlign:'center'}}>
            <div className="section-tag">Pricing</div>
            <h2 className="section-title">Affordable for every student in Malawi</h2>
            <p className="section-sub" style={{margin:'0 auto'}}>Pay with Airtel Money or TNM Mpamba — no bank account or card needed.</p>
          </div>
          <div className="pricing-grid">
            <div className="price-card reveal">
              <div className="price-name">Daily</div>
              <div className="price-amount">MWK 300</div>
              <div className="price-period">per day</div>
              <div className="price-divider"></div>
              <div className="price-feature"><div className="price-check"><svg viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#0d7a55" strokeWidth="1.4" strokeLinecap="round"/></svg></div>Unlimited downloads for 24 hours</div>
              <div className="price-feature"><div className="price-check"><svg viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#0d7a55" strokeWidth="1.4" strokeLinecap="round"/></svg></div>All subjects and levels</div>
              <div className="price-feature"><div className="price-check"><svg viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#0d7a55" strokeWidth="1.4" strokeLinecap="round"/></svg></div>Pay via Airtel or TNM</div>
              <Link href="/auth/register" className="price-btn price-btn-outline">Get daily pass</Link>
            </div>
            <div className="price-card featured reveal">
              <div className="popular-badge">Most popular</div>
              <div className="price-name">Monthly</div>
              <div className="price-amount" style={{color:'#fff'}}>MWK 2,500</div>
              <div className="price-period">per month</div>
              <div className="price-divider"></div>
              <div className="price-feature"><div className="price-check"><svg viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="rgba(26,171,120,0.9)" strokeWidth="1.4" strokeLinecap="round"/></svg></div>Unlimited downloads all month</div>
              <div className="price-feature"><div className="price-check"><svg viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="rgba(26,171,120,0.9)" strokeWidth="1.4" strokeLinecap="round"/></svg></div>All subjects and levels</div>
              <div className="price-feature"><div className="price-check"><svg viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="rgba(26,171,120,0.9)" strokeWidth="1.4" strokeLinecap="round"/></svg></div>Priority access to new uploads</div>
              <div className="price-feature"><div className="price-check"><svg viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="rgba(26,171,120,0.9)" strokeWidth="1.4" strokeLinecap="round"/></svg></div>Best value — saves MWK 4,500 vs daily</div>
              <Link href="/auth/register" className="price-btn price-btn-solid">Get monthly plan</Link>
            </div>
            <div className="price-card reveal">
              <div className="price-name">Weekly</div>
              <div className="price-amount">MWK 1,000</div>
              <div className="price-period">per week</div>
              <div className="price-divider"></div>
              <div className="price-feature"><div className="price-check"><svg viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#0d7a55" strokeWidth="1.4" strokeLinecap="round"/></svg></div>Unlimited downloads for 7 days</div>
              <div className="price-feature"><div className="price-check"><svg viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#0d7a55" strokeWidth="1.4" strokeLinecap="round"/></svg></div>All subjects and levels</div>
              <div className="price-feature"><div className="price-check"><svg viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#0d7a55" strokeWidth="1.4" strokeLinecap="round"/></svg></div>Perfect for exam prep week</div>
              <Link href="/auth/register" className="price-btn price-btn-outline">Get weekly pass</Link>
            </div>
          </div>
          <div className="upload-free-card reveal">
            <div className="ufc-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4v12M8 8l4-4 4 4M4 20h16" stroke="#0e1a14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="ufc-text">
              <h4>Or upload 5–10 documents and get access for free</h4>
              <p>Share your own notes, past papers, or textbooks with the community. Once your uploads are verified and approved, you automatically receive a free 1-day access pass — no payment needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{background: 'var(--surface)'}}>
        <div className="section-inner">
          <div className="reveal">
            <div className="section-tag">Platform features</div>
            <h2 className="section-title">Built to keep quality high</h2>
            <p className="section-sub">Every document is checked, verified, and protected before it reaches students.</p>
          </div>
          <div className="features-grid">
            <div className="feat-card reveal">
              <div className="feat-icon">
                <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M11 2l2.5 7h7l-5.5 4 2 7L11 16l-6 4 2-7L1.5 9h7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="feat-body">
                <h3>Smart duplicate detection</h3>
                <p>Every upload is checked with 4 layers of detection — file hash, metadata matching, content similarity (NLP), and image fingerprinting. Duplicate files are rejected before they enter the library.</p>
              </div>
            </div>
            <div className="feat-card reveal">
              <div className="feat-icon">
                <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="16" height="16" rx="3"/><path d="M8 11l2.5 2.5 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="feat-body">
                <h3>Admin review queue</h3>
                <p>Every uploaded document passes through an admin review before going live. Admins can preview, approve, reject, or edit metadata — ensuring only quality materials reach students.</p>
              </div>
            </div>
            <div className="feat-card reveal">
              <div className="feat-icon">
                <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2C7 2 3 6 3 11s4 9 9 9 9-4 9-9-4-9-9-9z"/><path d="M12 7v5l3 3" strokeLinecap="round"/></svg>
              </div>
              <div className="feat-body">
                <h3>Secure signed downloads</h3>
                <p>Download links expire after 5 minutes. Files are stored securely in the cloud and cannot be shared or hotlinked — every download is tied to a verified, paying user.</p>
              </div>
            </div>
            <div className="feat-card reveal">
              <div className="feat-icon">
                <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 11h18M3 6h18M3 16h12" strokeLinecap="round"/></svg>
              </div>
              <div className="feat-body">
                <h3>Pay with mobile money</h3>
                <p>Fully integrated with Airtel Money and TNM Mpamba — the two most widely used mobile payment platforms in Malawi. No bank account or credit card required.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Start learning smarter today</h2>
        <p>Join thousands of Malawian students and teachers already using MalawiEduHub.</p>
        <div className="cta-btns">
          <Link href="/auth/register" className="btn-white">Create free account</Link>
          <Link href="/browse" className="btn-white-outline">Browse documents</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="nav-logo" style={{color:'#fff', textDecoration:'none'}}>
              <div className="nav-logo-icon">
                <svg viewBox="0 0 18 18" fill="none"><path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round"/><path d="M9 2v10M2 6l7 4 7-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </div>
              MalawiEduHub
            </Link>
            <p>Malawi&apos;s centralized digital library for educational resources — past papers, notes, textbooks and more.</p>
          </div>
          <div className="footer-col">
            <h4>Library</h4>
            <Link href="/browse">Browse all</Link>
            <a href="#">MSCE papers</a>
            <a href="#">JCE papers</a>
            <a href="#">Primary</a>
            <a href="#">University</a>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <Link href="/auth/register">Register</Link>
            <Link href="/auth/login">Sign in</Link>
            <Link href="/upload">Upload document</Link>
            <a href="#">My downloads</a>
            <a href="#">Subscription</a>
          </div>
          <div className="footer-col">
            <h4>Info</h4>
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>About</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')}>Pricing</a>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms of use</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2025 MalawiEduHub. All rights reserved.</div>
          <div className="footer-payments">
            <span style={{fontSize:'12px', color:'rgba(255,255,255,0.3)', marginRight:'4px'}}>Payments via</span>
            <div className="pay-badge">AIRTEL MONEY</div>
            <div className="pay-badge">TNM MPAMBA</div>
          </div>
        </div>
      </footer>

      <script dangerouslySetInnerHTML={{__html: `
        const reveals = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
              setTimeout(() => entry.target.classList.add('visible'), i * 80);
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });
        reveals.forEach(el => observer.observe(el));
      `}} />
    </>
  )
}
