import User from "../models/User.js"
import mongoose from 'mongoose'; // Import mongoose

// get user data
export const getUserData = async (req,res) => {
    try{
        const userId = req.auth.userId;
        console.log("userId:", userId); // In userId

        if (!mongoose.Types.ObjectId.isValid(userId)) { // Check if userId is a valid ObjectId
            return res.json({success:false,message:'Invalid user ID'});
        }

        const user = await User.findById(userId);
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
export const userEnrolledCourses = async (req,res) => {
    try{
        const userId = req.auth.userId;
        const userData = await User.findById(userId).populate('enrolledCourses')
        res.json({success:true ,enrolledCourses:userData.enrolledCourses})

    }catch(error){
        res.json({success:false,message:error.message})
    }
}