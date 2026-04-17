import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../../')

// Replace Cyrillic lookalikes that break HTTP header ByteString validation
const CYRILLIC_TO_ASCII = {
  '\u0410': 'A', '\u0430': 'a', '\u0412': 'B', '\u0421': 'C', '\u0441': 'c',
  '\u0415': 'E', '\u0435': 'e', '\u041D': 'H', '\u041A': 'K', '\u041C': 'M',
  '\u041E': 'O', '\u043E': 'o', '\u0420': 'P', '\u0440': 'p', '\u0422': 'T',
  '\u0425': 'X', '\u0445': 'x', '\u0423': 'Y', '\u0443': 'y',
}
const sanitizeKey = (str = '') =>
  str.split('').map((c) => CYRILLIC_TO_ASCII[c] ?? c).join('')

function parseEnvFile(filePath) {
  try {
    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)
    const result = {}
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      result[key] = val
    }
    return result
  } catch {
    return {}
  }
}

const envFile = parseEnvFile(join(ROOT, '.env'))
const envLocal = parseEnvFile(join(ROOT, '.env.local'))
const raw = { ...envFile, ...envLocal, ...process.env }

const REQUIRED = ['OPENAI_API_KEY']
for (const key of REQUIRED) {
  if (!raw[key]) throw new Error(`Missing required environment variable: ${key}`)
}

export const config = {
  port: raw.PORT || '8080',
  openaiApiKey: sanitizeKey(raw.OPENAI_API_KEY || ''),
  sendgridApiKey: raw.SENDGRID_API_KEY || '',
  mailUser: raw.MAIL_USER || '',
  twilioAccountSid: raw.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: raw.TWILIO_AUTH_TOKEN || '',
  twilioFrom: raw.TWILIO_FROM || '',
}
