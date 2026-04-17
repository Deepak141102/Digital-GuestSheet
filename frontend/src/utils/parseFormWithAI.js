/**
 * Send an image or PDF to the backend /api/parse-form endpoint,
 * which calls Claude and returns a structured form config.
 */
export async function parseFormWithAI(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/parse-form', {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type header — the browser sets it automatically
    // with the correct multipart boundary when using FormData.
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Parse failed (HTTP ${response.status})`)
  }

  const body = await response.json()
  return body.data
}
