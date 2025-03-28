import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Use Clerk ID as _id
    clerkId: { type: String, unique: true, sparse: true }, // Ensure uniqueness but allow null values
    name: { type: String, required: true },
    email: { type: String, required: false, unique: true, sparse: true }, // Allow optional email but enforce uniqueness
    imageUrl: { type: String, required: false }, // Optional profile image
    role: { 
        type: String, 
        enum: ["student", "educator", "admin"], 
        default: "student"  // ✅ Fix: Mặc định user mới là "student"
    },
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: [] }] // Default empty array
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
