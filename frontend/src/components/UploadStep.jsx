import { useState, useRef } from 'react'
import { SAMPLE_FORM } from '../data/sampleForm'
import { parseFormWithAI } from '../utils/parseFormWithAI'

function deepClone(o) {
  return JSON.parse(JSON.stringify(o))
}

const BLANK_FORM = {
  title: 'Guest Sheet',
  subtitle: 'Dealership guest information form',
  sections: [
    { id: 's1', name: 'Guest Info',        icon: 'person',  fields: [] },
    { id: 's2', name: 'Trade-In Vehicle',  icon: 'car',     fields: [] },
    { id: 's3', name: 'Desired Vehicle',   icon: 'car',     fields: [] },
  ],
}

const FALLBACK_STEPS = [
  'Scanning uploaded form…',
  'Detecting field boundaries…',
  'Identifying field labels…',
  'Grouping into sections…',
  'Finalizing digital form…',
]

export default function UploadStep({ onParsed }) {
  const [dragOver, setDragOver]   = useState(false)
  const [status, setStatus]       = useState('idle')   // 'idle' | 'parsing' | 'error'
  const [parseMsg, setParseMsg]   = useState('')
  const [parsePct, setParsePct]   = useState(0)
  const [errorMsg, setErrorMsg]   = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileRef = useRef(null)

  const runParse = async (file) => {
    setStatus('parsing')
    setErrorMsg('')

    const isPDF   = file?.type === 'application/pdf'
    const isImage = file?.type?.startsWith('image/')

    // ── Real AI path (images and PDFs both go to the backend) ────────────────
    if (isImage || isPDF) {
      const steps = isPDF
        ? [
            'Reading PDF…',
            'Analyzing form structure…',
            'Extracting field labels…',
            'Building digital form…',
          ]
        : [
            'Uploading image…',
            'Analyzing form structure…',
            'Extracting field labels…',
            'Building digital form…',
          ]

      let stepIdx = 0
      setParseMsg(steps[0])
      setParsePct(10)

      const ticker = setInterval(() => {
        stepIdx = Math.min(stepIdx + 1, steps.length - 1)
        setParseMsg(steps[stepIdx])
        setParsePct(Math.min(10 + stepIdx * 22, 88))
      }, 1800)

      try {
        const result = await parseFormWithAI(file)
        clearInterval(ticker)
        setParseMsg('Done!')
        setParsePct(100)
        setTimeout(() => onParsed(result), 400)
      } catch (err) {
        clearInterval(ticker)
        setStatus('error')
        setErrorMsg(err.message || 'AI parsing failed. Please try again.')
      }
      return
    }

    // ── Fallback for any unsupported file type ────────────────────────────────
    runFallback()
  }

  const runFallback = () => {
    setStatus('parsing')
    let i = 0
    setParseMsg(FALLBACK_STEPS[0])
    setParsePct(10)
    const tick = setInterval(() => {
      i += 1
      setParseMsg(FALLBACK_STEPS[Math.min(i, FALLBACK_STEPS.length - 1)])
      setParsePct(Math.round(((i + 1) / FALLBACK_STEPS.length) * 100))
      if (i >= FALLBACK_STEPS.length - 1) {
        clearInterval(tick)
        setTimeout(() => onParsed(deepClone(SAMPLE_FORM)), 600)
      }
    }, 700)
  }

  const handleFile = (file) => {
    if (!file) return
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    }
    runParse(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const resetToIdle = () => {
    setStatus('idle')
    setPreviewUrl(null)
    setErrorMsg('')
    setParsePct(0)
  }

  return (
    <div className="upload-page">
      <header className="upload-header">
        <div className="logo-mark">
          <LogoIcon />
          <span>GuestSheet</span>
        </div>
      </header>

      <main className="upload-main">
        <div className="upload-card">
          {/* Step bar */}
          <div className="step-bar">
            <StepDot n={1} label="Upload Sheet"     state="active"  />
            <div className="step-connector" />
            <StepDot n={2} label="Parse & Customize" state="pending" />
            <div className="step-connector" />
            <StepDot n={3} label="Share Link"        state="pending" />
          </div>

          <h1 className="upload-heading">
            Digitize your paper guest sheet<br />instantly
          </h1>
          <p className="upload-sub">
            Upload a photo of your existing form. Our AI will automatically
            parse it and generate a customizable, shareable digital form for
            your team.
          </p>

          {status === 'parsing' && (
            <ParseProgress msg={parseMsg} pct={parsePct} previewUrl={previewUrl} />
          )}

          {status === 'error' && (
            <div className="parse-error">
              <ErrorIcon />
              <p className="parse-error-msg">{errorMsg}</p>
              <div className="parse-error-actions">
                <button className="btn-ghost" onClick={resetToIdle} type="button">
                  Try Again
                </button>
                <button
                  className="btn-sample"
                  onClick={() => onParsed(deepClone(BLANK_FORM))}
                  type="button"
                >
                  <EditIcon /> Enter Fields Manually
                </button>
                <button
                  className="btn-sample"
                  onClick={() => onParsed(deepClone(SAMPLE_FORM))}
                  type="button"
                >
                  <SampleIcon /> Use Sample Form
                </button>
              </div>
            </div>
          )}

          {status === 'idle' && (
            <>
              {/* Drop zone */}
              <div
                className={`drop-zone${dragOver ? ' drag-over' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              >
                <UploadIcon />
                <p className="drop-cta">
                  <span className="drop-link">Click to upload</span> or drag and drop
                </p>
                <p className="drop-hint">
                  Supports clear photos, PNG, JPG, or PDF (max 10MB)
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>

              <div className="or-divider"><span>OR</span></div>

              {/* Sample form CTA */}
              <div className="sample-box">
                <div className="sample-text">
                  <strong>Don't have a form handy?</strong>
                  <p>Try out the platform using our sample dealership guest sheet.</p>
                </div>
                <button
                  className="btn-sample"
                  onClick={() => onParsed(deepClone(SAMPLE_FORM))}
                >
                  <SampleIcon />
                  Use Sample Form
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepDot({ n, label, state }) {
  return (
    <div className={`step-dot-wrap step-${state}`}>
      <div className="step-dot">
        {state === 'done' ? <CheckIcon /> : n}
      </div>
      <span className="step-dot-label">{label}</span>
    </div>
  )
}

function ParseProgress({ msg, pct, previewUrl }) {
  return (
    <div className="parse-state">
      {previewUrl ? (
        <img src={previewUrl} alt="Uploaded form" className="parse-thumb" />
      ) : (
        <div className="parse-icon-wrap"><ScanIcon /></div>
      )}
      <p className="parse-msg">{msg}</p>
      <div className="parse-bar-wrap">
        <div
          className="parse-bar-fill"
          style={{ width: `${pct}%`, transition: 'width 0.6s ease' }}
        />
      </div>
      <p className="parse-pct">{pct}%</p>
    </div>
  )
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e8b73d" strokeWidth="2">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="13" y2="16" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <div className="upload-icon-wrap">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </svg>
    </div>
  )
}

function SampleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="13" y2="16" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ScanIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffc943" strokeWidth="1.5">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
