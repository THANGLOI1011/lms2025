import User from "../models/User.js"
import mongoose from 'mongoose'; // Import mongoose
import { Purchase } from "../models/Purchase.js";
import Stripe from 'stripe'
import Course from "../models/Course.js";
import dotenv from 'dotenv'
import { CourseProgress } from "../models/CourseProgress.js";

// get user data
export const getUserData = async (req, res) => {
    try {
        const userId = req.auth.userId; 
        console.log("User ID from Clerk:", userId);

        if (!userId) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        // Tìm user theo clerkId thay vì _id
        const user = await User.findOne({ clerkId: userId });
        console.log("User found:", user);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};



// user enrolled course with lecture links
export const userEnrolledCourses = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const userData = await User.findById(userId).populate({
            path: 'enrolledCourses',
            strictPopulate: false // Tắt kiểm tra strict mode
        });

        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({ success: true, enrolledCourses: userData.enrolledCourses || [] });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
// purchase course
export const purchaseCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const { origin } = req.headers;
        const userId = req.auth.userId;
        const user = await User.findById(userId);
        if (user.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: 'You have already purchased this course.' });
        }

        // Chuyển đổi courseId thành ObjectId
        const objectCourseId = new mongoose.Types.ObjectId(courseId);

        // Kiểm tra xem user có tồn tại không
        const userData = await User.findById(userId);
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        // Kiểm tra xem course có tồn tại không
        const courseData = await Course.findById(objectCourseId);
        if (!courseData) {
            return res.json({ success: false, message: "Course not found" });
        }

        // Tính toán số tiền cần thanh toán
        const amount = (courseData.coursePrice - (courseData.discount * courseData.coursePrice) / 100).toFixed(2);

        // Tạo dữ liệu thanh toán
        const purchaseData = {
            courseId: courseData._id,
            userId: userId,
            amount: amount,
        };

        const newPurchase = await Purchase.create(purchaseData);

        // Stripe gateway initialize
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
        const currency = process.env.CURRENCY.toLowerCase();

        // Tạo line_items cho Stripe
        const line_items = [
            {
                price_data: {
                    currency,
                    product_data: {
                        name: courseData.courseTitle,
                    },
                    unit_amount: Math.floor(newPurchase.amount * 100), // Đúng công thức tiền tệ của Stripe
                },
                quantity: 1,
            },
        ];

        // Tạo phiên thanh toán Stripe
        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            metadata: {
                purchaseId: newPurchase._id.toString(),
            },
        });

        // **Cập nhật danh sách khóa học đã đăng ký của user**
        await User.findByIdAndUpdate(userId, { 
            $push: { enrolledCourses: courseData._id } 
        });

        // **Cập nhật danh sách học viên của khóa học**
        await Course.findByIdAndUpdate(courseData._id, { 
            $push: { enrolledStudents: userId } 
        });

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};



// update user course progress
 export const updateUserCourseProgress = async(req,res) => {
    try {
        const userId = req.auth.userId
        const { courseId,lectureId } = req.body
        const progressData = await CourseProgress.findOne({userId,courseId})

        if(progressData){
            if(progressData.lectureCompleted.includes(lectureId)){
                return res.json({success:true,message:'Lecture Already Completed'})
            }

            progressData.lectureCompleted.push(lectureId)
            await progressData.save()
        }else{
            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted:[lectureId]
            })
        }
        res.json({success:true,message:'Progress Updated'})
    }catch(error){

    }   
}
// get user course progress
export const getUserCourseProgress = async(req,res) => {
    try{
        const userId = req.auth.userId
        const { courseId } = req.body
        const progressData = await CourseProgress.findOne({userId,courseId})
        res.json({success:true,progressData})

    }catch(error){
        res.json({success:false,message:error.message})
    }
}


// add user ratings to course

export const addUserRating = async (req, res) => {
    const userId = req.auth.userId;
    const { courseId, rating } = req.body;

    if (!courseId || !userId || typeof rating !== "number" || rating < 1 || rating > 5) {
        return res.json({ success: false, message: "Invalid Details" });
    }

    try {
        const course = await Course.findById(courseId);
        if (!course) {
            return res.json({ success: false, message: "Course Not Found" });
        }

        const user = await User.findById(userId);
        if (!user || !user.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: "User Not Found or Not Enrolled in Course" });
        }

        // Kiểm tra xem user đã rating trước đó chưa
        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId.toString() === userId);
        if (existingRatingIndex > -1) {
            course.courseRatings[existingRatingIndex].rating = rating;
        } else {
            course.courseRatings.push({ userId, rating });
        }

        await course.save();
        return res.json({ success: true, message: "Rating added" });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};


