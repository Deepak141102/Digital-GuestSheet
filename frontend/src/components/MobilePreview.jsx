export default function MobilePreview({ config }) {
  return (
    <div className="preview-wrapper">
      <p className="preview-label">MOBILE FORM PREVIEW</p>
      <div className="phone-frame">
        {/* notch */}
        <div className="phone-notch" />
        <div className="phone-screen">
          <div className="form-preview-scroll">
            <h4 className="fp-title">{config.title}</h4>
            <p className="fp-subtitle">{config.subtitle}</p>

            {config.sections.map((section) => (
              <div key={section.id} className="fp-section">
                <div className="fp-section-header">
                  <SectionIcon icon={section.icon} />
                  <span>{section.name}</span>
                </div>
                {section.fields.map((field) => (
                  <div key={field.id} className="fp-field">
                    <label className="fp-label">
                      {field.name}
                      {field.required && (
                        <span className="fp-required"> *</span>
                      )}
                    </label>
                    <PreviewInput type={field.type} options={field.options} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewInput({ type, options }) {
  if (type === 'checkbox') {
    return (
      <label className="fp-checkbox-row">
        <input type="checkbox" disabled />
        <span>Yes</span>
      </label>
    )
  }
  if (type === 'select') {
    return (
      <select className="fp-input" disabled>
        <option>Select…</option>
        {options?.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    )
  }
  if (type === 'textarea') {
    return <textarea className="fp-input fp-textarea" disabled rows={2} />
  }
  return (
    <input
      className="fp-input"
      type={
        type === 'phone'
          ? 'tel'
          : type === 'number'
          ? 'number'
          : type === 'date'
          ? 'date'
          : type === 'email'
          ? 'email'
          : 'text'
      }
      disabled
    />
  )
}

function SectionIcon({ icon }) {
  if (icon === 'person') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}
