import { z } from 'zod'

export const sendEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  textBody: z.string().default(''),
  pdfBase64: z.string().optional(),
  fileName: z.string().optional(),
})
