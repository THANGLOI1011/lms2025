import express from 'express'
import { getAllCourse, getCourseId } from '../controllers/courseController.js'
const courseRRouter = express.Router()

courseRRouter.get('/all',getAllCourse)
courseRRouter.get('/:id',getCourseId)

export default courseRRouter;