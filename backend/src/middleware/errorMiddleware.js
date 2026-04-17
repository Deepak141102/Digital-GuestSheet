import { HTTP_STATUS } from '../utils/httpStatus.js'
import logger from '../utils/logger.js'

export const errorMiddleware = (err, _req, res, _next) => {
  const status = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR
  const message = err.message || 'Internal server error'

  logger.error(message, { status, stack: err.stack })

  res.status(status).json({ data: null, message, error: true })
}
