import { clerkClient } from '@clerk/express';
import Course from '../models/Course.js';
import { v2 as cloudinary } from 'cloudinary';
import { Purchase } from '../models/Purchase.js';

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
export const educatorDashboardData = async () => {
    try{
        const educator = req.auth.userId
        const courses = await Course.find({educator})
        const totalCourses = courses.length
        const courseIds = courses.map(course => course._id)
        // caculator total
        const purchases = await Purchase.find({
            courseId: {$in:courseIds},
            status:'completed'
        })

        const totalEarnings = purchases.reduce((sum,purchase) => sum + purchase.amount,0)

        // collect unique
        const enrolledStudentsData =[];
        for(const course of courses){
            const students = await User.find({
                _id:{$in:course.enrolledStudents}
            },'name imageUrl')
            students.forEach(student => {
                enrolledStudentsData.push({
                    courseTitle:course.courseTitle,
                    student
                })
            })
        }
        res.json({success:true,dashboardData:{
            totalEarnings,enrolledStudentsData,totalCourses
        }})
    }catch(error){
        res.json({success:false,message:error.message})
    }
}

// get enrolled students data with purchase data
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({ educator });

        console.log("Courses found:", courses); // 🛠 Kiểm tra danh sách khóa học

        const courseId = courses.map(course => course._id);
        console.log("Course IDs:", courseId); // 🛠 Kiểm tra courseId có dữ liệu không

        if (courseId.length === 0) {
            return res.json({ success: false, message: "No courses found for this educator" });
        }

        const purchases = await Purchase.find({
            courseId: { $in: courseId },
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle');

        console.log("Purchases found:", purchases); // 🛠 Kiểm tra danh sách purchases

        if (purchases.length === 0) {
            return res.json({ success: false, message: "No enrolled students found" });
        }

        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            status: purchase.status,
            purchaseDate: purchase.createdAt
        }));

        res.json({ success: true, enrolledStudents });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
