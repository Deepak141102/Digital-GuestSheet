import { parseForm } from '../services/form.service.js'

export const parseFormController = async (req, res, next) => {
  try {
    const result = await parseForm(req.file)
    res.status(result.status).json({ data: result.data, message: result.message })
  } catch (err) {
    next(err)
  }
}
