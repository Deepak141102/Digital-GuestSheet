import { sendEmail } from '../services/email.service.js'
import { sendEmailSchema } from '../validators/email.validator.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

export const sendEmailController = async (req, res, next) => {
  try {
    const parsed = sendEmailSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        data: null,
        message: parsed.error.errors[0].message,
        error: true,
      })
    }

    const result = await sendEmail(parsed.data)
    res.status(result.status).json({ data: result.data, message: result.message })
  } catch (err) {
    next(err)
  }
}
