import { config } from '../config/env.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'
import logger from '../utils/logger.js'

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// Keyword → field type inference (applied after AI response as a correction layer)
const TYPE_KEYWORDS = [
  { type: 'phone',    words: ['phone', 'mobile', 'cell', 'tel', 'fax', 'contact number', 'phone number'] },
  { type: 'email',    words: ['email', 'e-mail', 'mail address'] },
  { type: 'date',     words: ['date', 'dob', 'birthday', 'birth date', 'interview date', 'appointment', 'entry date', 'start date', 'end date', 'expiry', 'expiration'] },
  { type: 'number',   words: ['year', 'age', 'mileage', 'odometer', 'km', 'miles', 'price', 'amount', 'salary', 'budget', 'quantity', 'score', 'rating', 'rank', 'number', 'no.', 'num', 'zip', 'postal', 'postal code', 'sin', 'id number', 'license number', 'vin'] },
  { type: 'textarea', words: ['note', 'notes', 'comment', 'comments', 'description', 'remarks', 'additional', 'other info', 'message', 'feedback', 'reason', 'explain', 'details', 'summary'] },
  { type: 'checkbox', words: ['checkbox', 'check box', 'yes/no', 'y/n', 'agree', 'consent', 'confirm', 'acknowledge', 'opt-in', 'opt in'] },
  { type: 'select',   words: ['gender', 'salutation', 'title', 'province', 'state', 'country', 'condition', 'transmission', 'fuel type', 'body type', 'drive type', 'drivetrain', 'color', 'colour', 'language', 'payment', 'payment method', 'purchase type', 'contact method', 'preferred contact', 'marital status', 'employment status', 'relationship', 'credit', 'trim'] },
]

function inferType(fieldName, aiType) {
  if (!fieldName) return aiType
  const lower = fieldName.toLowerCase()
  for (const { type, words } of TYPE_KEYWORDS) {
    if (words.some((w) => lower.includes(w))) return type
  }
  return aiType
}

const FORM_PARSER_PROMPT = `You are a form digitizer for automotive dealerships. Analyze the uploaded paper form image and extract all form fields.

Return ONLY valid JSON with no markdown, no code fences, no explanation — just the raw JSON object:
{
  "title": "Guest Sheet",
  "subtitle": "Dealership guest information form",
  "sections": [
    {
      "id": "s1",
      "name": "Guest Info",
      "icon": "person",
      "fields": [
        { "id": "f1", "name": "First Name", "type": "text", "required": true },
        { "id": "f2", "name": "Last Name", "type": "text", "required": true },
        { "id": "f3", "name": "Phone Number", "type": "phone", "required": true },
        { "id": "f4", "name": "Email", "type": "email", "required": false },
        { "id": "f5", "name": "Payment Method", "type": "select", "required": false, "options": ["Finance", "Cash", "Lease"] }
      ]
    },
    {
      "id": "s2",
      "name": "Trade-In Vehicle",
      "icon": "car",
      "fields": [
        { "id": "f6", "name": "Year", "type": "number", "required": false },
        { "id": "f7", "name": "Make", "type": "text", "required": false },
        { "id": "f8", "name": "Model", "type": "text", "required": false },
        { "id": "f9", "name": "Mileage", "type": "number", "required": false },
        { "id": "f10", "name": "Condition", "type": "select", "required": false, "options": ["Excellent", "Good", "Fair", "Poor"] }
      ]
    },
    {
      "id": "s3",
      "name": "Desired Vehicle",
      "icon": "car",
      "fields": [
        { "id": "f11", "name": "Preferred Make", "type": "text", "required": false },
        { "id": "f12", "name": "Preferred Model", "type": "text", "required": false },
        { "id": "f13", "name": "Budget", "type": "number", "required": false }
      ]
    }
  ]
}

Each field object MUST have exactly these properties:
- "id": sequential string like "f1", "f2", "f3" ...
- "name": the field label as it appears on the form (string, required)
- "type": one of the valid types listed below (string, required)
- "required": true or false (boolean, required)
- "options": array of strings — ONLY include this property when type is "select"

SECTION RULES — always use exactly these 3 sections with these exact names:
1. "Guest Info" (icon: "person") — personal details: name, phone, email, address, ID, salesperson, etc.
2. "Trade-In Vehicle" (icon: "car") — the vehicle the customer currently owns and may trade in: make, model, year, mileage, VIN, condition, etc.
3. "Desired Vehicle" (icon: "car") — the vehicle the customer wants to buy: make, model, trim, colour, budget, financing, etc.

If the form has no trade-in fields, include "Trade-In Vehicle" with an empty fields array.
If the form has no desired vehicle fields, include "Desired Vehicle" with an empty fields array.
Place any field that does not clearly belong to a vehicle section into "Guest Info".

Field type rules — assign the MOST SPECIFIC type that fits:
- "phone"    → any phone, mobile, cell, fax, or contact number field
- "email"    → any email or e-mail address field
- "date"     → any date, DOB, birthday, interview date, appointment, entry date field
- "number"   → year, age, mileage, km, price, salary, score, rating, zip/postal code, VIN-like numeric fields
- "select"   → fields with a fixed set of choices (gender, province/state, condition, transmission, fuel type, colour, payment method, etc.) — always include "options": [...]
- "checkbox" → yes/no tick boxes, agreement/consent fields, boolean toggles
- "textarea" → notes, comments, remarks, description, feedback, multi-line fields
- "text"     → everything else (names, addresses, single-line free text)

Do NOT default everything to "text". Examine each field label carefully and choose the most accurate type.
For bilingual forms (e.g. French/English): use English as the field name.
Use sequential IDs: s1, s2, s3 for sections and f1, f2… for fields.`

export async function parseForm(file) {
  if (!file) {
    throw { message: 'No file uploaded', status: HTTP_STATUS.BAD_REQUEST }
  }

  const isPDF = file.mimetype === 'application/pdf'
  const isImage = file.mimetype.startsWith('image/')

  if (!isImage && !isPDF) {
    throw { message: 'Only image files and PDFs are supported', status: HTTP_STATUS.BAD_REQUEST }
  }

  if (isPDF) {
    throw {
      message: 'PDF uploads are not supported with OpenAI vision. Please upload an image (JPG, PNG, WEBP).',
      status: HTTP_STATUS.BAD_REQUEST,
    }
  }

  if (!SUPPORTED_TYPES.includes(file.mimetype)) {
    throw {
      message: `Unsupported image format "${file.mimetype}". Please upload a JPG, PNG, GIF, or WEBP file.`,
      status: HTTP_STATUS.BAD_REQUEST,
    }
  }

  const base64 = file.buffer.toString('base64')

  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: FORM_PARSER_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${file.mimetype};base64,${base64}`, detail: 'high' } },
            { type: 'text', text: 'Look at every line of this paper form. Identify and extract EVERY visible field — text inputs, checkboxes, dropdowns, date fields, phone fields. Do not skip any field. Return the complete JSON structure.' },
          ],
        },
      ],
    }),
  })

  if (!aiRes.ok) {
    const err = await aiRes.json().catch(() => ({}))
    logger.error('OpenAI API error', { error: err })
    throw { message: err.error?.message || `AI API returned ${aiRes.status}`, status: HTTP_STATUS.BAD_GATEWAY }
  }

  const responseData = await aiRes.json()
  const text = responseData.choices?.[0]?.message?.content || ''

  const finishReason = responseData.choices?.[0]?.finish_reason
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw { message: 'AI could not extract a form structure from this file', status: HTTP_STATUS.UNPROCESSABLE_ENTITY }
  }

  let parsed
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    if (finishReason === 'length') {
      throw {
        message: 'The form has too many fields to parse in one pass. Try uploading a clearer or cropped image with fewer fields.',
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }
    }
    throw { message: 'AI returned malformed JSON — please try again.', status: HTTP_STATUS.UNPROCESSABLE_ENTITY }
  }
  const VALID_TYPES = new Set(['text','phone','email','number','date','select','checkbox','textarea'])

  // Log a sample so we can see what the AI is actually returning
  const sampleField = parsed.sections?.[0]?.fields?.[0]
  if (sampleField) logger.info('Sample field from AI:', JSON.stringify(sampleField))

  let fIdx = 1
  parsed.sections = (parsed.sections || []).map((sec, si) => ({
    ...sec,
    id: sec.id || `s${si + 1}`,
    fields: (sec.fields || sec.form_fields || sec.items || []).map((f) => {
      // Try every plausible key the AI might use for the field label
      const name =
        f.name || f.label || f.title || f.text ||
        f.field_name || f.fieldName || f.field_label || f.fieldLabel ||
        f.question || f.description || f.placeholder || ''

      const aiType = VALID_TYPES.has(f.type) ? f.type
        : VALID_TYPES.has(f.field_type) ? f.field_type
        : 'text'
      const type = inferType(name, aiType)

      return {
        id: f.id || `f${fIdx++}`,
        name,
        type,
        required: typeof f.required === 'boolean' ? f.required
          : typeof f.is_required === 'boolean' ? f.is_required
          : false,
        ...(type === 'select' && (f.options || f.choices)?.length
          ? { options: f.options || f.choices }
          : {}),
      }
    }),
  }))

  logger.info(`Form parsed: ${parsed.sections.length} section(s), fields: ${parsed.sections.map(s => s.fields.length).join('/')}`)

  return {
    status: HTTP_STATUS.OK,
    data: parsed,
    message: 'Form parsed successfully',
  }
}
