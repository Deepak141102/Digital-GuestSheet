import { useState } from 'react'

const CRM_LIST = [
  'DealerSocket',
  'VinSolutions',
  'CDK Global',
  'Reynolds & Reynolds',
  'Dealertrack',
  'AutoSoft',
  'PBS Systems',
  'Dominion DMS',
  'Tekion',
  'DealerBuilt',
  'Frazer',
  'ProMax',
  'Dealer.com',
  'TitleTec',
  'AutoManager',
]

const WHAT_NEXT = [
  {
    id: 'test-drive',
    label: 'Add test drive form',
    desc: "Capture driver's license info and vehicle selection",
    icon: 'car',
  },
  {
    id: 'photo',
    label: 'Add photo capture',
    desc: 'Let customers photo their ID or trade-in vehicle',
    icon: 'camera',
  },
  {
    id: 'preapproval',
    label: 'Add pre-approval intake',
    desc: 'Collect financing details upfront',
    icon: 'dollar',
  },
  {
    id: 'inventory',
    label: 'Connect inventory',
    desc: 'Let customers browse your live inventory',
    icon: 'list',
  },
  {
    id: 'salesperson',
    label: 'Assign salesperson',
    desc: 'Route submissions to specific team members',
    icon: 'person',
  },
  {
    id: 'voice',
    label: 'Voice fill',
    desc: 'Speak to fill — AI transcribes and completes the form',
    icon: 'mic',
  },
]

export default function ShareStep({ formConfig, shareId, onBack, onBackToUpload }) {
  const [stage, setStage] = useState('email') // 'email' | 'share'
  const [creatorEmail, setCreatorEmail] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const [emailError, setEmailError] = useState('')

  // What's Next — CRM
  const [crmSearch, setCrmSearch] = useState('')
  const [selectedCRM, setSelectedCRM] = useState(null)
  const [showCRMPicker, setShowCRMPicker] = useState(false)
  const [customCRM, setCustomCRM] = useState('')
  const [customCRMSaved, setCustomCRMSaved] = useState(false)

  const shareUrl = (() => {
    const u = new URL(window.location.href)
    u.search = ''
    u.searchParams.set('form', shareId)
    return u.toString()
  })()

  const sendLinkEmail = async () => {
    if (!creatorEmail || emailSending) return
    setEmailSending(true)
    setEmailError('')
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: creatorEmail,
          subject: 'Your GuestSheet form link is ready',
          textBody: `Your guest sheet form is ready!\n\nShare this link with your team:\n${shareUrl}\n\nAnyone with the link can fill it out on any device — no account needed.`,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setEmailError(data.error || `Failed to send (${res.status})`)
        setEmailSending(false)
        return
      }
      setEmailSent(true)
      setStage('share')
    } catch (err) {
      setEmailError('Network error — could not reach the server')
    } finally {
      setEmailSending(false)
    }
  }

  const notifyMae = async (crmName) => {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mae@makingautoeasy.com',
          subject: `CRM Integration Request: ${crmName}`,
          textBody: [
            'A dealer submitted a CRM that is not in the list.',
            '',
            `CRM / DMS: ${crmName}`,
            creatorEmail ? `Dealer email: ${creatorEmail}` : 'Email: not provided',
            formConfig?.title ? `Form: ${formConfig.title}` : '',
            '',
            `Submitted: ${new Date().toLocaleString()}`,
          ].filter(Boolean).join('\n'),
        }),
      })
    } catch {
      // silent — don't block the UI
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const filteredCRMs = CRM_LIST.filter((c) =>
    c.toLowerCase().includes(crmSearch.toLowerCase()),
  )

  const NavBar = () => (
    <nav className="cust-nav">
      <div className="nav-logo">
        <LogoIcon />
        <span>GuestSheet</span>
      </div>
      <div className="nav-steps">
        <button className="nav-step done nav-step-btn" onClick={onBackToUpload} type="button">
          <CheckIcon /> Upload &amp; Parse
        </button>
        <span className="nav-step-line" />
        <button className="nav-step done nav-step-btn" onClick={onBack} type="button">
          <CheckIcon /> Customize
        </button>
        <span className="nav-step-line" />
        <span className="nav-step active">
          <span className="nav-num">3</span> Share Link
        </span>
      </div>
    </nav>
  )

  // ── Stage 1: Email gate ──────────────────────────────────────────────────
  if (stage === 'email') {
    return (
      <div className="share-page">
        <NavBar />
        <div className="share-main">
          <div className="email-gate-card">
            <div className="email-gate-icon">
              <EnvelopeIcon />
            </div>
            <h2>Where should we send your link?</h2>
            <p className="email-gate-desc">
              Enter your email and we'll deliver the shareable link straight to
              your inbox. You can also skip and copy it from the next screen.
            </p>
            <div className="email-gate-input-row">
              <input
                className="email-gate-input"
                type="email"
                placeholder="you@dealership.com"
                value={creatorEmail}
                onChange={(e) => setCreatorEmail(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && creatorEmail && sendLinkEmail()
                }
                autoFocus
              />
              <button
                className="btn-primary"
                onClick={sendLinkEmail}
                disabled={!creatorEmail || emailSending}
                type="button"
              >
                {emailSending && <SpinIcon />}
                {emailSending ? 'Sending…' : 'Send My Link'}
              </button>
            </div>
            {emailError && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center' }}>
                {emailError}
              </p>
            )}
            <button
              className="email-gate-skip"
              onClick={() => setStage('share')}
              type="button"
            >
              Skip — just show me the link →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Stage 2: Share card + What's Next ───────────────────────────────────
  return (
    <div className="share-page">
      <NavBar />
      <div className="share-main share-main-wide">
        <div className="share-twin">

          {/* ── Share card ─────────────────────────────────── */}
          <div className="share-card">
            <div className="share-success-icon">
              <CheckCircleIcon />
            </div>
            <h2>Your form is ready to share!</h2>

            {emailSent && (
              <div className="email-sent-banner">
                <CheckSmall /> Link sent to {creatorEmail}
              </div>
            )}

            <p className="share-desc">
              Share this link with your team. Anyone with the link can fill out
              the form on any device — no account needed.
            </p>

            <div className="share-url-row">
              <span className="share-url-text">{shareUrl}</span>
              <button
                className={`btn-copy${copied ? ' copied' : ''}`}
                onClick={copy}
                type="button"
              >
                {copied ? (
                  <><CheckSmall /> Copied!</>
                ) : (
                  <><CopyIcon /> Copy Link</>
                )}
              </button>
            </div>

            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-preview-form"
            >
              Open Form Preview →
            </a>

            <div className="share-features">
              <FeaturePill icon={<PhoneIcon />} text="Works on mobile & desktop" />
              <FeaturePill icon={<PdfIcon />} text="Auto-generates printable PDF" />
              <FeaturePill icon={<EmailIcon />} text="Emails a copy on submission" />
            </div>

            <div className="share-note">
              <InfoIcon />
              <span>
                The form configuration is encoded directly in the link — no
                account or server needed. Anyone with the link can open and fill
                the form on any device.
              </span>
            </div>

            <button
              className="btn-ghost start-over"
              onClick={() => {
                localStorage.removeItem('gs_draft')
                window.location.href = window.location.pathname
              }}
              type="button"
            >
              + Create Another Form
            </button>
          </div>

          {/* ── What's Next panel ──────────────────────────── */}
          <div className="whats-next-panel">
            <div className="wn-header">
              <SparkleIcon />
              <div>
                <h3 className="wn-title">What's Next</h3>
                <p className="wn-subtitle">Optional upgrades for your live form</p>
              </div>
            </div>

            {/* CRM card */}
            <div className="wn-card">
              <div className="wn-card-top">
                <div className="wn-card-icon">
                  <DatabaseIcon />
                </div>
                <div className="wn-card-info">
                  <div className="wn-card-title">Select your CRM</div>
                  <div className="wn-card-desc">
                    {selectedCRM && selectedCRM !== 'unlisted'
                      ? `Connected: ${selectedCRM}`
                      : 'Connect form submissions to your DMS'}
                  </div>
                </div>
                <button
                  className={`wn-badge ${selectedCRM ? 'wn-badge-done' : 'wn-badge-cta'}`}
                  onClick={() => setShowCRMPicker((p) => !p)}
                  type="button"
                >
                  {selectedCRM ? 'Change' : 'Select'}
                </button>
              </div>

              {showCRMPicker && (
                <div className="crm-picker">
                  <div className="crm-search-row">
                    <SearchIcon />
                    <input
                      className="crm-search-input"
                      placeholder="Search CRMs…"
                      value={crmSearch}
                      onChange={(e) => setCrmSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="crm-list">
                    {filteredCRMs.map((crm) => (
                      <button
                        key={crm}
                        className={`crm-option${selectedCRM === crm ? ' selected' : ''}`}
                        onClick={() => {
                          setSelectedCRM(crm)
                          setShowCRMPicker(false)
                          setCrmSearch('')
                        }}
                        type="button"
                      >
                        {crm}
                        {selectedCRM === crm && <CheckSmall />}
                      </button>
                    ))}
                    <button
                      className="crm-option crm-unlisted"
                      onClick={() => {
                        setSelectedCRM('unlisted')
                        setShowCRMPicker(false)
                        setCrmSearch('')
                      }}
                      type="button"
                    >
                      Mine isn't listed →
                    </button>
                  </div>
                </div>
              )}

              {selectedCRM === 'unlisted' && !customCRMSaved && (
                <div className="crm-custom-row">
                  <input
                    className="crm-custom-input"
                    placeholder="What DMS/CRM do you use?"
                    value={customCRM}
                    onChange={(e) => setCustomCRM(e.target.value)}
                  />
                  <button
                    className="btn-primary"
                    disabled={!customCRM}
                    onClick={() => {
                      setCustomCRMSaved(true)
                      notifyMae(customCRM)
                    }}
                    type="button"
                  >
                    Submit
                  </button>
                </div>
              )}

              {selectedCRM === 'unlisted' && customCRMSaved && (
                <div className="crm-custom-saved">
                  Thanks! We'll add support for <strong>{customCRM}</strong> — Mae will follow up.
                </div>
              )}
            </div>

            {/* Other next steps */}
            {WHAT_NEXT.map((step) => (
              <div key={step.id} className="wn-card">
                <div className="wn-card-top">
                  <div className="wn-card-icon">
                    <WnStepIcon id={step.icon} />
                  </div>
                  <div className="wn-card-info">
                    <div className="wn-card-title">{step.label}</div>
                    <div className="wn-card-desc">{step.desc}</div>
                  </div>
                  <span className="wn-badge wn-badge-soon">Soon</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

function FeaturePill({ icon, text }) {
  return (
    <div className="feature-pill">
      {icon}
      <span>{text}</span>
    </div>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e8b73d" strokeWidth="2">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="13" y2="16" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CheckSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  )
}

function PdfIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function EnvelopeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffc943" strokeWidth="1.5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function SpinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  )
}

function DatabaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function WnStepIcon({ id }) {
  if (id === 'car') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
  if (id === 'camera') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
  if (id === 'dollar') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
  if (id === 'list') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
  if (id === 'person') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
  if (id === 'mic') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
  return null
}
