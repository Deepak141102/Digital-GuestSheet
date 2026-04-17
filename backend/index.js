import express from 'express'
import cors from 'cors'
import { config } from './src/config/env.js'
import logger from './src/utils/logger.js'
import { errorMiddleware } from './src/middleware/errorMiddleware.js'
import formRoutes from './src/routes/form.route.js'
import emailRoutes from './src/routes/email.route.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api', formRoutes)
app.use('/api', emailRoutes)

app.get('/api/health', (_req, res) =>
  res.json({ data: { ok: true }, message: 'Server is healthy' }),
)

// Centralized error handler — must be last
app.use(errorMiddleware)

app.listen(config.port, () => {
  logger.info(`GuestSheet API server running on http://localhost:${config.port}`)
})
