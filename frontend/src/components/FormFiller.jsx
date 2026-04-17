import { useState } from 'react'
import { generateFormPDF } from '../utils/generatePDF'
import { sendFormEmail } from '../utils/sendEmail'

export default function FormFiller({ form }) {
  const [formData, setFormData]   = useState({})
  const [email, setEmail]         = useState('')
  const [errors, setErrors]         = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [emailSent, setEmailSent]   = useState(false)

  const setValue = (fieldId, value) => {
    setFormData((p) => ({ ...p, [fieldId]: value }))
    if (errors[fieldId]) setErrors((p) => ({ ...p, [fieldId]: null }))
  }

  const validate = () => {
    const e = {}
    form.sections.forEach((sec) =>
      sec.fields.forEach((f) => {
        if (f.required && !formData[f.id]) e[f.id] = 'Required'
      }),
    )
    if (!email) e._email = 'Email is required to receive your PDF copy'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      // Scroll to first error
      const first = document.querySelector('.field-error')
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)

    // Generate and download PDF
    const doc = generateFormPDF(form, formData, email)
    doc.save(`${form.title.replace(/\s+/g, '_')}.pdf`)

    // Send email with PDF attached (silently skipped if SendGrid is not configured)
    let emailOk = false
    try {
      await sendFormEmail(form, formData, email, doc)
      emailOk = true
    } catch {
      // Email failed — PDF already downloaded, don't block the user
    }

    setEmailSent(emailOk)
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="filler-page">
        <div className="filler-container">
          <div className="filler-card success-state">
            <div className="success-circle">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>Form Submitted!</h2>
            <p>Your PDF has been downloaded.</p>
            {emailSent && (
              <p className="notif-line">
                <CheckSmallIcon /> Email sent to <strong>{email}</strong>
              </p>
            )}
            <button
              className="btn-primary"
              onClick={() => {
                setSubmitted(false)
                setFormData({})
                setEmail('')
                setErrors({})
                setEmailSent(false)
              }}
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="filler-page">
      <header className="filler-header">
        <div className="nav-logo">
          <LogoIcon />
          <span>GuestSheet</span>
        </div>
      </header>

      <div className="filler-container">
        <div className="filler-card">
          <h1 className="filler-title">{form.title}</h1>
          <p className="filler-sub">{form.subtitle}</p>

          <form onSubmit={handleSubmit} noValidate>
            {form.sections.map((sec) => (
              <div key={sec.id} className="filler-section">
                <div className="filler-sec-header">
                  <SectionIcon icon={sec.icon} />
                  <h3>{sec.name}</h3>
                </div>

                {sec.fields.map((field) => (
                  <FormField
                    key={field.id}
                    field={field}
                    value={formData[field.id] ?? ''}
                    onChange={(v) => setValue(field.id, v)}
                    error={errors[field.id]}
                  />
                ))}
              </div>
            ))}

            {/* Delivery options */}
            <div className="filler-section filler-email-section">
              <div className="filler-sec-header">
                <EmailIcon />
                <h3>Send Copy To</h3>
              </div>

              {/* Email */}
              <div className={`form-group${errors._email ? ' has-error' : ''}`}>
                <label>
                  Email Address <span className="req-star">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors._email) setErrors((p) => ({ ...p, _email: null }))
                  }}
                  placeholder="you@example.com"
                  className={errors._email ? 'input-error' : ''}
                />
                {errors._email && (
                  <span className="field-error">{errors._email}</span>
                )}
              </div>

            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner /> Submitting…
                </>
              ) : (
                'Submit & Download PDF'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function FormField({ field, value, onChange, error }) {
  const base = `${error ? 'input-error' : ''}`

  let input
  if (field.type === 'select' && field.options?.length) {
    input = (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={base}
      >
        <option value="">Select…</option>
        {field.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    )
  } else if (field.type === 'checkbox') {
    return (
      <div className={`form-group form-group-check${error ? ' has-error' : ''}`}>
        <label className="check-label">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>
            {field.name}
            {field.required && <span className="req-star"> *</span>}
          </span>
        </label>
        {error && <span className="field-error">{error}</span>}
      </div>
    )
  } else if (field.type === 'textarea') {
    input = (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={`Enter ${(field.name || '').toLowerCase()}`}
        className={base}
      />
    )
  } else {
    const typeMap = {
      phone: 'tel',
      email: 'email',
      number: 'number',
      date: 'date',
    }
    input = (
      <input
        type={typeMap[field.type] || 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${(field.name || '').toLowerCase()}`}
        className={base}
      />
    )
  }

  return (
    <div className={`form-group${error ? ' has-error' : ''}`}>
      <label>
        {field.name}
        {field.required && <span className="req-star"> *</span>}
      </label>
      {input}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

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

function SectionIcon({ icon }) {
  if (icon === 'person') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}


function CheckSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
