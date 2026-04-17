import { Router } from 'express'
import multer from 'multer'
import { parseFormController } from '../controllers/form.controller.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

router.post('/parse-form', upload.single('file'), parseFormController)

export default router
