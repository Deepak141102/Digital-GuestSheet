import sendgrid from '@sendgrid/mail'
import { config } from '../config/env.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'
import logger from '../utils/logger.js'

if (config.sendgridApiKey) {
  sendgrid.setApiKey(config.sendgridApiKey)
}

export async function sendEmail({ email, subject, textBody, pdfBase64, fileName }) {
  if (!config.sendgridApiKey || !config.mailUser) {
    throw { message: 'SendGrid credentials not configured on server', status: HTTP_STATUS.SERVICE_UNAVAILABLE }
  }

  const msg = {
    to: email,
    from: config.mailUser,
    subject,
    text: textBody,
    ...(pdfBase64 && fileName
      ? {
          attachments: [{
            content: pdfBase64,
            filename: fileName,
            type: 'application/pdf',
            disposition: 'attachment',
          }],
        }
      : {}),
  }

  await sendgrid.send(msg)
  logger.info(`Email sent to ${email}`, { subject })

  return {
    status: HTTP_STATUS.OK,
    data: null,
    message: 'Email sent successfully',
  }
}
