import express from 'express'
import { getAllCourse, getCourseId,  getUserEnrolledCourses } from '../controllers/courseController.js'
const courseRouter = express.Router()

courseRouter.get('/all',getAllCourse)
courseRouter.get('/:id',getCourseId)
courseRouter.get('/enrolled-courses', getUserEnrolledCourses) // Lấy danh sách enrolled students theo courseId

export default courseRouter;