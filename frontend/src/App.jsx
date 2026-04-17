import { useState, useEffect } from 'react'
import UploadStep from './components/UploadStep'
import CustomizeStep from './components/CustomizeStep'
import ShareStep from './components/ShareStep'
import FormFiller from './components/FormFiller'
import './App.css'

export default function App() {
  const [step, setStep] = useState(1)
  const [formConfig, setFormConfig] = useState(null)
  const [shareId, setShareId] = useState(null)
  const [parseKey, setParseKey] = useState(0)

  // Form-filler mode: ?form=<id>
  const [fillerForm, setFillerForm] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('form')

    if (id) {
      // Form-filler mode
      try {
        const raw = localStorage.getItem(`gs_form_${id}`)
        if (raw) {
          setFillerForm(JSON.parse(raw))
        } else {
          // Unicode-safe base64 decode
          const decoded = JSON.parse(
            decodeURIComponent(
              atob(id)
                .split('')
                .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join(''),
            ),
          )
          setFillerForm(decoded)
        }
      } catch {
        // invalid param — just show wizard
      }
    } else {
      // Restore draft from a previous editing session
      const draft = localStorage.getItem('gs_draft')
      if (draft) {
        try {
          setFormConfig(JSON.parse(draft))
          setStep(2)
        } catch {
          localStorage.removeItem('gs_draft')
        }
      }
    }
  }, [])

  if (fillerForm) {
    return <FormFiller form={fillerForm} />
  }

  const handleParsed = (config) => {
    setFormConfig(config)
    setParseKey((k) => k + 1)
    setStep(2)
  }

  const handleCustomized = (config) => {
    setFormConfig(config)
    localStorage.removeItem('gs_draft') // draft is now published
    const id = crypto.randomUUID()
    localStorage.setItem(`gs_form_${id}`, JSON.stringify(config))

    // Unicode-safe base64 (btoa alone breaks on ₹, emoji, etc.)
    const b64 = btoa(
      encodeURIComponent(JSON.stringify(config)).replace(
        /%([0-9A-F]{2})/g,
        (_, hex) => String.fromCharCode(parseInt(hex, 16)),
      ),
    )
    setShareId(b64)
    setStep(3)
  }

  return (
    <div>
      {step === 1 && <UploadStep onParsed={handleParsed} />}
      {step === 2 && (
        <CustomizeStep
          key={parseKey}
          formConfig={formConfig}
          onNext={handleCustomized}
          onBack={() => {
            localStorage.removeItem('gs_draft')
            setStep(1)
          }}
        />
      )}
      {step === 3 && (
        <ShareStep
          formConfig={formConfig}
          shareId={shareId}
          onBack={() => setStep(2)}
          onBackToUpload={() => {
            localStorage.removeItem('gs_draft')
            setStep(1)
          }}
        />
      )}
    </div>
  )
}
