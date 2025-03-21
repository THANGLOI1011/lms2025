import User from "../models/User.js"
import mongoose from 'mongoose'; // Import mongoose
import { Purchase } from "../models/Purchase.js";
import Stripe from 'stripe'
import Course from "../models/Course.js";
import dotenv from 'dotenv'

// get user data
export const getUserData = async (req,res) => {
    try{
        const userId = req.auth.userId;
        console.log("userId:", userId); // In userId

        if (!userId) { // Check if userId is a valid ObjectId
            return res.json({success:false,message:'Invalid user ID'});
        }

        const user = await User.findOne({ _id: userId });
        console.log("user:", user); // In user

        if(!user){
            return res.json({success:false,message:'User not found'});
        }
        res.json({success:true,user});
    }catch(error){
        console.error("Error:", error); // In error
        res.json({success:false,message:error.message });
    }
}

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

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

