import express from 'express';
import { addCourse, educatorDashboardData, getEducatorCourses, getEnrolledStudentsData, updateRoleToEducator } from '../controllers/educatorController.js';
import upload from '../configs/multer.js';
import { protecEducator } from '../middlewares/authMiddleware.js';

const educatorRouter = express.Router();

// Route cập nhật role thành educator
educatorRouter.get('/update-role', updateRoleToEducator);

// Route thêm khóa học (Upload image trước, sau đó xác thực quyền educator)
educatorRouter.post('/add-course', upload.single('image'), protecEducator, addCourse);
educatorRouter.get('/courses',protecEducator,getEducatorCourses)
educatorRouter.get('/dashboard',protecEducator,educatorDashboardData)
educatorRouter.get('/enrolled-students',protecEducator,getEnrolledStudentsData)


export default educatorRouter;
