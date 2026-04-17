import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './src/config/env.js'
import logger from './src/utils/logger.js'
import { errorMiddleware } from './src/middleware/errorMiddleware.js'
import formRoutes from './src/routes/form.route.js'
import emailRoutes from './src/routes/email.route.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api', formRoutes)
app.use('/api', emailRoutes)

app.get('/api/health', (_req, res) =>
  res.json({ data: { ok: true }, message: 'Server is healthy' }),
)

// Serve frontend static files in production only
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../frontend/dist')
  app.use(express.static(frontendDist))
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')))
}

// Centralized error handler — must be last
app.use(errorMiddleware)

app.listen(config.port, () => {
  logger.info(`GuestSheet API server running on http://localhost:${config.port}`)
})
