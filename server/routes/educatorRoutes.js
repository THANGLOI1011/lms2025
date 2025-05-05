import express from 'express';
import { addCourse, educatorDashboardData, getEducatorCourses,updateCourse, removeEnrolledStudent, updateRoleToEducator,getEnrolledStudentsData,getAllPurchases, removePurchaseAndEnrollment,deleteCourse} from '../controllers/educatorController.js';
import upload from '../configs/multer.js';
import { protecEducator } from '../middlewares/authMiddleware.js';

const educatorRouter = express.Router();

// Route cập nhật role thành educator
educatorRouter.get('/update-role', updateRoleToEducator);

// Route thêm khóa học (Upload image trước, sau đó xác thực quyền educator)
educatorRouter.post('/add-course', upload.single('image'), protecEducator, addCourse);
educatorRouter.get('/courses',protecEducator,getEducatorCourses)
educatorRouter.get('/dashboard',protecEducator,educatorDashboardData)
educatorRouter.get('/enrolled-students', protecEducator, getEnrolledStudentsData)
educatorRouter.get('/purchase', protecEducator, getAllPurchases);
// Updated route to delete an enrolled student
educatorRouter.delete('/enrolled-students/:studentId/:courseId', protecEducator, removeEnrolledStudent);
educatorRouter.delete('/purchases/:purchaseId', protecEducator, removePurchaseAndEnrollment );
educatorRouter.delete('/courses/:courseId', protecEducator, deleteCourse);
educatorRouter.put('/courses/:id', protecEducator, updateCourse);




export default educatorRouter;
