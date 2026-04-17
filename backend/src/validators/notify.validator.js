import { z } from 'zod'

export const notifySchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required'),
  channel: z.enum(['sms', 'whatsapp']).default('sms'),
})
