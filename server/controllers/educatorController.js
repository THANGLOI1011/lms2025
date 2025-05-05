import { clerkClient } from '@clerk/express';
import Course from '../models/Course.js';
import { v2 as cloudinary } from 'cloudinary';
import { Purchase } from '../models/Purchase.js';
import { CourseProgress } from '../models/CourseProgress.js';
import User from '../models/User.js'


// Cập nhật role của user thành Educator
export const updateRoleToEducator = async (req, res) => {
    try {
        console.log("Auth Data:", req.auth);
        const userId = req.auth.userId;

        // Lấy dữ liệu user từ Clerk để kiểm tra role hiện tại
        const user = await clerkClient.users.getUser(userId);
        const currentRole = user.publicMetadata?.role || "student"; // Nếu không có thì mặc định là "student"

        // Kiểm tra nếu đã là educator thì không cần update
        if (currentRole === "educator") {
            return res.json({ success: true, message: "User is already an educator" });
        }

       

        res.json({ success: true, message: "You can publish a course now" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// Thêm khóa học mới
export const addCourse = async (req, res) => {
    try {
        const { courseData } = req.body;
        const imageFile = req.file; // Sửa `req.imageFile` → `req.file`
        const educatorId = req.auth.userId;

        if (!imageFile) {
            return res.status(400).json({ success: false, message: 'Thumbnail not attached' });
        }

        // Parse dữ liệu từ courseData
        const parsedCourseData = JSON.parse(courseData);
        parsedCourseData.educator = educatorId;

        // Tạo khóa học mới
        const newCourse = await Course.create(parsedCourseData);

        // Upload ảnh lên Cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path);
        newCourse.courseThumbnail = imageUpload.secure_url;
        await newCourse.save();

        res.json({ success: true, message: 'Course Added' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Update course
export const updateCourse = async (req, res) => {
    try {
      const { id } = req.params; // Lấy ID khóa học từ URL
      const updatedData = req.body; // Lấy dữ liệu cập nhật từ request body
  
      const course = await Course.findByIdAndUpdate(id, updatedData, { new: true }); // Cập nhật khóa học và trả về bản ghi mới
  
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
  
      res.json({ success: true, message: 'Course updated successfully!', course });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
// Get Educator Courses

export  const getEducatorCourses = async (req,res) => {
    try{
        const educator = req.auth.userId
        const courses = await Course.find({educator})
        res.json({success:true, courses})
    }catch(error){
        res.json({success:false,message:error.message})
    }
}


// get educator dashboard data
export const educatorDashboardData = async (req, res) => {
    try{
        const educator = req.auth.userId
        const courses = await Course.find({educator})
        const totalCourses = courses.length
        const courseIds = courses.map(course => course._id)
        // caculator total
        const purchases = await Purchase.find({
            courseId: {$in:courseIds},
            status:'pending'
        })

        const totalEarnings = purchases.reduce((sum, purchase) => { // Tính tổng số tiền lấy từ purchase sử dụng reduce để tính tổng
            return sum + (purchase.amount || 0); 
        }, 0);

        // collect unique
        const enrolledStudentsData =[];
        for(const course of courses){ // Duyệt qua từng khóa học
            const students = await User.find({ // Tìm kiếm học viên đã đăng ký khóa học
                _id:{$in:course.enrolledStudents} // Lấy danh sách học viên đã đăng ký khóa học
            },'name imageUrl')
            students.forEach(student => { // Duyệt qua từng học viên
                enrolledStudentsData.push({ // Thêm thông tin học viên vào danh sách
                    courseTitle:course.courseTitle, // Tên khóa học
                    student // Thông tin học viên
                })
            })
        }
        res.json({success:true,dashboardData:{
            totalEarnings,enrolledStudentsData,totalCourses //trả về tổng số tiền, danh sách học viên đã đăng ký và tổng số khóa học
        }})
    }catch(error){
        res.json({success:false,message:error.message})
    }
}

// get enrolled students data with purchase data
export const getEnrolledStudentsData = async (req, res) => { // danh sách student enrolled
    try {
      const courses = await Course.find({ educator: req.auth.userId }).populate('enrolledStudents', 'name imageUrl');
  
      const enrolledStudents = courses.flatMap(course =>
        course.enrolledStudents.map(student => ({
          student: {
            _id: student._id,
            name: student.name,
            imageUrl: student.imageUrl || 'https://via.placeholder.com/50',
          },
          courseId: course._id.toString(),
          courseTitle: course.title,
          status: 'enrolled',
          enrollmentDate: course.createdAt,
        }))
      );
  
      res.json({ success: true, enrolledStudents });
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  export const removeEnrolledStudent = async (req, res) => {
    const { studentId, courseId } = req.params; // Extract studentId and courseId from the request parameters
  
    try {
      // Assuming the EnrolledStudents collection has both student and courseId fields
      const result = await EnrolledStudents.findOneAndDelete({ student: studentId, courseId });
  
      if (!result) {
        return res.status(404).json({ success: false, message: 'Enrollment not found' });
      }
  
      res.json({ success: true, message: 'Enrollment removed successfully' });
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      res.status(500).json({ success: false, message: 'Failed to remove enrollment' });
    }
  };
  export const removePurchaseAndEnrollment = async (req, res) => {
    const { purchaseId } = req.params; // Lấy purchaseId từ params

    try {
        // 1. Tìm `Purchase` dựa trên `_id`
        const purchase = await Purchase.findById(purchaseId);

        if (!purchase) {
            return res.status(404).json({ success: false, message: "Purchase not found" });
        }

        // 2. Lấy `userId` và `courseId` từ `Purchase`
        const { userId, courseId } = purchase;

        // 3. Tìm `Course` dựa trên `courseId` và xóa `userId` khỏi `enrolledStudents`
        const courseProgress = await CourseProgress.findOneAndDelete({ userId, courseId });

        if (!courseProgress) {
            console.log("No CourseProgress found for this user and course.");
        } else {
            console.log("CourseProgress deleted:", courseProgress._id);
        }

        const course = await Course.findByIdAndUpdate(
            courseId,
            { $pull: { enrolledStudents: userId } }, // Xóa `userId` khỏi danh sách `enrolledStudents`
            { new: true } // Trả về bản ghi đã cập nhật
        );

        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { enrolledCourses: courseId } }, // Xóa courseId khỏi danh sách enrolledCourses
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }


        // 4. Xóa bản ghi `Purchase`
        await Purchase.findByIdAndDelete(purchaseId);

        res.json({
            success: true,
            message: "Purchase and enrollment removed successfully",
            purchase: purchase,
            courseProgress: courseProgress,
            updatedCourse: course,
        });
    } catch (error) {
        console.error("Error removing purchase and enrollment:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



export const getAllPurchases = async (req, res) => {
    try {
        // Lấy tất cả các purchase từ database
        const purchases = await Purchase.find();

        if (!purchases || purchases.length === 0) { // nếu không có mặt định bằng 0
            return res.status(404).json({ success: false, message: "No purchases found" });
        }
        
        const purchasesWithDetails = await Promise.all(
            purchases.map(async (purchase) => {
                // Lấy thông tin user
                const user = await User.findById(purchase.userId, 'name imageUrl');

                // Lấy thông tin course
                const course = await Course.findById(purchase.courseId, 'courseTitle enrolledStudents');

                const courseProgress = await CourseProgress.findOne(
                    { userId: purchase.userId, courseId: purchase.courseId },
                    'totalChapters'
                );

                return {
                    ...purchase.toObject(),
                    student: user || { name: "Unknown", imageUrl: "https://via.placeholder.com/50" },
                    course: course || { courseTitle: "Unknown Course", enrolledStudents: [] },
                    courseProgressId: courseProgress?.totalChapters || null,
                };
            })
        );


        // Trả về danh sách các purchase
        res.json({ success: true,  purchases: purchasesWithDetails});
    } catch (error) {
        console.error("Error fetching purchases:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const deleteCourse = async (req, res) => {
    try {
      const { courseId } = req.params;
  
      // Kiểm tra xem khóa học có tồn tại không
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course does not exist.' });
      }
  
      // Xóa khóa học trong database
      await Course.findByIdAndDelete(courseId);
  
      res.json({ success: true, message: 'Course deleted successfully.' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

