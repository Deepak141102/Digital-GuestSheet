export function isEmailConfigured() {
  // Config lives on the backend — always attempt; backend returns 503 if not set
  return true
}

/**
 * Send a form submission email with the PDF attached.
 * Calls backend POST /api/send-email which uses SendGrid server-side.
 *
 * @param {object} form          - form config object
 * @param {object} formData      - submitted field values
 * @param {string} recipientEmail
 * @param {import('jspdf').jsPDF} pdfDoc - jsPDF document instance
 */
export async function sendFormEmail(form, formData, recipientEmail, pdfDoc) {
  // Build plain-text summary
  const lines = []
  form.sections.forEach((sec) => {
    lines.push(`\n─── ${sec.name.toUpperCase()} ───`)
    sec.fields.forEach((field) => {
      const raw = formData[field.id]
      const display =
        raw !== undefined && raw !== null && raw !== '' ? String(raw) : '—'
      lines.push(`${field.name}: ${display}`)
    })
  })

  // Convert jsPDF output to base64 (strip the data-URI prefix)
  const pdfBase64 = pdfDoc.output('datauristring').split(',')[1]
  const fileName  = `${form.title.replace(/\s+/g, '_')}.pdf`

  const res = await fetch('/api/send-email', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email:    recipientEmail,
      subject:  `${form.title} — Your Submission Copy`,
      textBody: [
        `Form: ${form.title}`,
        `Submitted: ${new Date().toLocaleString()}`,
        '',
        lines.join('\n'),
      ].join('\n'),
      pdfBase64,
      fileName,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Email API error ${res.status}`)
  }
}
